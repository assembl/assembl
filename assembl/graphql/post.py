import os.path
from datetime import datetime

import graphene
from graphene.pyutils.enum import Enum as PyEnum
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.i18n import TranslationStringFactory
from pyramid.security import Everyone

from assembl import models
from assembl.auth import P_DELETE_MY_POST, P_DELETE_POST, CrudPermissions
from assembl.auth.util import get_permissions
from assembl.lib.clean_input import sanitize_html, sanitize_text
from assembl.models.auth import (LanguagePreferenceCollection,
                                 LanguagePreferenceCollectionWithDefault)
from jwzthreading import restrip_pat

from .document import Document
from .idea import Idea
from .langstring import (LangStringEntry, resolve_best_langstring_entries,
                         resolve_langstring)
from .sentiment import SentimentCounts, SentimentTypes
from .types import SecureObjectType, SQLAlchemyInterface
from .user import AgentProfile
from .utils import DateTime, abort_transaction_on_exception


_ = TranslationStringFactory('assembl')

publication_states_enum = PyEnum(
    'PublicationStates', [(k, k) for k in models.PublicationStates.values()])
PublicationStates = graphene.Enum.from_enum(publication_states_enum)


class Extract(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Extract
        interfaces = (Node, )
        only_fields = ('id', 'body', 'important')


class PostAttachment(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.PostAttachment
        only_fields = ('id',)

    document = graphene.Field(Document)


class IdeaContentLink(graphene.ObjectType):
    idea_id = graphene.Int()
    post_id = graphene.Int()
    creator_id = graphene.Int()
    type = graphene.String(required=True)
    idea = graphene.Field(lambda: Idea)
    post = graphene.Field(lambda: Post)
    creator = graphene.Field(lambda: AgentProfile)
    creation_date = DateTime()

    def resolve_idea(self, args, context, info):
        if self.idea_id is not None:
            idea = models.Idea.get(self.idea_id)
            # only resolve if it's an Idea, not a Question
            if type(idea) == models.Idea:
                return idea

    def resolve_post(self, args, context, info):
        if self.post_id is not None:
            return models.Post.get(self.post_id)

    def resolve_creator(self, args, context, info):
        if self.creator_id is not None:
            return models.AgentProfile.get(self.creator_id)


class PostInterface(SQLAlchemyInterface):
    class Meta:
        model = models.Post
        only_fields = ('creator', 'message_classifier')
        # Don't add id in only_fields in an interface or the the id of Post
        # will be just the primary key, not the base64 type:id

    creation_date = DateTime()
    modification_date = DateTime()
    subject = graphene.String(lang=graphene.String())
    body = graphene.String(lang=graphene.String())
    subject_entries = graphene.List(LangStringEntry, lang=graphene.String())
    body_entries = graphene.List(LangStringEntry, lang=graphene.String())
    sentiment_counts = graphene.Field(SentimentCounts)
    my_sentiment = graphene.Field(type=SentimentTypes)
    indirect_idea_content_links = graphene.List(IdeaContentLink)
    extracts = graphene.List(Extract)
    parent_id = graphene.ID()
    body_mime_type = graphene.String(required=True)
    publication_state = graphene.Field(type=PublicationStates)
    attachments = graphene.List(PostAttachment)
    original_locale = graphene.String()

    def resolve_subject(self, args, context, info):
        # Use self.subject and not self.get_subject() because we still
        # want the subject even when the post is deleted.
        subject = resolve_langstring(self.subject, args.get('lang'))
        return subject

    def resolve_body(self, args, context, info):
        body = resolve_langstring(self.get_body(), args.get('lang'))
        return body

    @staticmethod
    def _maybe_translate(post, locale, request):
        if request.authenticated_userid == Everyone:
            # anonymous cannot trigger translations
            return
        if locale:
            lpc = LanguagePreferenceCollectionWithDefault(locale)
        else:
            lpc = LanguagePreferenceCollection.getCurrent(request)
        for ls in (post.body, post.subject):
            source_locale = ls.first_original().locale_code
            pref = lpc.find_locale(source_locale)
            target_locale = pref.translate_to_locale
            if not target_locale:
                continue
            target_locale = target_locale.code
            if not ls.closest_entry(target_locale):
                post.maybe_translate(lpc)

    def resolve_subject_entries(self, args, context, info):
        # Use self.subject and not self.get_subject() because we still
        # want the subject even when the post is deleted.
        PostInterface._maybe_translate(self, args.get('lang'), context)
        subject = resolve_best_langstring_entries(
            self.subject, args.get('lang'))
        return subject

    def resolve_body_entries(self, args, context, info):
        PostInterface._maybe_translate(self, args.get('lang'), context)
        body = resolve_best_langstring_entries(
            self.get_body(), args.get('lang'))
        return body

    def resolve_sentiment_counts(self, args, context, info):
        # get the sentiment counts from the cache if it exists instead of
        # tiggering a sql query
        cache = getattr(context, 'sentiment_counts_by_post_id', None)
        if cache is not None:
            sentiment_counts = {
                name: 0 for name in models.SentimentOfPost.all_sentiments
            }
            sentiment_counts.update(cache[self.id])
        else:
            sentiment_counts = self.sentiment_counts

        return SentimentCounts(
            dont_understand=sentiment_counts['dont_understand'],
            disagree=sentiment_counts['disagree'],
            like=sentiment_counts['like'],
            more_info=sentiment_counts['more_info'],
        )

    def resolve_my_sentiment(self, args, context, info):
        my_sentiment = self.my_sentiment
        if my_sentiment is None:
            return None

        return my_sentiment.name.upper()

    def resolve_indirect_idea_content_links(self, args, context, info):
        # example:
        #  {'@id': 'local:IdeaContentLink/101',
        #   '@type': 'Extract',
        #   'created': '2014-04-25T17:51:52Z',
        #   'idCreator': 'local:AgentProfile/152',
        #   'idIdea': 'local:Idea/52',
        #   'idPost': 'local:Content/1467'},
        # for @type == 'Extract', idIdea may be None
        # @type == 'IdeaRelatedPostLink' for idea links
        links = [IdeaContentLink(
            idea_id=models.Idea.get_database_id(link['idIdea']),
            post_id=models.Post.get_database_id(link['idPost']),
            type=link['@type'],
            creation_date=link['created'],
            creator_id=link['idCreator'])
            for link in self.indirect_idea_content_links_with_cache()]
        # only return links with the IdeaRelatedPostLink type
        return [link for link in links if link.type == 'IdeaRelatedPostLink']

    def resolve_parent_id(self, args, context, info):
        if self.parent_id is None:
            return None

        return Node.to_global_id('Post', self.parent_id)

    def resolve_body_mime_type(self, args, context, info):
        return self.get_body_mime_type()

    def resolve_publication_state(self, args, context, info):
        return self.publication_state.name

    def resolve_original_locale(self, args, context, info):
        entry = self.body.first_original()
        if entry:
            return entry.locale_code

        return u''


class Post(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Post
        interfaces = (Node, PostInterface)
        only_fields = ('id',)  # inherits fields from Post interface only


class PostConnection(graphene.Connection):
    class Meta:
        node = Post


class CreatePost(graphene.Mutation):
    class Input:
        subject = graphene.String()
        body = graphene.String(required=True)
        idea_id = graphene.ID(required=True)
        # A Post (except proposals in survey phase) can reply to another post.
        # See related code in views/api/post.py
        parent_id = graphene.ID()
        attachments = graphene.List(graphene.String)
        message_classifier = graphene.String()

    post = graphene.Field(lambda: Post)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        discussion = models.Discussion.get(discussion_id)

        idea_id = args.get('idea_id')
        idea_id = int(Node.from_global_id(idea_id)[1])
        in_reply_to_idea = models.Idea.get(idea_id)
        if isinstance(in_reply_to_idea, models.Question):
            cls = models.PropositionPost
        else:
            cls = models.AssemblPost

        in_reply_to_post = None
        if cls == models.AssemblPost:
            in_reply_to_post_id = args.get('parent_id')
            if in_reply_to_post_id:
                in_reply_to_post_id = int(
                    Node.from_global_id(in_reply_to_post_id)[1])
                if in_reply_to_post_id:
                    in_reply_to_post = models.Post.get(in_reply_to_post_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            subject = args.get('subject')
            body = args.get('body')
            classifier = args.get('message_classifier', None)
            body = sanitize_html(body)
            body_langstring = models.LangString.create(body)
            if subject:
                subject = sanitize_text(subject)
                subject_langstring = models.LangString.create(subject)
            elif issubclass(cls, models.PropositionPost):
                # Specific case first. Respect inheritance. Since we are using
                # a specific value, construct it with localization machinery.
                subject_langstring = models.LangString.create_localized_langstring(  # noqa: E501
                    _('Proposal'),
                    discussion.discussion_locales, {'fr': 'Proposition'})
            else:
                # We apply the same logic than in views/api/post.py::create_post  # noqa: E501
                locale = models.Locale.UNDEFINED
                if in_reply_to_post and in_reply_to_post.get_title():
                    original_subject = in_reply_to_post.get_title(
                        ).first_original()
                    locale = original_subject.locale_code
                    subject = original_subject.value
                elif in_reply_to_idea:
                    # TODO: some ideas have extra langstring titles
                    subject = (in_reply_to_idea.title.first_original().value)
                    locale = discussion.main_locale
                else:
                    subject = discussion.topic if discussion.topic else ''
                    locale = discussion.main_locale

                if subject:
                    new_subject = u'Re: ' + restrip_pat.sub('', subject).strip()  # noqa: E501
                    if (in_reply_to_post and new_subject == subject and
                            in_reply_to_post.get_title()):
                        # reuse subject and translations
                        subject_langstring = in_reply_to_post.get_title(
                            ).clone(discussion.db)
                    else:
                        subject_langstring = models.LangString.create(
                            new_subject, locale)

            new_post = cls(
                discussion=discussion,
                subject=subject_langstring,
                body=body_langstring,
                creator_id=user_id,
                body_mime_type=u'text/html',
                message_classifier=classifier
            )
            new_post.guess_languages()
            db = new_post.db
            db.add(new_post)
            db.flush()
            if in_reply_to_post:
                new_post.set_parent(in_reply_to_post)
            elif in_reply_to_idea:
                # don't create IdeaRelatedPostLink when we have both
                # in_reply_to_post and in_reply_to_idea
                idea_post_link = models.IdeaRelatedPostLink(
                    creator_id=user_id,
                    content=new_post,
                    idea=in_reply_to_idea
                )
                db.add(idea_post_link)

            db.flush()
            new_post.db.expire(new_post, ['idea_content_links_above_post'])

            attachments = args.get('attachments', [])
            for document_id in attachments:
                document = models.Document.get(document_id)
                models.PostAttachment(
                    document=document,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    post=new_post,
                    title=document.title,
                    attachmentPurpose="EMBED_ATTACHMENT"
                )

            db.flush()

        return CreatePost(post=new_post)


class UpdatePost(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)
        subject = graphene.String()
        body = graphene.String(required=True)
        attachments = graphene.List(graphene.String)

    post = graphene.Field(lambda: Post)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        discussion = models.Discussion.get(discussion_id)

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        cls = models.Post

        permissions = get_permissions(user_id, discussion_id)
        allowed = post.user_can(user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        changed = False
        subject = args.get('subject')
        if subject:
            subject = sanitize_text(subject)
        body = args.get('body')
        if body:
            body = sanitize_html(body)
        # TODO: Here, an assumption that the modification uses the same
        # language as the original. May need revisiting.
        original_subject_entry = post.subject.first_original()
        # subject is not required, be careful to not remove it if not specified
        if subject and subject != original_subject_entry.value:
            changed = True
            post.subject.add_value(subject, original_subject_entry.locale_code)
            # Edit subject for all descendants
            children = post.children[:]
            new_subject = u'Re: ' + restrip_pat.sub('', subject).strip()
            while children:
                child = children.pop()
                children.extend(child.children)
                child.subject.add_value(
                    new_subject, child.subject.first_original().locale_code)

        original_body_entry = post.body.first_original()
        if body != original_body_entry.value:
            post.body.add_value(body, original_body_entry.locale_code)
            changed = True

            original_attachments = post.attachments
            original_attachments_doc_ids = []
            if original_attachments:
                original_attachments_doc_ids = [
                    str(a.document_id) for a in original_attachments]

            attachments = args.get('attachments', [])
            for document_id in attachments:
                if document_id not in original_attachments_doc_ids:
                    document = models.Document.get(document_id)
                    models.PostAttachment(
                        document=document,
                        discussion=discussion,
                        creator_id=context.authenticated_userid,
                        post=post,
                        title=document.title,
                        attachmentPurpose="EMBED_ATTACHMENT"
                    )

            # delete attachments that has been removed
            documents_to_delete = set(original_attachments_doc_ids) - set(attachments)  # noqa: E501
            for document_id in documents_to_delete:
                with cls.default_db.no_autoflush:
                    document = models.Document.get(document_id)
                    post_attachment = post.db.query(
                        models.PostAttachment
                    ).filter_by(
                        discussion_id=discussion_id, post_id=post_id,
                        document_id=document_id
                    ).first()
                    post.db.delete(document)
                    post.attachments.remove(post_attachment)
                    post.db.flush()

        if changed:
            post.modification_date = datetime.utcnow()
            post.body_mime_type = u'text/html'
            post.db.flush()
            post.db.expire(post.subject, ["entries"])
            post.db.expire(post.body, ["entries"])

        return UpdatePost(post=post)


class DeletePost(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)

    post = graphene.Field(lambda: Post)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = post.user_can(user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        # Same logic as in assembl/views/api2/post.py:delete_post_instance
        # Remove extracts associated to this post
        extracts_to_remove = post.db.query(models.Extract).filter(
            models.Extract.content_id == post.id).all()
        for extract in extracts_to_remove:
            extract.delete()

        if user_id == post.creator_id and P_DELETE_MY_POST in permissions:
            cause = models.PublicationStates.DELETED_BY_USER
        elif P_DELETE_POST in permissions:
            cause = models.PublicationStates.DELETED_BY_ADMIN

        post.delete_post(cause)
        post.db.flush()
        return DeletePost(post=post)


class UndeletePost(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)

    post = graphene.Field(lambda: Post)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        permissions = get_permissions(user_id, discussion_id)
        allowed = post.user_can(user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        post.undelete_post()
        post.db.flush()
        return UndeletePost(post=post)


class AddPostAttachment(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)
        file = graphene.String(
            required=True
        )

    post = graphene.Field(lambda: Post)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)

        user_id = context.authenticated_userid or Everyone

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)

        cls = models.PostAttachment
        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(
            user_id, CrudPermissions.CREATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        # add uploaded file as an attachment to the post
        attachment = args.get('file')
        if attachment is not None:
            filename = os.path.basename(context.POST[attachment].filename)
            mime_type = context.POST[attachment].type
            uploaded_file = context.POST[attachment].file
            uploaded_file.seek(0)
            data = uploaded_file.read()
            document = models.File(
                discussion=discussion,
                mime_type=mime_type,
                title=filename,
                data=data)

            attachment = models.PostAttachment(
                document=document,
                discussion=discussion,
                creator_id=context.authenticated_userid,
                post=post,
                title=filename,
                attachmentPurpose="EMBED_ATTACHMENT"
            )
            post.db.flush()

        return AddPostAttachment(post=post)


class DeletePostAttachment(graphene.Mutation):
    class Input:
        post_id = graphene.ID(required=True)
        attachment_id = graphene.Int(required=True)

    post = graphene.Field(lambda: Post)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        permissions = get_permissions(user_id, discussion_id)
        post_attachment_id = args.get('attachment_id')
        post_attachment = models.PostAttachment.get(post_attachment_id)
        allowed = post_attachment.user_can(
            user_id, CrudPermissions.DELETE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        cls = models.Post
        with cls.default_db.no_autoflush:
            post.db.delete(post_attachment.document)
            post.attachments.remove(post_attachment)

        post.db.flush()

        return DeletePostAttachment(post=post)
