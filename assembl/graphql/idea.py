import os.path
from collections import defaultdict
from random import sample as random_sample

import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyConnectionField, SQLAlchemyObjectType
from graphene_sqlalchemy.utils import is_mapped
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone
from sqlalchemy import desc, func, join, select
from sqlalchemy.orm import joinedload, undefer
from sqlalchemy.sql.functions import count

from assembl import models
from assembl.auth import IF_OWNED, CrudPermissions
from assembl.auth.util import get_permissions
from assembl.models.action import SentimentOfPost

from .document import Document
from .langstring import (LangStringEntry, LangStringEntryInput,
                         langstring_from_input_entries, resolve_langstring,
                         resolve_langstring_entries,
                         update_langstring_from_input_entries)
from .types import SecureObjectType, SQLAlchemyUnion
from .user import AgentProfile
from .utils import (
    abort_transaction_on_exception, get_fields, get_root_thematic_for_phase,
    create_root_thematic)


class Video(graphene.ObjectType):
    title = graphene.String()
    description_top = graphene.String()
    description_bottom = graphene.String()
    description_side = graphene.String()
    html_code = graphene.String()
    title_entries = graphene.List(LangStringEntry)
    description_entries_top = graphene.List(LangStringEntry)
    description_entries_bottom = graphene.List(LangStringEntry)
    description_entries_side = graphene.List(LangStringEntry)


class IdeaInterface(graphene.Interface):
    num_posts = graphene.Int()
    num_contributors = graphene.Int()
    num_children = graphene.Int(identifier=graphene.String())
    img = graphene.Field(Document)
    order = graphene.Float()
    live = graphene.Field(lambda: IdeaUnion)
    message_view_override = graphene.String()

    def resolve_num_posts(self, args, context, info):
        if isinstance(self, models.RootIdea):
            # If this is RootIdea, do the sum of all children to be sure
            # we use the same counters that we see on each idea which are
            # based on countable states.
            # Don't use RootIdea.num_posts that give much higher count.
            return sum([child.num_posts for child in self.get_children()])

        return self.num_posts

    def resolve_img(self, args, context, info):
        if self.attachments:
            return self.attachments[0].document

    def resolve_order(self, args, context, info):
        return self.get_order_from_first_parent()

    def resolve_num_children(self, args, context, info):
        phase = args.get('identifier', '')
        if phase == 'multiColumns':
            _it = models.Idea.__table__
            _ilt = models.IdeaLink.__table__
            _target_it = models.Idea.__table__.alias()
            j = join(_ilt, _it, _ilt.c.source_id == _it.c.id
                     ).join(_target_it, _ilt.c.target_id == _target_it.c.id)
            num = select([func.count(_ilt.c.id)]).select_from(j).where(
                (_ilt.c.tombstone_date == None)  # noqa: E711
                & (_it.c.tombstone_date == None)
                & (_it.c.id == self.id)
                & (_target_it.c.message_view_override == 'messageColumns')
            ).correlate_except(_ilt)
            return self.db.execute(num).fetchone()[0]

        return self.num_children


class IdeaAnnoucement(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.IdeaAnnouncement
        interfaces = (Node,)
        only_fields = ('id',)

    title = graphene.String(lang=graphene.String())
    body = graphene.String(lang=graphene.String())

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_body(self, args, context, info):
        return resolve_langstring(self.body, args.get('lang'))


class IdeaMessageColumn(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.IdeaMessageColumn
        interfaces = (Node,)
        only_fields = ('id', 'message_classifier', 'color')

    index = graphene.Int()
    idea = graphene.Field(lambda: Idea)
    name = graphene.String(lang=graphene.String())
    title = graphene.String(lang=graphene.String())
    header = graphene.String(lang=graphene.String())
    num_posts = graphene.Int()

    def resolve_idea(self, args, context, info):
        if self.idea:
            return self.idea

    def resolve_name(self, args, context, info):
        return resolve_langstring(self.name, args.get('lang'))

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_header(self, args, context, info):
        return resolve_langstring(self.header, args.get('lang'))

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


class Idea(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Idea
        interfaces = (Node, IdeaInterface)
        only_fields = ('id', )

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    # TODO: Look into seperating synthesis_title from 'What you need to know',
    # they mean different things
    # This is the "What you need to know"
    synthesis_title = graphene.String(lang=graphene.String())
    description = graphene.String(lang=graphene.String())
    description_entries = graphene.List(LangStringEntry)
    children = graphene.List(lambda: Idea)
    parent_id = graphene.ID()
    posts = SQLAlchemyConnectionField('assembl.graphql.post.PostConnection')  # use dotted name to avoid circular import  # noqa: E501
    contributors = graphene.List(AgentProfile)
    announcement = graphene.Field(lambda: IdeaAnnoucement)
    message_columns = graphene.List(lambda: IdeaMessageColumn)
    ancestors = graphene.List(graphene.ID)

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

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_synthesis_title(self, args, context, info):
        return resolve_langstring(self.synthesis_title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_description(self, args, context, info):
        description = resolve_langstring(self.description, args.get('lang'))
        if not description:
            description = self.get_definition_preview()
        return description

    def resolve_description_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'description')

    def resolve_children(self, args, context, info):
        # filter on child.hidden to not include the root thematic in the children of root_idea  # noqa: E501
        return [child for child in self.get_children() if not child.hidden]

    def resolve_parent_id(self, args, context, info):
        parents = self.get_parents()
        if not parents:
            return None

        return Node.to_global_id('Idea', parents[0].id)

    def resolve_ancestors(self, args, context, info):
        return [Node.to_global_id('Idea', id)
                for id in self.get_all_ancestors(id_only=True)]

    def resolve_posts(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        # include_deleted=None means all posts (live and tombstoned)
        related = self.get_related_posts_query(
            partial=True, include_deleted=None)
        # The related query returns a list of (<PropositionPost id=2 >, None) instead of <PropositionPost id=2 > when authenticated, this is why we do another query here:  # noqa: E501
        Post = models.Post
        query = Post.query.join(
            related, Post.id == related.c.post_id
        ).order_by(desc(Post.creation_date), Post.id
                   ).options(
            joinedload(Post.creator),
            undefer(Post.idea_content_links_above_post)
        )
        if len(discussion.discussion_locales) > 1:
            query = query.options(*models.Content.subqueryload_options())
        else:
            query = query.options(*models.Content.joinedload_options())

        # do only one sql query to calculate sentiment_counts
        # instead of doing one query for each post
        fields = get_fields(info)
        if 'sentimentCounts' in fields.get('edges', {}).get('node', {}):
            sentiment_counts = discussion.db.query(
                models.Post.id, models.SentimentOfPost.type, count(
                    models.SentimentOfPost.id)
            ).join(models.SentimentOfPost).filter(
                models.Post.id.in_(
                    query.with_entities(models.Post.id).subquery()),
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

        # pagination is done after that, no need to do it ourself
        return query

    def resolve_contributors(self, args, context, info):
        contributor_ids = [cid for (cid,) in self.get_contributors_query()]
        contributors = [models.AgentProfile.get(
            cid) for cid in contributor_ids]
        return contributors

    def resolve_announcement(self, args, context, info):
        return self.get_applicable_announcement()


class Question(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Question
        interfaces = (Node, )
        only_fields = ('id', )

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    posts = SQLAlchemyConnectionField(
        'assembl.graphql.post.PostConnection',  # use dotted name to avoid circular import  # noqa: E501
        random=graphene.Boolean())

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

            if first_post is not None:
                query = [first_post] + query.all()

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

        # pagination is done after that, no need to do it ourself
        return query


class Thematic(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Thematic
        interfaces = (Node, IdeaInterface)
        only_fields = ('id', 'identifier')

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    description = graphene.String(lang=graphene.String())
    questions = graphene.List(Question)
    video = graphene.Field(Video, lang=graphene.String())

    def resolve_title(self, args, context, info):
        title = resolve_langstring(self.title, args.get('lang'))
        return title

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')

    def resolve_description(self, args, context, info):
        return resolve_langstring(self.description, args.get('lang'))

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
        if not (title_entries or
                description_entries_top or
                description_entries_bottom or
                description_entries_side or self.video_html_code):
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
    id = graphene.ID()
    title_entries = graphene.List(LangStringEntryInput, required=True)


class VideoInput(graphene.InputObjectType):
    title_entries = graphene.List(LangStringEntryInput)
    description_entries_top = graphene.List(LangStringEntryInput)
    description_entries_bottom = graphene.List(LangStringEntryInput)
    description_entries_side = graphene.List(LangStringEntryInput)
    html_code = graphene.String()


# Create an Idea to be used in a Thread phase
# (and displayed in frontend version 1 or 2)
# Maybe some of its logic should be factorized with CreateThematic
# For now, we on purpose do not make use of an "identifier" input
# (identifier of the phase this idea will be visible in) like we would
# do in CreateThematic mutation, because behavior between frontend
# v1 and v2 has not yet been completely clarified.
class CreateIdea(graphene.Mutation):
    class Input:
        # Careful, having required=True on a graphene.List only means
        # it can't be None, having an empty [] is perfectly valid.
        title_entries = graphene.List(LangStringEntryInput, required=True)
        description_entries = graphene.List(LangStringEntryInput)
        # this is the identifier of the part in a multipart POST
        image = graphene.String()
        order = graphene.Float()
        parent_id = graphene.ID()

    idea = graphene.Field(lambda: Idea)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Idea
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception('Idea titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            title_langstring = langstring_from_input_entries(title_entries)
            description_langstring = langstring_from_input_entries(
                args.get('description_entries'))
            kwargs = {}
            if description_langstring is not None:
                kwargs['description'] = description_langstring

            parent_idea_id = args.get('parent_id')
            if parent_idea_id:
                    parent_idea_id = int(
                        Node.from_global_id(parent_idea_id)[1])
                    if parent_idea_id:
                        parent_idea = models.Idea.get(parent_idea_id)
                        if not parent_idea:
                            raise Exception('Parent Idea not found')
                        if parent_idea.discussion != discussion:
                            # No cross-debate references are allowed,
                            # for security reasons
                            raise Exception(
                                'Parent Idea does not belong to this discussion')  # noqa: E501
                    else:
                        raise Exception('Parent Idea not found')
            if not parent_idea_id:
                parent_idea = discussion.root_idea

            saobj = cls(
                discussion_id=discussion_id,
                title=title_langstring,
                **kwargs)
            db = saobj.db
            db.add(saobj)
            order = len(parent_idea.get_children()) + 1.0
            db.add(
                models.IdeaLink(source=parent_idea, target=saobj,
                                order=args.get('order', order)))

            # add uploaded image as an attachment to the idea
            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                models.IdeaAttachment(
                    document=document,
                    idea=saobj,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="EMBED_ATTACHMENT"
                )

            db.flush()

        return CreateIdea(idea=saobj)


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
    class Input:
        # Careful, having required=True on a graphene.List only means
        # it can't be None, having an empty [] is perfectly valid.
        title_entries = graphene.List(LangStringEntryInput, required=True)
        description_entries = graphene.List(LangStringEntryInput)
        identifier = graphene.String(required=True)
        video = graphene.Argument(VideoInput)
        questions = graphene.List(QuestionInput)
        # this is the identifier of the part in a multipart POST
        image = graphene.String()
        order = graphene.Float()

    thematic = graphene.Field(lambda: Thematic)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Thematic
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()

        identifier = args.get('identifier')
        with cls.default_db.no_autoflush:
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

            video = args.get('video')
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

            # Our thematic, because it inherits from Idea, needs to be
            # associated to the root idea of the discussion.
            # We create a hidden root thematic, corresponding to the
            # `identifier` phase, child of the root idea,
            # and add our thematic as a child of this root thematic.
            root_thematic = get_root_thematic_for_phase(discussion, identifier)
            if root_thematic is None:
                root_thematic = create_root_thematic(discussion, identifier)

            saobj = cls(
                discussion_id=discussion_id,
                title=title_langstring,
                identifier=identifier,
                **kwargs)
            db = saobj.db
            db.add(saobj)
            order = len(root_thematic.get_children()) + 1.0
            db.add(
                models.IdeaLink(source=root_thematic, target=saobj,
                                order=args.get('order', order)))

            # add uploaded image as an attachment to the idea
            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                models.IdeaAttachment(
                    document=document,
                    idea=saobj,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="EMBED_ATTACHMENT"
                )

            db.flush()

            questions_input = args.get('questions')
            if questions_input is not None:
                for idx, question_input in enumerate(questions_input):
                    title_ls = langstring_from_input_entries(
                        question_input['title_entries'])
                    question = models.Question(
                        title=title_ls,
                        discussion_id=discussion_id
                    )
                    db.add(
                        models.IdeaLink(source=saobj, target=question,
                                        order=idx + 1.0))
                db.flush()

        return CreateThematic(thematic=saobj)


class UpdateThematic(graphene.Mutation):
    class Input:
        id = graphene.ID(required=True)
        title_entries = graphene.List(LangStringEntryInput)
        description_entries = graphene.List(LangStringEntryInput)
        identifier = graphene.String()
        video = graphene.Argument(VideoInput)
        questions = graphene.List(QuestionInput)
        # this is the identifier of the part in a multipart POST
        image = graphene.String()
        order = graphene.Float()

    thematic = graphene.Field(lambda: Thematic)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Thematic
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

        with cls.default_db.no_autoflush:
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

            if args.get('identifier') is not None:
                kwargs['identifier'] = args.get('identifier')

            for attr, value in kwargs.items():
                setattr(thematic, attr, value)

            db = thematic.db

            # change order if needed
            order = args.get('order')
            if order:
                thematic.source_links[0].order = order

            # add uploaded image as an attachment to the idea
            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                uploaded_file = context.POST[image].file
                uploaded_file.seek(0)
                data = uploaded_file.read()
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename,
                    data=data)
                # if there is already an attachment, remove it with the
                # associated document (image)
                if thematic.attachments:
                    db.delete(thematic.attachments[0].document)
                    thematic.attachments.remove(thematic.attachments[0])

                attachment = models.IdeaAttachment(
                    document=document,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="EMBED_ATTACHMENT"
                )
                thematic.attachments.append(attachment)
            db.flush()

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
    class Input:
        thematic_id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        thematic_id = args.get('thematic_id')
        thematic_id = int(Node.from_global_id(thematic_id)[1])
        thematic = models.Thematic.get(thematic_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = thematic.user_can(
            user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        thematic.is_tombstone = True
        thematic.db.flush()
        return DeleteThematic(success=True)
