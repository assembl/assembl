from collections import defaultdict
from itertools import takewhile
from random import sample as random_sample
from random import shuffle as random_shuffle

from graphql_relay.connection.arrayconnection import offset_to_cursor
import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyConnectionField, SQLAlchemyObjectType
from graphene_sqlalchemy.utils import is_mapped
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone
from sqlalchemy import desc, func, join, select, or_, and_
from sqlalchemy.orm import joinedload

from assembl import models
from assembl.auth import IF_OWNED, CrudPermissions
from assembl.auth.util import get_permissions
from assembl.models.action import SentimentOfPost
from assembl.models import Phases

from .document import Document
from .langstring import (LangStringEntry, LangStringEntryInput,
                         langstring_from_input_entries, resolve_langstring,
                         resolve_langstring_entries,
                         update_langstring_from_input_entries)
from .types import SecureObjectType, SQLAlchemyUnion
from .user import AgentProfile
from .utils import (
    abort_transaction_on_exception, get_fields, get_root_thematic_for_phase,
    create_root_thematic, get_attachment_with_purpose, create_attachment,
    update_attachment, create_idea_announcement)
import assembl.graphql.docstrings as docs


class Video(graphene.ObjectType):
    __doc__ = docs.Video.__doc__
    title = graphene.String(description=docs.Video.title)
    description_top = graphene.String(description=docs.Video.description_top)
    description_bottom = graphene.String(description=docs.Video.description_bottom)
    description_side = graphene.String(description=docs.Video.description_side)
    html_code = graphene.String(description=docs.Video.html_code)
    title_entries = graphene.List(LangStringEntry, description=docs.Video.title_entries)
    description_entries_top = graphene.List(LangStringEntry, description=docs.Video.description_entries_top)
    description_entries_bottom = graphene.List(LangStringEntry, description=docs.Video.description_entries_bottom)
    description_entries_side = graphene.List(LangStringEntry, description=docs.Video.description_entries_side)
    media_file = graphene.Field(Document, description=docs.Video.media_file)


class IdeaInterface(graphene.Interface):
    __doc__ = docs.IdeaInterface.__doc__
    title = graphene.String(lang=graphene.String(), description=docs.IdeaInterface.title)
    title_entries = graphene.List(LangStringEntry, description=docs.IdeaInterface.title_entries)
    description = graphene.String(lang=graphene.String(), description=docs.IdeaInterface.description)
    description_entries = graphene.List(LangStringEntry, description=docs.IdeaInterface.description_entries)
    num_posts = graphene.Int(description=docs.IdeaInterface.num_posts)
    num_total_posts = graphene.Int(description=docs.IdeaInterface.num_total_posts)
    num_contributors = graphene.Int(description=docs.IdeaInterface.num_contributors)
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
    ancestors = graphene.List(graphene.ID, description=docs.Idea.ancestors)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_description(self, args, context, info):
        description = resolve_langstring(self.description, args.get('lang'))
        if not description:
            description = self.get_definition_preview()
        return description

    def resolve_description_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'description')

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
        if self.attachments:
            return self.attachments[0].document

    def resolve_order(self, args, context, info):
        return self.get_order_from_first_parent()

    def resolve_num_children(self, args, context, info):
        phase_id = args.get('discussion_phase_id')
        phase = models.DiscussionPhase.get(phase_id)
        if phase.identifier == Phases.multiColumns.value:
            _it = models.Idea.__table__
            _ilt = models.IdeaLink.__table__
            _target_it = models.Idea.__table__.alias()
            j = join(_ilt, _it, _ilt.c.source_id == _it.c.id
                     ).join(_target_it, _ilt.c.target_id == _target_it.c.id)
            num = select([func.count(_ilt.c.id)]).select_from(j).where(
                (_ilt.c.tombstone_date == None) & (_it.c.tombstone_date == None) & (  # noqa: E711
                    _it.c.id == self.id) & (_target_it.c.message_view_override == 'messageColumns')

            ).correlate_except(_ilt)
            return self.db.execute(num).fetchone()[0]

        return self.num_children

    def resolve_vote_specifications(self, args, context, info):
        return self.criterion_for

    def resolve_total_sentiments(self, args, context, info):
        return self.get_total_sentiments()

    def resolve_type(self, args, context, info):
        return self.__class__.__name__

    def resolve_parent_id(self, args, context, info):
        if not self.parents:
            return None

        return self.parents[0].graphene_id()

    def resolve_ancestors(self, args, context, info):
        # We use id_only=True and models.Idea.get on purpose, to
        # use a simpler ancestors query and use Idea identity map.
        return [models.Idea.get(id).graphene_id()
                for id in self.get_all_ancestors(id_only=True)]


class IdeaAnnouncementInput(graphene.InputObjectType):
    __doc__ = docs.IdeaAnnouncement.__doc__
    title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.IdeaAnnouncement.title_entries)
    body_entries = graphene.List(LangStringEntryInput, required=True, description=docs.IdeaAnnouncement.body_entries)


class IdeaAnnouncement(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.IdeaAnnouncement.__doc__

    class Meta:
        model = models.IdeaAnnouncement
        interfaces = (Node,)
        only_fields = ('id',)

    title = graphene.String(lang=graphene.String(), description=docs.IdeaAnnouncement.title)
    title_entries = graphene.List(LangStringEntry, required=True, description=docs.IdeaAnnouncement.title_entries)
    body = graphene.String(lang=graphene.String(), description=docs.IdeaAnnouncement.body)
    body_entries = graphene.List(LangStringEntry, required=True, description=docs.IdeaAnnouncement.body_entries)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_body(self, args, context, info):
        return resolve_langstring(self.body, args.get('lang'))

    def resolve_body_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'body')


class IdeaMessageColumn(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.IdeaMessageColumn.__doc__

    class Meta:
        model = models.IdeaMessageColumn
        interfaces = (Node,)
        only_fields = ('id', 'message_classifier', 'color')

    index = graphene.Int(description=docs.IdeaMessageColumn.index)
    idea = graphene.Field(lambda: Idea, description=docs.IdeaMessageColumn.idea)
    name = graphene.String(lang=graphene.String(), description=docs.IdeaMessageColumn.name)
    title = graphene.String(lang=graphene.String(), description=docs.IdeaMessageColumn.title)
    column_synthesis = graphene.Field('assembl.graphql.post.Post', description=docs.IdeaMessageColumn.column_synthesis)
    num_posts = graphene.Int(description=docs.IdeaMessageColumn.num_posts)

    def resolve_idea(self, args, context, info):
        if self.idea:
            return self.idea

    def resolve_name(self, args, context, info):
        return resolve_langstring(self.name, args.get('lang'))

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_column_synthesis(self, args, context, info):
        return self.get_column_synthesis()

    def resolve_num_posts(self, args, context, info):
        related = self.idea.get_related_posts_query(
            partial=True, include_deleted=False)
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


class Idea(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.IdeaInterface.__doc__

    class Meta:
        model = models.Idea
        interfaces = (Node, IdeaInterface)
        only_fields = ('id', )

    # TODO: Look into seperating synthesis_title from 'What you need to know',
    # they mean different things
    # This is the "What you need to know"
    synthesis_title = graphene.String(lang=graphene.String(), description=docs.Idea.synthesis_title)
    children = graphene.List(lambda: Idea, description=docs.Idea.children)
    posts = SQLAlchemyConnectionField('assembl.graphql.post.PostConnection', description=docs.Idea.posts)  # use dotted name to avoid circular import  # noqa: E501
    contributors = graphene.List(AgentProfile, description=docs.Idea.contributors)
    announcement = graphene.Field(lambda: IdeaAnnouncement, description=docs.Idea.announcement)
    message_columns = graphene.List(lambda: IdeaMessageColumn, description=docs.Idea.message_columns)
    vote_results = graphene.Field(VoteResults, required=True, description=docs.Idea.vote_results)

    def resolve_vote_results(self, args, context, info):
        vote_specifications = self.criterion_for
        if not vote_specifications:
            return VoteResults(num_participants=0, participants=[])

        query = vote_specifications[0].get_voter_ids_query()
        for vote_spec in vote_specifications[1:]:
            query = query.union(vote_spec.get_voter_ids_query())

        participant_ids = [row[0] for row in query]
        num_participants = len(participant_ids)
        participants = [models.AgentProfile.get(participant_id) for participant_id in participant_ids]
        return VoteResults(
            num_participants=num_participants,
            participants=participants)

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
        # And here we have in the following order Idea, Question, Thematic.
        # So a node query on a Thematic or Question was returning the Idea object type.  # noqa: E501
        # Here we fix the issue by overriding the is_type_of method
        # for the Idea type to do a type comparison so that
        # models.Question/models.Thematic which
        # inherits from models.Idea doesn't return true
        if isinstance(root, cls):
            return True
        if not is_mapped(type(root)):
            raise Exception((
                'Received incompatible instance "{}".'
            ).format(root))
        # return isinstance(root, cls._meta.model)  # this was the original code  # noqa: E501
        return type(root) == cls._meta.model or type(root) == models.RootIdea

    def resolve_synthesis_title(self, args, context, info):
        return resolve_langstring(self.synthesis_title, args.get('lang'))

    def resolve_children(self, args, context, info):
        # filter on child.hidden to not include the root thematic in the children of root_idea  # noqa: E501
        return [child for child in self.get_children() if not child.hidden]

    def resolve_posts(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        # include_deleted=None means all posts (live and tombstoned)
        related = self.get_related_posts_query(
            partial=True, include_deleted=None)
        # The related query returns a list of (<PropositionPost id=2 >, None) instead of <PropositionPost id=2 > when authenticated, this is why we do another query here:  # noqa: E501
        fields = get_fields(info)
        no_pagination = args.get('first') is None and args.get('after') is None
        sentiments_only = no_pagination and sorted(fields.get('edges', {}).get('node', {}).keys()) == [u'publicationState', u'sentimentCounts']

        query = models.Post.query.join(
            related, models.Post.id == related.c.post_id
        )

        if 'creator' in fields.get('edges', {}).get('node', {}):
            query = query.options(joinedload(models.Post.creator))

        Post = models.Post

        if self.message_view_override == Phases.brightMirror.value:
            user_id = context.authenticated_userid
            if user_id is not None:
                query = query.filter(or_(Post.publication_state == models.PublicationStates.PUBLISHED, and_(Post.creator_id == user_id, Post.publication_state == models.PublicationStates.DRAFT)))
            else:
                query = query.filter(Post.publication_state == models.PublicationStates.PUBLISHED)

        if not sentiments_only:
            query = query.order_by(desc(Post.creation_date), Post.id)
            if len(discussion.discussion_locales) > 1:
                query = query.options(*models.Content.subqueryload_options())
            else:
                query = query.options(*models.Content.joinedload_options())
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

    def resolve_announcement(self, args, context, info):
        return self.get_applicable_announcement()


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
        description=docs.Question.posts)
    thematic = graphene.Field(lambda: Thematic, description=docs.Question.thematic)
    total_sentiments = graphene.Int(required=True, description=docs.Question.total_sentiments)

    def resolve_thematic(self, args, context, info):
        parents = self.get_parents()
        if not parents:
            return None
        return parents[0]

    def resolve_title(self, args, context, info):
        title = resolve_langstring(self.title, args.get('lang'))
        return title

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_posts(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        random = args.get('random', False)
        Post = models.Post
        related = self.get_related_posts_query(True)
        # If random is True returns 10 posts, the first one is the latest post
        # created by the user, then the remaining ones are in random order.
        # If random is False, return all the posts in creation_date desc order.
        if random:
            user_id = context.authenticated_userid
            if user_id is None:
                first_post = None
            else:
                first_post = Post.query.join(
                    related, Post.id == related.c.post_id
                ).filter(Post.creator_id == user_id
                         ).order_by(desc(Post.creation_date), Post.id).first()

            query = Post.default_db.query(Post.id).join(
                related, Post.id == related.c.post_id)
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
            query = Post.query.join(
                related, Post.id == related.c.post_id
            ).filter(
                Post.publication_state == models.PublicationStates.PUBLISHED
            ).order_by(
                desc(Post.creation_date), Post.id
            ).options(joinedload(Post.creator))
            if len(discussion.discussion_locales) > 1:
                query = query.options(
                    models.LangString.subqueryload_option(Post.body))
            else:
                query = query.options(
                    models.LangString.joinedload_option(Post.body))

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


class Thematic(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Thematic.__doc__

    class Meta:
        model = models.Thematic
        interfaces = (Node, IdeaInterface)
        only_fields = ('id', )

    questions = graphene.List(Question, description=docs.Thematic.questions)
    video = graphene.Field(Video, lang=graphene.String(), description=docs.Thematic.video)

    def resolve_questions(self, args, context, info):
        return self.get_children()

    def resolve_video(self, args, context, info):
        title = resolve_langstring(self.video_title, args.get('lang'))
        title_entries = resolve_langstring_entries(self, 'video_title')
        description_top = resolve_langstring(self.video_description_top,
                                             args.get('lang'))
        description_bottom = resolve_langstring(self.video_description_bottom,
                                                args.get('lang'))
        description_side = resolve_langstring(self.video_description_side,
                                              args.get('lang'))
        description_entries_top = resolve_langstring_entries(
            self, 'video_description_top')
        description_entries_bottom = resolve_langstring_entries(
            self, 'video_description_bottom')
        description_entries_side = resolve_langstring_entries(
            self, 'video_description_side')

        MEDIA_ATTACHMENT = models.AttachmentPurpose.MEDIA_ATTACHMENT.value
        media_file = get_attachment_with_purpose(self.attachments, MEDIA_ATTACHMENT)

        if not (title_entries or
                description_entries_top or
                description_entries_bottom or
                description_entries_side or
                self.video_html_code or
                media_file):
            return None

        return Video(
            title=title,
            title_entries=title_entries,
            description_top=description_top,
            description_bottom=description_bottom,
            description_side=description_side,
            description_entries_top=description_entries_top,
            description_entries_bottom=description_entries_bottom,
            description_entries_side=description_entries_side,
            html_code=self.video_html_code,
            media_file=media_file and media_file.document
        )


class IdeaUnion(SQLAlchemyUnion):

    class Meta:
        types = (Idea, Thematic)
        model = models.Idea

    @classmethod
    def resolve_type(cls, instance, context, info):
        if isinstance(instance, graphene.ObjectType):
            return type(instance)
        elif isinstance(instance, models.Thematic):  # must be above Idea
            return Thematic
        elif isinstance(instance, models.Idea):
            return Idea


class QuestionInput(graphene.InputObjectType):
    __doc__ = docs.QuestionInput.__doc__
    id = graphene.ID(description=docs.QuestionInput.id)
    title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.QuestionInput.title_entries)


class VideoInput(graphene.InputObjectType):
    __doc__ = docs.VideoInput.__doc__
    title_entries = graphene.List(LangStringEntryInput, description=docs.VideoInput.title_entries)
    description_entries_top = graphene.List(LangStringEntryInput, description=docs.VideoInput.description_entries_top)
    description_entries_bottom = graphene.List(LangStringEntryInput, description=docs.VideoInput.description_entries_bottom)
    description_entries_side = graphene.List(LangStringEntryInput, description=docs.VideoInput.description_entries_side)
    html_code = graphene.String(description=docs.VideoInput.html_code)
    media_file = graphene.String(description=docs.VideoInput.media_file)


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
        video = graphene.Argument(VideoInput, description=docs.CreateThematic.video)
        announcement = graphene.Argument(IdeaAnnouncementInput, description=docs.Idea.announcement)
        questions = graphene.List(QuestionInput, description=docs.CreateThematic.questions)
        # this is the identifier of the part in a multipart POST
        image = graphene.String(description=docs.Default.required_language_input)
        order = graphene.Float(description=docs.Default.float_entry)
        message_view_override = graphene.String(description=docs.IdeaInterface.message_view_override)
        parent_id = graphene.ID(description=docs.Idea.parent_id)

    thematic = graphene.Field(lambda: IdeaUnion)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        EMBED_ATTACHMENT = models.AttachmentPurpose.EMBED_ATTACHMENT.value
        MEDIA_ATTACHMENT = models.AttachmentPurpose.MEDIA_ATTACHMENT.value
        cls = models.Idea
        phase_id = args.get('discussion_phase_id')
        phase = models.DiscussionPhase.get(phase_id)
        phase_identifier = phase.identifier
        if phase_identifier == Phases.survey.value:
            cls = models.Thematic

        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush as db:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception(
                    'Thematic titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            title_langstring = langstring_from_input_entries(title_entries)
            description_langstring = langstring_from_input_entries(
                args.get('description_entries'))
            kwargs = {}
            if description_langstring is not None:
                kwargs['description'] = description_langstring

            kwargs['message_view_override'] = args.get('message_view_override')

            video = args.get('video')
            video_media = None
            if video is not None:
                video_title = langstring_from_input_entries(
                    video.get('title_entries', None))
                if video_title is not None:
                    kwargs['video_title'] = video_title

                video_description_top = langstring_from_input_entries(
                    video.get('description_entries_top', None))
                if video_description_top is not None:
                    kwargs['video_description_top'] = video_description_top

                video_description_bottom = langstring_from_input_entries(
                    video.get('description_entries_bottom', None))
                if video_description_bottom is not None:
                    kwargs[
                        'video_description_bottom'] = video_description_bottom

                video_description_side = langstring_from_input_entries(
                    video.get('description_entries_side', None))
                if video_description_side is not None:
                    kwargs[
                        'video_description_side'] = video_description_side

                video_html_code = video.get('html_code', None)
                if video_html_code is not None:
                    kwargs['video_html_code'] = video_html_code

                video_media = video.get('media_file', None)

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
                # phase, child of the root idea,
                # and add our thematic as a child of this root thematic.
                parent_idea = get_root_thematic_for_phase(phase)
                if parent_idea is None:
                    parent_idea = create_root_thematic(phase)

            saobj = cls(
                discussion_id=discussion_id,
                discussion=discussion,
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
                saobj2 = create_idea_announcement(user_id, discussion, saobj, announcement_title_langstring, announcement_body_langstring)
                db.add(saobj2)

            # add uploaded image as an attachment to the idea
            image = args.get('image')
            if image is not None:
                new_attachment = create_attachment(
                    discussion,
                    models.IdeaAttachment,
                    image,
                    EMBED_ATTACHMENT,
                    context
                )
                new_attachment.idea = saobj
                db.add(new_attachment)

            # add uploaded image as an attachment to the idea
            if video_media is not None:
                new_attachment = create_attachment(
                    discussion,
                    models.IdeaAttachment,
                    video_media,
                    MEDIA_ATTACHMENT,
                    context
                )
                new_attachment.idea = saobj
                db.add(new_attachment)

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

        db.flush()
        return CreateThematic(thematic=saobj)


class UpdateThematic(graphene.Mutation):
    __doc__ = docs.UpdateThematic.__doc__

    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput, description=docs.Default.langstring_entries)
        description_entries = graphene.List(LangStringEntryInput, description=docs.Default.langstring_entries)
        video = graphene.Argument(VideoInput, description=docs.UpdateThematic.video)
        announcement = graphene.Argument(IdeaAnnouncementInput, description=docs.Idea.announcement)
        questions = graphene.List(QuestionInput, description=docs.UpdateThematic.questions)
        # this is the identifier of the part in a multipart POST
        image = graphene.String(description=docs.Default.required_language_input)
        order = graphene.Float(description=docs.Default.float_entry)
        message_view_override = graphene.String(description=docs.IdeaInterface.message_view_override)

    thematic = graphene.Field(lambda: IdeaUnion)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        EMBED_ATTACHMENT = models.AttachmentPurpose.EMBED_ATTACHMENT.value
        MEDIA_ATTACHMENT = models.AttachmentPurpose.MEDIA_ATTACHMENT.value
        cls = models.Idea
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        thematic_id = args.get('id')
        id_ = int(Node.from_global_id(thematic_id)[1])
        thematic = cls.get(id_)

        permissions = get_permissions(user_id, discussion_id)
        allowed = thematic.user_can(
            user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush as db:
            # introducing history at every step, including thematics + questions  # noqa: E501
            thematic.copy(tombstone=True)
            title_entries = args.get('title_entries')
            if title_entries is not None and len(title_entries) == 0:
                raise Exception(
                    'Thematic titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            update_langstring_from_input_entries(
                thematic, 'title', title_entries)
            update_langstring_from_input_entries(
                thematic, 'description', args.get('description_entries'))
            kwargs = {}
            video = args.get('video', None)
            if video is not None:
                update_langstring_from_input_entries(
                    thematic, 'video_title', video.get('title_entries', []))
                update_langstring_from_input_entries(
                    thematic, 'video_description_top',
                    video.get('description_entries_top', []))
                update_langstring_from_input_entries(
                    thematic, 'video_description_bottom',
                    video.get('description_entries_bottom', []))
                update_langstring_from_input_entries(
                    thematic, 'video_description_side',
                    video.get('description_entries_side', []))
                kwargs['video_html_code'] = video.get('html_code', None)

                video_media = video.get('media_file', None)
                if video_media:
                    update_attachment(
                        discussion,
                        models.IdeaAttachment,
                        video_media,
                        thematic.attachments,
                        MEDIA_ATTACHMENT,
                        db,
                        context
                    )

            kwargs['message_view_override'] = args.get('message_view_override')

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

                announcement_title_langstring = langstring_from_input_entries(announcement_title_entries)
                announcement_body_langstring = langstring_from_input_entries(announcement.get('body_entries', None))
                saobj2 = create_idea_announcement(user_id, discussion, thematic, announcement_title_langstring, announcement_body_langstring)
                db.add(saobj2)

            questions_input = args.get('questions')
            existing_questions = {
                question.id: question for question in thematic.get_children()}
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

            db.flush()

        return UpdateThematic(thematic=thematic)


class DeleteThematic(graphene.Mutation):
    __doc__ = docs.DeleteThematic.__doc__

    class Input:
        thematic_id = graphene.ID(required=True, description=docs.DeleteThematic.thematic_id)

    success = graphene.Boolean()

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        thematic_id = args.get('thematic_id')
        thematic_id = int(Node.from_global_id(thematic_id)[1])
        thematic = models.Idea.get(thematic_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = thematic.user_can(
            user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        thematic.is_tombstone = True
        questions = thematic.get_children()
        # Tombstone all questions of the thematic as well
        for q in questions:
            q.is_tombstone = True
        # TODO do it recursively for a normal idea
        thematic.db.flush()
        return DeleteThematic(success=True)
