from collections import defaultdict
from itertools import takewhile
from random import sample as random_sample
from random import shuffle as random_shuffle

import graphene
from graphene.pyutils.enum import Enum as PyEnum
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyConnectionField, SQLAlchemyObjectType
from graphene_sqlalchemy.utils import is_mapped
from graphql_relay.connection.arrayconnection import offset_to_cursor
from pyramid.security import Everyone
from sqlalchemy import desc, func, join, select, or_, and_, cast
from sqlalchemy import literal_column
from sqlalchemy.dialects.postgresql import ARRAY, VARCHAR
from sqlalchemy.orm import joinedload

import assembl.graphql.docstrings as docs
from assembl import models
from assembl.auth import P_MODERATE, CrudPermissions
from assembl.auth.util import user_has_permission
from assembl.models.action import SentimentOfPost
from assembl.models.idea import MessageView
from .attachment import Attachment
from .document import Document
from .langstring import (LangStringEntry, LangStringEntryInput,
                         langstring_from_input_entries, resolve_langstring,
                         resolve_langstring_entries,
                         update_langstring_from_input_entries)
from .permissions_helpers import require_cls_permission, require_instance_permission
from .types import SecureObjectType, SQLAlchemyUnion
from .user import AgentProfile
from .utils import (
    abort_transaction_on_exception, get_fields, get_root_thematic_for_phase,
    create_root_thematic, create_attachment,
    update_attachment, create_idea_announcement, get_attachments_with_purpose)

EMBED_ATTACHMENT = models.AttachmentPurpose.EMBED_ATTACHMENT.value
MEDIA_ATTACHMENT = models.AttachmentPurpose.MEDIA_ATTACHMENT.value
ANNOUNCEMENT_BODY_ATTACHMENT = models.AttachmentPurpose.ANNOUNCEMENT_BODY_ATTACHMENT.value


class TagResult(graphene.ObjectType):
    __doc__ = docs.TagResult.__doc__
    score = graphene.Float(description=docs.TagResult.score)
    count = graphene.Int(description=docs.TagResult.count)
    value = graphene.String(description=docs.TagResult.value)


class SentimentAnalysisResult(graphene.ObjectType):
    __doc__ = docs.SentimentAnalysisResult.__doc__
    positive = graphene.Float(description=docs.SentimentAnalysisResult.positive)
    negative = graphene.Float(description=docs.SentimentAnalysisResult.negative)
    count = graphene.Int(description=docs.SentimentAnalysisResult.count)


class IdeaInterface(graphene.Interface):
    __doc__ = docs.IdeaInterface.__doc__
    title = graphene.String(lang=graphene.String(), description=docs.IdeaInterface.title)
    title_entries = graphene.List(LangStringEntry, description=docs.IdeaInterface.title_entries)
    description = graphene.String(lang=graphene.String(), description=docs.IdeaInterface.description)
    description_entries = graphene.List(LangStringEntry, description=docs.IdeaInterface.description_entries)
    top_keywords = graphene.List(TagResult, description=docs.IdeaInterface.top_keywords)
    nlp_sentiment = graphene.Field(SentimentAnalysisResult, description=docs.IdeaInterface.nlp_sentiment)
    num_posts = graphene.Int(description=docs.IdeaInterface.num_posts)
    num_total_posts = graphene.Int(description=docs.IdeaInterface.num_total_posts)
    num_contributors = graphene.Int(description=docs.IdeaInterface.num_contributors)
    num_votes = graphene.Int(description=docs.IdeaInterface.num_votes)
    num_children = graphene.Int(discussion_phase_id=graphene.Int(), description=docs.IdeaInterface.num_children)
    img = graphene.Field(Document, description=docs.IdeaInterface.img)
    order = graphene.Float(description=docs.IdeaInterface.order)
    live = graphene.Field(lambda: IdeaUnion, description=docs.IdeaInterface.live)
    message_view_override = graphene.String(description=docs.IdeaInterface.message_view_override)
    total_sentiments = graphene.Int(required=True, description=docs.IdeaInterface.total_sentiments)
    vote_specifications = graphene.List(
        'assembl.graphql.vote_session.VoteSpecificationUnion',
        required=True, description=docs.IdeaInterface.vote_specifications)
    type = graphene.String(description=docs.IdeaInterface.type)
    parent_id = graphene.ID(description=docs.Idea.parent_id)
    parent = graphene.Field(lambda: IdeaUnion, description=docs.Idea.parent)
    ancestors = graphene.List(graphene.ID, description=docs.Idea.ancestors)
    children = graphene.List(lambda: IdeaUnion, description=docs.Idea.children)
    questions = graphene.List(lambda: Question, description=docs.Idea.questions)
    announcement = graphene.Field(lambda: IdeaAnnouncement, description=docs.Idea.announcement)
    message_columns = graphene.List(lambda: IdeaMessageColumn, description=docs.Idea.message_columns)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_description(self, args, context, info):
        description = resolve_langstring(self.description, args.get('lang'))
        if description is None:
            return u''

        return description

    def resolve_description_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'description')

    def resolve_top_keywords(self, args, context, info):
        result = self.top_keywords(display_lang=args.get('lang'))
        return [TagResult(score=r.score, value=r.value, count=r.count) for r in result]

    def resolve_nlp_sentiment(self, args, context, info):
        result = self.sentiments()
        return SentimentAnalysisResult(**result._asdict())

    def resolve_num_total_posts(self, args, context, info):
        if isinstance(self, models.RootIdea):
            return self.num_posts
        else:
            return self.discussion.root_idea.num_posts

    def resolve_num_posts(self, args, context, info):
        # Return the number of posts bound to this idea.
        # Special case for root: do not count all posts, but only those bound to an idea.
        if isinstance(self, models.RootIdea):
            return self.num_posts - self.num_orphan_posts
        else:
            return self.num_posts

    def resolve_img(self, args, context, info):
        attachments = get_attachments_with_purpose(self.attachments, EMBED_ATTACHMENT)
        if attachments:
            return attachments[0].document

    def resolve_order(self, args, context, info):
        return self.get_order_from_first_parent()

    def resolve_num_children(self, args, context, info):
        _it = models.Idea.__table__
        _ilt = models.IdeaLink.__table__
        _target_it = models.Idea.__table__.alias()
        j = join(_ilt, _it, _ilt.c.source_id == _it.c.id
                 ).join(_target_it, _ilt.c.target_id == _target_it.c.id)
        num = select([func.count(_ilt.c.id)]).select_from(j).where(
            (_ilt.c.tombstone_date == None) & (_it.c.tombstone_date == None) & (  # noqa: E711
                _it.c.id == self.id) & (_target_it.c.tombstone_date == None) & (~_target_it.c.sqla_type.in_(('question', 'vote_proposal')))

        ).correlate_except(_ilt)
        return self.db.execute(num).fetchone()[0]

    def resolve_vote_specifications(self, args, context, info):
        return self.criterion_for

    def resolve_total_sentiments(self, args, context, info):
        return self.get_total_sentiments()

    def resolve_type(self, args, context, info):
        return self.__class__.__name__

    def resolve_parent_id(self, args, context, info):
        if not self.parents:
            return None

        parent = self.parents[0]
        return parent.graphene_id() if parent else None

    def resolve_parent(self, args, context, info):
        if not self.parents:
            return None

        return self.parents[0]

    def resolve_ancestors(self, args, context, info):
        # We use id_only=True and models.Idea.get on purpose, to
        # use a simpler ancestors query and use Idea identity map.
        return [models.Idea.get(id).graphene_id()
                for id in self.get_all_ancestors(id_only=True)]

    def resolve_children(self, args, context, info):
        # filter on child.hidden to not include the root thematic in the children of root_idea  # noqa: E501
        return [child for child in self.get_children() if not child.hidden and not isinstance(child, (models.Question, models.VoteProposal))]

    def resolve_questions(self, args, context, info):
        return self.get_questions()

    def resolve_announcement(self, args, context, info):
        return self.get_applicable_announcement()

    def resolve_num_contributors(self, args, context, info):
        if self.message_view_override != MessageView.voteSession.value:
            return self.num_contributors

        if not self.vote_session:
            return 0

        query = self.vote_session.get_voter_ids_query()
        return query.count()

    def resolve_num_votes(self, args, context, info):
        if not self.vote_session:
            return 0

        return self.vote_session.get_num_votes()


class IdeaAnnouncementInput(graphene.InputObjectType):
    __doc__ = docs.IdeaAnnouncement.__doc__
    title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.IdeaAnnouncement.title_entries)
    body_attachments = graphene.List(graphene.String, description=docs.IdeaAnnouncement.body_attachments)
    body_entries = graphene.List(LangStringEntryInput, required=True, description=docs.IdeaAnnouncement.body_entries)
    quote_entries = graphene.List(LangStringEntryInput, required=False, description=docs.IdeaAnnouncement.quote_entries)
    summary_entries = graphene.List(LangStringEntryInput, description=docs.IdeaAnnouncement.summary_entries)


class IdeaAnnouncement(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.IdeaAnnouncement.__doc__

    class Meta:
        model = models.IdeaAnnouncement
        interfaces = (Node,)
        only_fields = ('id',)

    title = graphene.String(lang=graphene.String(), description=docs.IdeaAnnouncement.title)
    title_entries = graphene.List(LangStringEntry, required=True, description=docs.IdeaAnnouncement.title_entries)
    body = graphene.String(lang=graphene.String(), description=docs.IdeaAnnouncement.body)
    body_attachments = graphene.List(Attachment, required=False, description=docs.IdeaAnnouncement.body_attachments)
    body_entries = graphene.List(LangStringEntry, required=True, description=docs.IdeaAnnouncement.body_entries)
    quote = graphene.String(lang=graphene.String(), description=docs.IdeaAnnouncement.quote)
    quote_entries = graphene.List(LangStringEntry, required=False, description=docs.IdeaAnnouncement.quote_entries)
    summary = graphene.String(lang=graphene.String(), description=docs.IdeaAnnouncement.summary)
    summary_entries = graphene.List(LangStringEntry, required=False, description=docs.IdeaAnnouncement.summary_entries)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_body(self, args, context, info):
        return resolve_langstring(self.body, args.get('lang'))

    def resolve_body_attachments(self, args, context, info):
        return get_attachments_with_purpose(self.idea.attachments, ANNOUNCEMENT_BODY_ATTACHMENT)

    def resolve_body_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'body')

    def resolve_quote(self, args, context, info):
        return resolve_langstring(self.quote, args.get('lang'))

    def resolve_quote_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'quote')

    def resolve_summary(self, args, context, info):
        return resolve_langstring(self.summary, args.get('lang'))

    def resolve_summary_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'summary')


class IdeaMessageColumn(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.IdeaMessageColumn.__doc__

    class Meta:
        model = models.IdeaMessageColumn
        interfaces = (Node,)
        only_fields = ('id', 'message_classifier', 'color')

    index = graphene.Int(description=docs.IdeaMessageColumn.index)
    idea = graphene.Field(lambda: Idea, description=docs.IdeaMessageColumn.idea)
    name = graphene.String(lang=graphene.String(), description=docs.IdeaMessageColumn.name)
    name_entries = graphene.List(LangStringEntry, required=True, description=docs.IdeaMessageColumn.name_entries)
    title = graphene.String(lang=graphene.String(), description=docs.IdeaMessageColumn.title)
    title_entries = graphene.List(LangStringEntry, required=True, description=docs.IdeaMessageColumn.title_entries)
    column_synthesis = graphene.Field('assembl.graphql.post.Post', description=docs.IdeaMessageColumn.column_synthesis)
    num_posts = graphene.Int(description=docs.IdeaMessageColumn.num_posts)

    def resolve_idea(self, args, context, info):
        if self.idea:
            return self.idea

    def resolve_name(self, args, context, info):
        return resolve_langstring(self.name, args.get('lang'))

    def resolve_name_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'name')

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_column_synthesis(self, args, context, info):
        return self.get_column_synthesis()

    def resolve_num_posts(self, args, context, info):
        related = self.idea.get_related_posts_query(
            partial=True, include_deleted=False, include_moderating=False)
        return models.Post.query.join(
            related, models.Post.id == related.c.post_id
        ).filter(
            models.Content.message_classifier == self.message_classifier
        ).count()

    def resolve_index(self, args, context, info):
        count = self.get_positional_index()
        return count


class VoteResults(graphene.ObjectType):
    __doc__ = docs.VoteResults.__doc__

    num_participants = graphene.Int(required=True, description=docs.VoteResults.num_participants)
    participants = graphene.List(AgentProfile, required=True, description=docs.VoteResults.participants)

    def resolve_num_participants(self, args, context, info):
        return len(self.participant_ids)

    def resolve_participants(self, args, context, info):
        participants = [models.AgentProfile.get(participant_id)
                        for participant_id in self.participant_ids]
        return participants


posts_order_types_enum = PyEnum('PostsOrderTypes', (
    ('chronological', 'chronological'),
    ('reverse_chronological', 'reverse_chronological'),
    ('score', 'score'),
    ('popularity', 'popularity'),
))
PostOrderTypes = graphene.Enum.from_enum(posts_order_types_enum)


class Idea(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.IdeaInterface.__doc__

    class Meta:
        model = models.Idea
        interfaces = (Node, IdeaInterface)
        only_fields = ('id',)

    # TODO: Look into seperating synthesis_title from 'What you need to know',
    # they mean different things
    # This is the "What you need to know"
    synthesis_title = graphene.String(lang=graphene.String(), description=docs.Idea.synthesis_title)
    posts = SQLAlchemyConnectionField('assembl.graphql.post.PostConnection',
                                      description=docs.Idea.posts,
                                      posts_order=graphene.Argument(
                                          type=PostOrderTypes,
                                          required=False,
                                          description=docs.Idea.posts_order,
                                      ),
                                      only_my_posts=graphene.Argument(
                                          type=graphene.Boolean,
                                          required=False,
                                          description=docs.Idea.only_my_posts,
                                      ),
                                      my_posts_and_answers=graphene.Argument(
                                          type=graphene.Boolean,
                                          required=False,
                                          description=docs.Idea.my_posts_and_answers,
                                      ),
                                      hashtags=graphene.Argument(
                                          type=graphene.List(graphene.String),
                                          required=False,
                                          description=docs.Idea.hashtags,
                                      ))
    contributors = graphene.List(AgentProfile, description=docs.Idea.contributors)
    vote_results = graphene.Field(VoteResults, required=True, description=docs.Idea.vote_results)

    def resolve_vote_results(self, args, context, info):
        vote_specifications = self.criterion_for
        if not vote_specifications:
            vote_results = VoteResults()
            vote_results.participant_ids = []
            return vote_results

        participant_ids = self.get_voter_ids()
        vote_results = VoteResults()
        vote_results.participant_ids = participant_ids
        return vote_results

    @classmethod
    def is_type_of(cls, root, context, info):
        # This is the method defined in SQLAlchemyObjectType where
        # we changed the isinstance by a type comparison.
        # For a node query, graphql in
        # graphene/types/typemap.py(43)resolve_type()
        # which calls graphql/execution/executor.py(351)get_default_resolve_type_fn()  # noqa: E501
        # will try to know the object type from the SA object.
        # It actually iterate over all registered object types and return
        # the first one where is_type_of return True.
        # And here we have in the following order Idea, Question.
        # So a node query on a Question was returning the Idea object type.  # noqa: E501
        # Here we fix the issue by overriding the is_type_of method
        # for the Idea type to do a type comparison so that
        # models.Question which
        # inherits from models.Idea doesn't return true
        if isinstance(root, cls):
            return True
        if not is_mapped(type(root)):
            raise Exception((
                'Received incompatible instance "{}".'
            ).format(root))
        # return isinstance(root, cls._meta.model)  # this was the original code  # noqa: E501
        return type(root) == cls._meta.model or type(root) == models.VoteProposal or type(root) == models.RootIdea

    def resolve_synthesis_title(self, args, context, info):
        return resolve_langstring(self.synthesis_title, args.get('lang'))

    def resolve_posts(self, args, context, info):
        Post = models.Post
        order = args.get('posts_order')
        only_my_posts = args.get('only_my_posts', False)
        my_posts_and_answers = args.get('my_posts_and_answers', False)
        hashtags = args.get('hashtags', [])
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        # include_deleted=None means all posts (live and tombstoned)
        related = self.get_related_posts_query(partial=True, include_deleted=None)
        # The related query returns a list of (<PropositionPost id=2 >, None) instead of <PropositionPost id=2 > when authenticated, this is why we do another query here:  # noqa: E501
        fields = get_fields(info)
        no_pagination = args.get('first') is None and args.get('after') is None
        sentiments_only = no_pagination and sorted(fields.get('edges', {}).get('node', {}).keys()) == [u'publicationState', u'sentimentCounts']

        query = Post.query.join(
            related, Post.id == related.c.post_id
        )
        user_id = context.authenticated_userid
        session = Post.default_db
        if my_posts_and_answers:
            # recursive cte that gets array of ancestor for each post
            posts_hierarchy_parent = session.query(
                Post.id,
                literal_column("ARRAY[]::INTEGER[]").label("ancestors")
            ).filter(Post.parent_id == None, Post.discussion_id == discussion_id  # noqa: E711
            ).cte(name='posts_hierarchy', recursive=True)
            posts_hierarchy_child = session.query(
                Post.id,
                func.array_append(posts_hierarchy_parent.c.ancestors, Post.parent_id)
            ).filter(Post.parent_id == posts_hierarchy_parent.c.id)
            posts_hierarchy = posts_hierarchy_parent.union_all(posts_hierarchy_child)

            # get a mapping of posts with parent posts which are posts created by current user
            # NOTE : we can't use select([func.unnest(...) as a subrequest  # FIXME retry with sqlalchemy > 1.1
            ancestors_by_creator = session.query(
                posts_hierarchy.c.id,
                func.array(literal_column(
                    'SELECT UNNEST(ancestors) INTERSECT SELECT id FROM post WHERE creator_id = %s' % str(int(user_id)))
                ).label('ancestors_by_creator')).subquery()

            # filter on posts which have at least one of these posts among their parents
            creator_post_ancestors_ids = session.query(
                ancestors_by_creator.c.id
            ).filter(func.array_length(ancestors_by_creator.c.ancestors_by_creator, 1) > 0)
            query = query.filter(
                or_(Post.creator_id == user_id,
                    Post.id.in_(creator_post_ancestors_ids)))
        elif only_my_posts:
            query = query.filter(Post.creator_id == user_id)

        if 'creator' in fields.get('edges', {}).get('node', {}):
            query = query.options(joinedload(Post.creator))

        if self.message_view_override == models.Phases.brightMirror.value:
            if user_id is not None:
                query = query.filter(
                    or_(
                        Post.publication_state == models.PublicationStates.PUBLISHED,
                        Post.publication_state == models.PublicationStates.DELETED_BY_ADMIN,
                        Post.publication_state == models.PublicationStates.DELETED_BY_USER,
                        and_(Post.creator_id == user_id, Post.publication_state == models.PublicationStates.DRAFT)
                    )
                )
            else:
                query = query.filter(
                    or_(
                        Post.publication_state == models.PublicationStates.PUBLISHED,
                        Post.publication_state == models.PublicationStates.DELETED_BY_ADMIN,
                        Post.publication_state == models.PublicationStates.DELETED_BY_USER
                    )
                )
        if not sentiments_only:
            query = order_posts_query(query, order)
            if len(discussion.discussion_locales) > 1:
                query = query.options(*models.Content.subqueryload_options())
            else:
                query = query.options(*models.Content.joinedload_options())

            if hashtags:
                hashtags_filter = get_hashtags_filter(discussion_id, hashtags)
                query = query.filter(hashtags_filter)

            post_ids = query.with_entities(models.Post.id).subquery()
        else:
            query = query.with_entities(models.Post.id, models.Post.publication_state)
            query = query.all()  # execute the query only once, we iter again below
            post_ids = [id for id, _ in query]

        # do only one sql query to calculate sentiment_counts
        # instead of doing one query for each post
        if 'sentimentCounts' in fields.get('edges', {}).get('node', {}):
            sentiment_counts = discussion.db.query(
                models.Post.id, models.SentimentOfPost.type, func.count(
                    models.SentimentOfPost.id)
            ).join(models.SentimentOfPost).filter(
                models.Post.id.in_(post_ids),
                models.SentimentOfPost.tombstone_condition()
            ).group_by(models.Post.id, models.SentimentOfPost.type)
            sentiment_counts_by_post_id = defaultdict(dict)
            for (post_id, sentiment_type, sentiment_count) in sentiment_counts:
                sentiment_counts_by_post_id[post_id][
                    sentiment_type[SentimentOfPost.TYPE_PREFIX_LEN:]
                ] = sentiment_count
            # set sentiment_counts_by_post_id on the request to use it
            # in Post's resolve_sentiment_counts
            context.sentiment_counts_by_post_id = sentiment_counts_by_post_id

        if sentiments_only:
            from .post import Post
            query = [Post(id=id, publication_state=publication_state) for id, publication_state in query]
            return query

        # pagination is done after that, no need to do it ourself
        # but if we get all posts, iterate now to avoid an extra count query
        if no_pagination:
            return query.all()

        return query

    def resolve_contributors(self, args, context, info):
        contributor_ids = [cid for (cid,) in self.get_contributors_query()]
        contributors = [models.AgentProfile.get(
            cid) for cid in contributor_ids]
        return contributors


class Question(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Question.__doc__

    class Meta:
        model = models.Question
        interfaces = (Node, )
        only_fields = ('id', )

    num_posts = graphene.Int(description=docs.Question.num_posts)
    num_contributors = graphene.Int(description=docs.Question.num_contributors)
    title = graphene.String(lang=graphene.String(), description=docs.Question.title)
    title_entries = graphene.List(LangStringEntry, description=docs.Question.title_entries)
    posts = SQLAlchemyConnectionField(
        'assembl.graphql.post.PostConnection',  # use dotted name to avoid circular import  # noqa: E501
        random=graphene.Boolean(),
        from_node=graphene.ID(),
        isModerating=graphene.Boolean(),
        description=docs.Question.posts,
        posts_order=graphene.Argument(
            type=PostOrderTypes,
            required=False,
            description=docs.Question.posts_order,
        ),
        only_my_posts=graphene.Argument(
            type=graphene.Boolean,
            required=False,
            description=docs.Question.only_my_posts,
        ),
        hashtags=graphene.Argument(
            type=graphene.List(graphene.String),
            required=False,
            description=docs.Question.hashtags,
        )
    )
    total_sentiments = graphene.Int(required=True, description=docs.Question.total_sentiments)
    parent = graphene.Field(lambda: IdeaUnion, description=docs.Idea.parent)
    has_pending_posts = graphene.Boolean(description=docs.Question.has_pending_posts)

    def resolve_title(self, args, context, info):
        title = resolve_langstring(self.title, args.get('lang'))
        return title

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_posts(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        only_my_posts = args.get('only_my_posts', False)
        hashtags = args.get('hashtags', [])
        order = args.get('posts_order')
        random = args.get('random', False)
        is_moderating = args.get('isModerating', False)
        user_id = context.authenticated_userid
        can_moderate = user_has_permission(discussion_id, user_id, P_MODERATE)
        Post = models.Post
        if is_moderating:
            state_condition = Post.publication_state == models.PublicationStates.SUBMITTED_AWAITING_MODERATION
        elif can_moderate:
            state_condition = Post.publication_state.in_(
                [models.PublicationStates.SUBMITTED_AWAITING_MODERATION,
                 models.PublicationStates.PUBLISHED])
        else:
            state_condition = (Post.publication_state == models.PublicationStates.PUBLISHED) | (
                (Post.publication_state == models.PublicationStates.SUBMITTED_AWAITING_MODERATION) &
                (Post.creator_id == user_id))

        related = self.get_related_posts_query(True)

        # If random is True returns 10 posts, the first one is the latest post
        # created by the user, then the remaining ones are in random order.
        # If random is False, return all the posts in creation_date desc order.
        if random:
            if user_id is None:
                first_post = None
            else:
                first_post = Post.query.join(
                    related, Post.id == related.c.post_id
                ).filter(Post.creator_id == user_id
                ).filter(state_condition
                ).order_by(desc(Post.creation_date), Post.id).first()

            query = Post.default_db.query(Post.id).join(
                related, Post.id == related.c.post_id).filter(state_condition)

            if only_my_posts:
                query = query.filter(Post.creator_id == user_id)

            if hashtags:
                hashtags_filter = get_hashtags_filter(discussion_id, hashtags)
                query = query.filter(hashtags_filter)

            # retrieve ids, do the random and get the posts for these ids
            post_ids = [e[0] for e in query]
            limit = args.get('first', 10)
            if first_post is not None:
                first_post_id = first_post.id
                post_ids = [
                    post_id for post_id in post_ids
                    if post_id != first_post_id]
                limit -= 1

            random_posts_ids = random_sample(
                post_ids, min(len(post_ids), limit))
            query = Post.query.filter(Post.id.in_(random_posts_ids)
                                      ).options(
                joinedload(Post.creator),
            )
            if len(discussion.discussion_locales) > 1:
                query = query.options(
                    models.LangString.subqueryload_option(Post.body))
            else:
                query = query.options(
                    models.LangString.joinedload_option(Post.body))

            # The query always gives the posts in the same order.
            # We need to random it again.
            posts = query.all()
            random_shuffle(posts)
            if first_post is not None:
                query = [first_post] + posts

        else:
            # The related query returns a list of
            # (<PropositionPost id=2 >, None)
            # instead of <PropositionPost id=2 > when authenticated,
            # this is why we do another query here:
            query = Post.query.join(related, Post.id == related.c.post_id)\
                .filter(state_condition)
            query = order_posts_query(query, order)\
                .options(joinedload(Post.creator))
            if len(discussion.discussion_locales) > 1:
                query = query.options(
                    models.LangString.subqueryload_option(Post.body))
            else:
                query = query.options(
                    models.LangString.joinedload_option(Post.body))

            if only_my_posts:
                query = query.filter(Post.creator_id == user_id)

            if hashtags:
                hashtags_filter = get_hashtags_filter(discussion_id, hashtags)
                query = query.filter(hashtags_filter)

        from_node = args.get('from_node')
        after = args.get('after')
        before = args.get('before')
        # If `from_node` is specified and after/before is None or empty string,
        # search the position of this node to set the `after` parameter
        # which is actually `arrayconnection:position` in base64.
        if from_node and not after and not before:
            post_id = int(Node.from_global_id(from_node)[-1])
            node_idx = len(list(takewhile(lambda post: post[0] != post_id, query.with_entities(Post.id))))
            args['after'] = offset_to_cursor(node_idx - 1)

        # pagination is done after that, no need to do it ourself
        return query

    def resolve_total_sentiments(self, args, context, info):
        return self.get_total_sentiments()

    def resolve_parent(self, args, context, info):
        if not self.parents:
            return None

        return self.parents[0]

    def resolve_has_pending_posts(self, args, context, info):
        Post = models.Post
        related = self.get_related_posts_query(True)
        query = Post.query.join(
            related, Post.id == related.c.post_id
        ).filter(
            Post.publication_state == models.PublicationStates.SUBMITTED_AWAITING_MODERATION
        )
        pending_count = query.count()
        return pending_count > 0


def get_hashtags_filter(discussion_id, hashtags):
    Post = models.Post
    hashtags_value = cast(hashtags, ARRAY(VARCHAR))  # postgresql needs explicit cast
    hashtag_aggs = func.array_agg(models.LangStringEntry.hashtags)
    hashtags_query = Post.default_db.query(
        models.Content.body_id,
    ).outerjoin(
        models.LangStringEntry,
        models.LangStringEntry.langstring_id == models.Content.body_id
    ).group_by(models.Content.body_id
               ).filter(
        models.Content.discussion_id == discussion_id,  # optimisation
        func.array_length(models.LangStringEntry.hashtags, 1) > 0,  # can't aggregate null or empty arrays
    ).having(
        hashtag_aggs.contains(hashtags_value)
    )

    hashtags_subquery = hashtags_query.subquery()
    hashtags_filter = models.Content.body_id.in_(hashtags_subquery)
    return hashtags_filter


class IdeaUnion(SQLAlchemyUnion):

    class Meta:
        types = (Idea, )
        model = models.Idea

    @classmethod
    def resolve_type(cls, instance, context, info):
        if isinstance(instance, graphene.ObjectType):
            return type(instance)
        elif isinstance(instance, models.Idea):
            return Idea


class QuestionInput(graphene.InputObjectType):
    __doc__ = docs.QuestionInput.__doc__
    id = graphene.ID(description=docs.QuestionInput.id)
    title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.QuestionInput.title_entries)


class IdeaMessageColumnInput(graphene.InputObjectType):
    __doc__ = docs.IdeaMessageColumnInput.__doc__
    id = graphene.ID(description=docs.IdeaMessageColumnInput.id)
    name_entries = graphene.List(LangStringEntryInput, required=True, description=docs.IdeaMessageColumnInput.name_entries)
    title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.IdeaMessageColumnInput.title_entries)
    color = graphene.String(required=True, description=docs.IdeaMessageColumnInput.color)
    message_classifier = graphene.String(description=docs.IdeaMessageColumnInput.message_classifier)
    column_synthesis_subject = graphene.List(LangStringEntryInput, description=docs.IdeaMessageColumnInput.column_synthesis_subject)
    column_synthesis_body = graphene.List(LangStringEntryInput, description=docs.IdeaMessageColumnInput.column_synthesis_body)


def update_announcement_body_attachments(context, idea, discussion, new_attachments, purpose):
    """Create, update, delete announcement body attachments."""
    original_ln_attachments = get_attachments_with_purpose(
        idea.attachments, purpose)
    original_attachments_doc_ids = []
    if original_ln_attachments:
        original_attachments_doc_ids = [
            str(a.document_id) for a in original_ln_attachments]

    for document_id in new_attachments:
        if document_id not in original_attachments_doc_ids:
            attachment = create_attachment(
                discussion,
                models.IdeaAttachment,
                purpose,
                context,
                document_id=document_id
            )
            attachment.idea = idea

    # delete attachments that has been removed
    documents_to_delete = set(original_attachments_doc_ids) - set(new_attachments)
    for document_id in documents_to_delete:
        with models.Discussion.default_db.no_autoflush:
            document = models.Document.get(document_id)
            attachments = discussion.db.query(
                models.IdeaAttachment
            ).filter_by(
                attachmentPurpose=purpose,
                discussion_id=discussion.id,
                document_id=document_id,
                idea_id=idea.id
            ).all()
            document.delete_file()
            discussion.db.delete(document)
            for attachment in attachments:
                idea.attachments.remove(attachment)


def create_idea(parent_idea, phase, args, context):
    cls = models.Idea
    message_view_override = args.get('message_view_override')
    if message_view_override is None:
        message_view_override = MessageView.noModule.value

    is_survey_thematic = message_view_override == MessageView.survey.value
    is_multicolumns = message_view_override == MessageView.messageColumns.value
    discussion_id = context.matchdict['discussion_id']
    discussion = models.Discussion.get(discussion_id)
    user_id = context.authenticated_userid or Everyone

    require_cls_permission(CrudPermissions.CREATE, cls, context)

    with cls.default_db.no_autoflush as db:
        title_entries = args.get('title_entries')
        if len(title_entries) == 0:
            raise Exception(
                'Idea titleEntries needs at least one entry')
            # Better to have this message than
            # 'NoneType' object has no attribute 'owner_object'
            # when creating the saobj below if title=None

        title_langstring = langstring_from_input_entries(title_entries)
        description_langstring = langstring_from_input_entries(
            args.get('description_entries'))
        kwargs = {}
        if description_langstring is not None:
            kwargs['description'] = description_langstring

        kwargs['message_view_override'] = message_view_override

        saobj = cls(
            discussion_id=discussion_id,
            discussion=discussion,
            messages_in_parent=False,
            title=title_langstring,
            **kwargs)
        db.add(saobj)
        order = len(parent_idea.get_children()) + 1.0
        db.add(
            models.IdeaLink(source=parent_idea, target=saobj,
                            order=args.get('order', order)))

        # Create the idea announcement object which corresponds to the instructions
        announcement = args.get('announcement')
        if announcement is not None:
            announcement_title_entries = announcement.get('title_entries')
            if len(announcement_title_entries) == 0:
                raise Exception('Announcement titleEntries needs at least one entry')

            announcement_title_langstring = langstring_from_input_entries(announcement_title_entries)
            announcement_body_langstring = langstring_from_input_entries(announcement.get('body_entries', None))
            announcement_quote_langstring = langstring_from_input_entries(announcement.get('quote_entries', None))
            announcement_summary_langstring = langstring_from_input_entries(announcement.get('summary_entries', None))
            saobj2 = create_idea_announcement(user_id, discussion, saobj, announcement_title_langstring, announcement_body_langstring, announcement_quote_langstring, announcement_summary_langstring)
            db.add(saobj2)
            update_announcement_body_attachments(
                context,
                saobj,
                discussion,
                announcement.get('body_attachments', []),
                ANNOUNCEMENT_BODY_ATTACHMENT)

        # add uploaded image as an attachment to the idea
        image = args.get('image')
        if image is not None:
            new_attachment = create_attachment(
                discussion,
                models.IdeaAttachment,
                EMBED_ATTACHMENT,
                context,
                new_value=image
            )
            new_attachment.idea = saobj
            db.add(new_attachment)

        if is_survey_thematic:
            questions_input = args.get('questions')
            if questions_input is not None:
                for idx, question_input in enumerate(questions_input):
                    title_ls = langstring_from_input_entries(
                        question_input['title_entries'])
                    question = models.Question(
                        title=title_ls,
                        discussion=discussion,
                        discussion_id=discussion_id
                    )
                    db.add(
                        models.IdeaLink(source=saobj, target=question,
                                        order=idx + 1.0))
        if is_multicolumns:
            message_columns = args.get('message_columns')
            previous_column = None
            if message_columns is not None:
                for index, column in enumerate(message_columns):
                    name = langstring_from_input_entries(column['name_entries'])
                    message_classifier = column.get('message_classifier', None)
                    if not message_classifier:
                        message_classifier = u'column{}'.format(index + 1)

                    title = langstring_from_input_entries(column['title_entries'])
                    color = column['color']
                    body = langstring_from_input_entries(column['column_synthesis_body'])
                    subject = langstring_from_input_entries(column['column_synthesis_subject'])
                    sacolumn = models.IdeaMessageColumn(
                        message_classifier=message_classifier,
                        name=name,
                        title=title,
                        color=color,
                        previous_column=previous_column)
                    saobj.message_columns.append(sacolumn)
                    synthesis = models.ColumnSynthesisPost(
                        message_classifier=message_classifier,
                        discussion_id=discussion_id,
                        subject=subject if subject else models.LangString.EMPTY(),
                        body=body if body else models.LangString.EMPTY()
                    )
                    db.add(synthesis)
                    db.add(models.IdeaRelatedPostLink(
                        creator_id=user_id,
                        content=synthesis,
                        idea=saobj
                    ))
                    previous_column = sacolumn

        update_ideas_recursively(saobj, args.get('children', []), phase, context)

    db.flush()
    return saobj


def tombstone_posts_related_to_idea(idea):
    related = idea.get_related_posts_query(True, include_moderating=False)
    query = models.Post.query.join(
        related, models.Post.id == related.c.post_id
        )
    posts = query.all()
    for post in posts:
        post.is_tombstone = True
        post.publication_state = models.PublicationStates.DELETED_BY_ADMIN

        # Remove extracts associated to this post
        extracts_to_remove = post.db.query(models.Extract).filter(
            models.Extract.content_id == post.id).all()
        for extract in extracts_to_remove:
            extract.tags = []
            extract.delete()

        idea.db.flush()


def update_idea(args, phase, context):
    cls = models.Idea
    discussion_id = context.matchdict['discussion_id']
    discussion = models.Discussion.get(discussion_id)
    user_id = context.authenticated_userid or Everyone

    thematic_id = args.get('id')
    id_ = int(Node.from_global_id(thematic_id)[1])
    thematic = cls.get(id_)
    if phase is None:  # UpdateThematic doesn't give phase
        phase = thematic.get_associated_phase()

    message_view_override = args.get('message_view_override')
    is_survey_thematic = message_view_override == MessageView.survey.value
    is_multicolumns = message_view_override == MessageView.messageColumns.value

    require_instance_permission(CrudPermissions.UPDATE, thematic, context)

    with cls.default_db.no_autoflush as db:
        # If the admin changes the idea type, all posts associated to the idea must be deleted
        if thematic.message_view_override != message_view_override:
            tombstone_posts_related_to_idea(thematic)
        # introducing history at every step, including thematics + questions  # noqa: E501
        thematic.copy(tombstone=True)
        title_entries = args.get('title_entries')
        if title_entries is not None and len(title_entries) == 0:
            raise Exception(
                'Idea titleEntries needs at least one entry')
            # Better to have this message than
            # 'NoneType' object has no attribute 'owner_object'
            # when creating the saobj below if title=None

        update_langstring_from_input_entries(
            thematic, 'title', title_entries)
        update_langstring_from_input_entries(
            thematic, 'description', args.get('description_entries'))
        kwargs = {}
        kwargs['message_view_override'] = message_view_override

        for attr, value in kwargs.items():
            setattr(thematic, attr, value)

        # change order if needed
        order = args.get('order')
        if order:
            thematic.source_links[0].order = order

        # add uploaded image as an attachment to the idea
        image = args.get('image')
        if image is not None:
            update_attachment(
                discussion,
                models.IdeaAttachment,
                image,
                thematic.attachments,
                EMBED_ATTACHMENT,
                db,
                context
            )

        # Create the idea announcement object which corresponds to the instructions
        announcement = args.get('announcement')
        if announcement is not None:
            announcement_title_entries = announcement.get('title_entries')
            if len(announcement_title_entries) == 0:
                raise Exception('Announcement titleEntries needs at least one entry')

            if not thematic.announcement:
                announcement_title_langstring = langstring_from_input_entries(announcement_title_entries)
                announcement_body_langstring = langstring_from_input_entries(announcement.get('body_entries', None))
                announcement_quote_langstring = langstring_from_input_entries(announcement.get('quote_entries', None))
                announcement_summary_langstring = langstring_from_input_entries(announcement.get('summary_entries', None))
                saobj2 = create_idea_announcement(user_id, discussion, thematic, announcement_title_langstring, announcement_body_langstring, announcement_quote_langstring, announcement_summary_langstring)
                db.add(saobj2)
            else:
                update_langstring_from_input_entries(
                    thematic.announcement, 'title', announcement_title_entries)
                update_langstring_from_input_entries(
                    thematic.announcement, 'body', announcement.get('body_entries', None))
                update_langstring_from_input_entries(
                    thematic.announcement, 'quote', announcement.get('quote_entries', None))
                update_langstring_from_input_entries(
                    thematic.announcement, 'summary', announcement.get('summary_entries', None))
                thematic.announcement.last_updated_by_id = user_id

            update_announcement_body_attachments(
                context,
                thematic,
                discussion,
                announcement.get('body_attachments', []),
                ANNOUNCEMENT_BODY_ATTACHMENT)

        existing_questions = {
            question.id: question for question in thematic.get_children() if isinstance(question, models.Question)}
        if is_survey_thematic:
            questions_input = args.get('questions')
            updated_questions = set()
            if questions_input is not None:
                for idx, question_input in enumerate(questions_input):
                    if question_input.get('id', None) is not None:
                        id_ = int(Node.from_global_id(question_input['id'])[1])
                        updated_questions.add(id_)
                        question = models.Question.get(id_)
                        # archive the question
                        question.copy(tombstone=True)
                        update_langstring_from_input_entries(
                            question, 'title', question_input['title_entries'])
                        # modify question order
                        question.source_links[0].order = idx + 1.0
                    else:
                        title_ls = langstring_from_input_entries(
                            question_input['title_entries'])
                        question = models.Question(
                            title=title_ls,
                            discussion_id=discussion_id
                        )
                        db.add(
                            models.IdeaLink(source=thematic, target=question,
                                            order=idx + 1.0))

                # remove question (tombstone) that are not in questions_input
                for question_id in set(existing_questions.keys()
                                       ).difference(updated_questions):
                    existing_questions[question_id].is_tombstone = True
        else:
            # if the idea was type survey before, remove all questions
            for question_id in existing_questions:
                existing_questions[question_id].is_tombstone = True

        if is_multicolumns:
            message_columns = args.get('message_columns')
            if message_columns is not None:
                previous_column = None
                for index, column in enumerate(message_columns):
                    message_classifier = column.get('message_classifier', None)
                    existing_column = [col for col in thematic.message_columns if col.message_classifier == message_classifier]
                    if existing_column:
                        existing_column = existing_column[0]
                        update_langstring_from_input_entries(existing_column, 'name', column['name_entries'])
                        update_langstring_from_input_entries(existing_column, 'title', column['title_entries'])
                        existing_column.color = column['color']
                        synthesis = existing_column.get_column_synthesis()
                        update_langstring_from_input_entries(synthesis, 'subject', column['column_synthesis_subject'])
                        update_langstring_from_input_entries(synthesis, 'body', column['column_synthesis_body'])
                        # We don't allow changing column message_classifier, because this is used for
                        # the relation with ColumnSynthesisPost and all posts.
                        previous_column = existing_column
                    else:
                        name = langstring_from_input_entries(column['name_entries'])
                        if not message_classifier:
                            message_classifier = u'column{}'.format(index + 1)

                        title = langstring_from_input_entries(column['title_entries'])
                        color = column['color']
                        sacolumn = models.IdeaMessageColumn(
                            message_classifier=message_classifier,
                            name=name,
                            title=title,
                            color=color,
                            previous_column=previous_column)
                        thematic.message_columns.append(sacolumn)
                        body = langstring_from_input_entries(column['column_synthesis_body'])
                        subject = langstring_from_input_entries(column['column_synthesis_subject'])
                        synthesis = models.ColumnSynthesisPost(
                            message_classifier=message_classifier,
                            discussion_id=discussion_id,
                            subject=subject if subject else models.LangString.EMPTY(),
                            body=body if body else models.LangString.EMPTY()
                        )
                        db.add(synthesis)
                        db.add(models.IdeaRelatedPostLink(
                            creator_id=user_id,
                            content=synthesis,
                            idea=thematic
                        ))
                        previous_column = sacolumn

                for deleted_column in thematic.message_columns[index + 1:]:
                    thematic.message_columns.remove(deleted_column)
                    thematic.db.delete(deleted_column.get_column_synthesis())
                    thematic.db.delete(deleted_column)
        else:
            # if the idea was type messageColumns before, remove all columns
            for deleted_column in thematic.message_columns[:]:
                thematic.message_columns.remove(deleted_column)
                thematic.db.delete(deleted_column.get_column_synthesis())
                thematic.db.delete(deleted_column)

        update_ideas_recursively(thematic, args.get('children', []), phase, context)

    db.flush()
    return thematic


def tombstone_idea_recursively(idea):
    idea.is_tombstone = True
    tombstone_posts_related_to_idea(idea)
    for child in idea.get_children():
        tombstone_idea_recursively(child)


def delete_idea(args, context):
    thematic_id = args.get('thematic_id')
    thematic_id = int(Node.from_global_id(thematic_id)[1])
    thematic = models.Idea.get(thematic_id)

    require_instance_permission(CrudPermissions.DELETE, thematic, context)

    tombstone_idea_recursively(thematic)
    thematic.db.flush()


def update_ideas_recursively(parent_idea, children, phase, context):
    existing_ideas = {
        idea.id: idea for idea in parent_idea.get_children() if not isinstance(idea, (models.Question, models.VoteProposal))}
    updated_ideas = set()
    for idea in children:
        if idea.get('id', None):
            id_ = int(Node.from_global_id(idea['id'])[1])
            updated_ideas.add(id_)
            update_idea(idea, phase, context)
        else:
            create_idea(parent_idea, phase, idea, context)

    # remove idea (tombstone) that are not in input
    ideas_to_remove = set(existing_ideas.keys()).difference(updated_ideas)
    for idea_id in ideas_to_remove:
        tombstone_idea_recursively(existing_ideas[idea_id])


# How the file upload works
# With the https://github.com/jaydenseric/apollo-upload-client
# networkInterface, if there is a File object in a graphql variable, the File
# data is appended to the POST body as a part with an identifier starting with
# 'variables.',
# For example if we use 'img' File variable in a mutation,
# 'variables.img' will be available in context.POST, 'img' is removed from the
# variables in the json by apollo-upload-client, but graphql-wsgi put back
# {'img': 'variables.img'}
# in the variables, so here `image` input argument will be 'variables.img'
# (assuming assigning image: $img in the mutation)
class CreateThematic(graphene.Mutation):
    __doc__ = docs.CreateThematic.__doc__

    class Input:
        # Careful, having required=True on a graphene.List only means
        # it can't be None, having an empty [] is perfectly valid.
        title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.Default.langstring_entries)
        description_entries = graphene.List(LangStringEntryInput, description=docs.Default.langstring_entries)
        discussion_phase_id = graphene.Int(required=True, description=docs.CreateThematic.discussion_phase_id)
        announcement = graphene.Argument(IdeaAnnouncementInput, description=docs.Idea.announcement)
        questions = graphene.List(QuestionInput, description=docs.CreateThematic.questions)
        image = graphene.String(description=docs.Default.image)
        order = graphene.Float(description=docs.Default.float_entry)
        message_view_override = graphene.String(description=docs.IdeaInterface.message_view_override)
        parent_id = graphene.ID(description=docs.Idea.parent_id)

    thematic = graphene.Field(lambda: IdeaUnion)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        phase_id = args.get('discussion_phase_id')
        phase = models.DiscussionPhase.get(phase_id)
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        parent_idea_id = args.get('parent_id')
        if parent_idea_id:
            parent_idea_id = int(Node.from_global_id(parent_idea_id)[1])
            parent_idea = models.Idea.get(parent_idea_id)
            if not parent_idea:
                raise Exception('Parent Idea not found')
            if parent_idea.discussion != discussion:
                # No cross-debate references are allowed,
                # for security reasons
                raise Exception(
                    'Parent Idea does not belong to this discussion')  # noqa: E501
        else:
            # Our thematic, because it inherits from Idea, needs to be
            # associated to the root idea of the discussion.
            # We create a hidden root thematic, corresponding to the
            # phase, child of the discussion root idea,
            # and add our thematic as a child of this root thematic.
            parent_idea = get_root_thematic_for_phase(phase)
            if parent_idea is None:
                parent_idea = create_root_thematic(phase)

        saobj = create_idea(parent_idea, phase, args, context)
        return CreateThematic(thematic=saobj)


class UpdateThematic(graphene.Mutation):
    __doc__ = docs.UpdateThematic.__doc__

    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, description=docs.Default.langstring_entries)
        description_entries = graphene.List(LangStringEntryInput, description=docs.Default.langstring_entries)
        announcement = graphene.Argument(IdeaAnnouncementInput, description=docs.Idea.announcement)
        questions = graphene.List(QuestionInput, description=docs.UpdateThematic.questions)
        image = graphene.String(description=docs.Default.image)
        order = graphene.Float(description=docs.Default.float_entry)
        message_view_override = graphene.String(description=docs.IdeaInterface.message_view_override)

    thematic = graphene.Field(lambda: IdeaUnion)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        thematic = update_idea(args, None, context)
        return UpdateThematic(thematic=thematic)


class DeleteThematic(graphene.Mutation):
    __doc__ = docs.DeleteThematic.__doc__

    class Input:
        thematic_id = graphene.ID(required=True, description=docs.DeleteThematic.thematic_id)

    success = graphene.Boolean()

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        delete_idea(args, context)
        return DeleteThematic(success=True)


class IdeaInput(graphene.InputObjectType):
    __doc__ = docs.IdeaInput.__doc__
    id = graphene.ID()  # not required, used only for update/delete
    title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.Default.langstring_entries)
    description_entries = graphene.List(LangStringEntryInput, description=docs.Default.langstring_entries)
    announcement = graphene.Argument(IdeaAnnouncementInput, description=docs.Idea.announcement)
    questions = graphene.List(QuestionInput, description=docs.CreateThematic.questions)
    message_columns = graphene.List(lambda: IdeaMessageColumnInput, description=docs.IdeaInput.message_columns)
    children = graphene.List(lambda: IdeaInput, description=docs.UpdateIdeas.ideas)
    image = graphene.String(description=docs.Default.image)
    order = graphene.Float(description=docs.Default.float_entry)
    message_view_override = graphene.String(description=docs.IdeaInterface.message_view_override)
    parent_id = graphene.ID(description=docs.Idea.parent_id)  # used only for create


class UpdateIdeas(graphene.Mutation):
    __doc__ = docs.UpdateIdeas.__doc__

    class Input:
        discussion_phase_id = graphene.Int(required=True, description=docs.UpdateIdeas.discussion_phase_id)
        ideas = graphene.List(IdeaInput, required=True, description=docs.UpdateIdeas.ideas)

    query = graphene.Field('assembl.graphql.schema.Query')

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        phase_id = args.get('discussion_phase_id')
        phase = models.DiscussionPhase.get(phase_id)
        # Our thematic, because it inherits from Idea, needs to be
        # associated to the root idea of the discussion.
        # We create a hidden root thematic, corresponding to the
        # phase, child of the discussion root idea,
        # and add our thematic as a child of this root thematic.
        root_idea = get_root_thematic_for_phase(phase)
        if root_idea is None:
            root_idea = create_root_thematic(phase)

        children = args['ideas']
        update_ideas_recursively(root_idea, children, phase, context)

        phase.db.flush()
        from assembl.graphql.schema import Query
        return UpdateIdeas(query=Query)


def order_posts_query(query, order):
    """
    :param query: sqlalchemy query
    :param order: PostsOrderTypes enum
    :return:
    """
    if order == PostOrderTypes.chronological.value:
        query = query.order_by(models.Content.creation_date)
    elif order == PostOrderTypes.reverse_chronological.value:
        query = query.order_by(models.Content.creation_date.desc())
    elif order == PostOrderTypes.score.value:
        query = query.order_by(models.Content.body_text_index.score_name.desc())
    elif order == PostOrderTypes.popularity.value:
        # assume reverse chronological otherwise
        query = query.order_by(models.Content.disagree_count - models.Content.like_count,
                               models.Content.creation_date.desc())
    else:
        query = query.order_by(desc(models.Post.creation_date), models.Post.id)
    return query
