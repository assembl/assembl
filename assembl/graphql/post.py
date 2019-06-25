from datetime import datetime

import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.i18n import TranslationStringFactory
from sqlalchemy.orm import joinedload
from sqlalchemy import exists

from assembl import models
from assembl.auth import (
    Everyone, P_MODERATE, P_DELETE_MY_POST, P_DELETE_POST, P_ADD_SIDE_COMMENT, CrudPermissions)
from assembl.auth.util import get_permissions
from assembl.lib.clean_input import sanitize_html, sanitize_text
from assembl.models.auth import (LanguagePreferenceCollection,
                                 LanguagePreferenceCollectionWithDefault)
from jwzthreading import restrip_pat

import assembl.graphql.docstrings as docs
from .permissions_helpers import (
    require_cls_permission, require_instance_permission, require_specific_permission)
from .attachment import Attachment
from .idea import Idea, TagResult
from .langstring import (LangStringEntry, resolve_best_langstring_entries,
                         resolve_langstring)
from .sentiment import SentimentCounts, SentimentTypes
from .types import SecureObjectType, SQLAlchemyInterface
from .user import AgentProfile
from .utils import DateTime, PublicationStates, abort_transaction_on_exception
from .synthesis import Synthesis
from .extract import Extract, ExtractStates, ExtractNatures
from .tag import Tag

_ = TranslationStringFactory('assembl')


class IdeaContentLink(graphene.ObjectType):
    __doc__ = docs.IdeaContentLink.__doc__

    idea_id = graphene.Int(description=docs.IdeaContentLink.idea_id)
    post_id = graphene.Int(description=docs.IdeaContentLink.post_id)
    creator_id = graphene.Int(description=docs.IdeaContentLink.creator_id)
    type = graphene.String(required=True, description=docs.IdeaContentLink.type)
    idea = graphene.Field(lambda: Idea, description=docs.IdeaContentLink.idea)
    post = graphene.Field(lambda: Post, description=docs.IdeaContentLink.post)
    creator = graphene.Field(lambda: AgentProfile, description=docs.IdeaContentLink.creator)
    creation_date = DateTime(description=docs.IdeaContentLink.creation_date)

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
    __doc__ = docs.PostInterface.__doc__

    class Meta:
        model = models.Post
        only_fields = ('creator', 'message_classifier')
        # Don't add id in only_fields in an interface or the the id of Post
        # will be just the primary key, not the base64 type:id

    creation_date = DateTime(description=docs.PostInterface.creation_date)
    modification_date = DateTime(description=docs.PostInterface.modification_date)
    subject = graphene.String(lang=graphene.String(), description=docs.PostInterface.subject)
    body = graphene.String(lang=graphene.String(), description=docs.PostInterface.body)
    subject_entries = graphene.List(LangStringEntry, lang=graphene.String(), description=docs.PostInterface.subject_entries)
    body_entries = graphene.List(LangStringEntry, lang=graphene.String(), description=docs.PostInterface.body_entries)
    sentiment_counts = graphene.Field(SentimentCounts, description=docs.PostInterface.sentiment_counts)
    my_sentiment = graphene.Field(type=SentimentTypes, description=docs.PostInterface.my_sentiment)
    indirect_idea_content_links = graphene.List(IdeaContentLink, description=docs.PostInterface.indirect_idea_content_links)
    extracts = graphene.List(Extract, description=docs.PostInterface.extracts)
    parent_id = graphene.ID(description=docs.PostInterface.parent_id)
    db_id = graphene.Int(description=docs.PostInterface.db_id)
    body_mime_type = graphene.String(required=True, description=docs.PostInterface.body_mime_type)
    publication_state = graphene.Field(type=PublicationStates, description=docs.PostInterface.publication_state)
    attachments = graphene.List(Attachment, description=docs.PostInterface.attachments)
    original_locale = graphene.String(description=docs.PostInterface.original_locale)
    publishes_synthesis = graphene.Field(lambda: Synthesis, description=docs.PostInterface.publishes_synthesis)
    type = graphene.String(description=docs.PostInterface.type)
    discussion_id = graphene.String(description=docs.PostInterface.discussion_id)
    modified = graphene.Boolean(description=docs.PostInterface.modified)
    parent_post_creator = graphene.Field(lambda: AgentProfile, description=docs.PostInterface.parent_post_creator)
    parent_extract_id = graphene.ID(description=docs.PostInterface.parent_extract_id)
    keywords = graphene.List(TagResult, description=docs.PostInterface.keywords)
    nlp_sentiment = graphene.Float(description=docs.PostInterface.nlp_sentiment)
    tags = graphene.List(Tag, description=docs.PostInterface.tags)

    def resolve_db_id(self, args, context, info):
        return self.id

    def resolve_extracts(self, args, context, info):
        return self.db.query(models.Extract
                             ).join(models.Content, models.Extract.content == self
                                    ).options(joinedload(models.Extract.text_fragment_identifiers)
                                              ).order_by(models.Extract.creation_date
                                                         ).all()

    def resolve_subject(self, args, context, info):
        # Use self.subject and not self.get_subject() because we still
        # want the subject even when the post is deleted.
        subject = resolve_langstring(self.subject, args.get('lang'))
        return subject

    def resolve_body(self, args, context, info):
        body = resolve_langstring(self.get_body(), args.get('lang'))
        return body

    def resolve_parent_post_creator(self, args, context, info):
        if self.parent_id:
            post = models.Content.get(self.parent_id)
            return post.creator

    @staticmethod
    @abort_transaction_on_exception
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
        # flush so abort_transaction_on_exception decorator can catch the error
        post.db.flush()

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

        return models.Post.graphene_id_for(self.parent_id)

    def resolve_body_mime_type(self, args, context, info):
        return self.get_body_mime_type()

    def resolve_publication_state(self, args, context, info):
        return self.publication_state.name

    def resolve_original_locale(self, args, context, info):
        entry = self.body.first_original()
        if entry:
            return entry.locale_code

        return u''

    def resolve_type(self, args, context, info):
        return self.__class__.__name__

    def resolve_modified(self, args, context, info):
        return self.get_modification_date() > self.creation_date

    def resolve_parent_extract_id(self, args, context, info):
        if self.parent_extract_id is None:
            return None

        return models.Extract.graphene_id_for(self.parent_extract_id)

    def resolve_keywords(self, args, context, info):
        return [TagResult(score=r.score, value=r.value, count=r.count)
                for r in self.nlp_keywords()]

    def resolve_nlp_sentiment(self, args, context, info):
        sentiments = self.watson_sentiments
        if sentiments:
            # assume only one for now
            return sentiments[0].sentiment

    def resolve_tags(self, args, context, info):
        return self.tags


class Post(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Post.__doc__

    class Meta:
        model = models.Content
        # This matches models.Post and models.ColumnSynthesisPost which
        # inherits from models.Content directly, not models.Post
        interfaces = (Node, PostInterface)
        only_fields = ('id',)  # inherits fields from Post interface only


class ExtractComment(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.ExtractComment
        interfaces = (Node, PostInterface)
        only_fields = ('id', 'parent_extract')


class PostConnection(graphene.Connection):

    class Meta:
        node = Post


class PostExtractEntryFields(graphene.AbstractType):
    post_id = graphene.String(required=True, description=docs.PostExtract.post_id)
    offset_start = graphene.Int(required=True, description=docs.PostExtract.offset_start)
    offset_end = graphene.Int(required=True, description=docs.PostExtract.offset_end)
    xpath_start = graphene.String(required=True, description=docs.PostExtract.xpath_start)
    xpath_end = graphene.String(required=True, description=docs.PostExtract.xpath_end)
    body = graphene.String(required=True, description=docs.PostExtract.body)
    lang = graphene.String(required=True, description=docs.PostExtract.lang)
    tags = graphene.List(graphene.String, description=docs.PostExtract.tags)


class PostExtractEntry(graphene.ObjectType, PostExtractEntryFields):
    pass


class PostExtractEntryInput(graphene.InputObjectType, PostExtractEntryFields):
    pass


class CreatePost(graphene.Mutation):
    __doc__ = docs.CreatePost.__doc__

    class Input:
        subject = graphene.String(description=docs.CreatePost.subject)
        body = graphene.String(required=True, description=docs.CreatePost.body)
        idea_id = graphene.ID(required=True, description=docs.CreatePost.idea_id)
        # A Post (except proposals in survey phase) can reply to another post.
        # See related code in views/api/post.py
        parent_id = graphene.ID(description=docs.CreatePost.parent_id)
        attachments = graphene.List(graphene.String, description=docs.CreatePost.attachments)
        message_classifier = graphene.String(description=docs.CreatePost.message_classifier)
        publication_state = PublicationStates(description=docs.CreatePost.publication_state)
        extract_id = graphene.ID(description=docs.CreatePost.extract_id)

    post = graphene.Field(lambda: Post)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        EMBED_ATTACHMENT = models.AttachmentPurpose.EMBED_ATTACHMENT.value
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        discussion = models.Discussion.get(discussion_id)

        idea_id = args.get('idea_id')
        idea_id = int(Node.from_global_id(idea_id)[1])
        in_reply_to_idea = models.Idea.get(idea_id)

        phase = in_reply_to_idea.get_associated_phase()
        if not (phase.start < datetime.now() < phase.end):
            error = _("Sorry, you can no longer submit a post as the phase is now closed.")
            raise HTTPUnauthorized(context.localizer.translate(error))

        if isinstance(in_reply_to_idea, models.Question):
            cls = models.PropositionPost
        else:
            cls = models.AssemblPost

        extract_id = args.get('extract_id')
        if extract_id:
            extract_id_global = int(Node.from_global_id(extract_id)[1])
            extract = models.Extract.get(extract_id_global)
            cls = models.ExtractComment

        in_reply_to_post = None
        if (cls == models.AssemblPost) or (cls == models.ExtractComment):
            in_reply_to_post_id = args.get('parent_id')
            if in_reply_to_post_id:
                in_reply_to_post_id = int(
                    Node.from_global_id(in_reply_to_post_id)[1])
                if in_reply_to_post_id:
                    in_reply_to_post = models.Post.get(in_reply_to_post_id)

        require_cls_permission(CrudPermissions.CREATE, cls, context)

        with cls.default_db.no_autoflush:
            subject = args.get('subject')
            body = args.get('body')
            classifier = args.get('message_classifier', None)
            body = sanitize_html(body)
            body_langstring = models.LangString.create(body)
            publication_state = models.PublicationStates.from_string(args.get('publication_state')) if args.get('publication_state') in models.PublicationStates.values() else models.PublicationStates.PUBLISHED

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
                    original_subject = in_reply_to_post.get_title().first_original()
                    locale = original_subject.locale_code
                    subject = original_subject.value
                elif in_reply_to_idea:
                    # TODO: some ideas have extra langstring titles
                    # we try to guess the locale of the body to use the same locale for post's subject
                    body_lang, data = discussion.translation_service().identify(
                        body_langstring.entries[0].value,
                        discussion.discussion_locales)

                    closest_subject = in_reply_to_idea.title.closest_entry(body_lang)
                    if closest_subject:
                        subject = closest_subject.value
                        locale = closest_subject.locale.code
                    else:
                        # rather no subject than one in a random locale
                        subject = u''
                        locale = discussion.main_locale
                else:
                    subject = discussion.topic if discussion.topic else ''
                    locale = discussion.main_locale

                if subject is not None:
                    if in_reply_to_idea and in_reply_to_idea.message_view_override == u'messageColumns':
                        new_subject = subject
                    else:
                        new_subject = u'Re: ' + restrip_pat.sub('', subject).strip()  # noqa: E501

                    if (in_reply_to_post and new_subject == subject and
                            in_reply_to_post.get_title()):
                        # reuse subject and translations
                        subject_langstring = in_reply_to_post.get_title().clone(discussion.db)
                    else:
                        subject_langstring = models.LangString.create(
                            new_subject, locale)

            if cls == models.ExtractComment:
                new_post = cls(
                    discussion=discussion,
                    subject=subject_langstring,
                    body=body_langstring,
                    creator_id=user_id,
                    body_mime_type=u'text/html',
                    message_classifier=classifier,
                    creation_date=datetime.utcnow(),
                    publication_state=publication_state,
                    parent_extract_id=extract.id
                )
            else:
                new_post = cls(
                    discussion=discussion,
                    subject=subject_langstring,
                    body=body_langstring,
                    creator_id=user_id,
                    body_mime_type=u'text/html',
                    message_classifier=classifier,
                    creation_date=datetime.utcnow(),
                    publication_state=publication_state
                )

            new_post.guess_languages()
            db = new_post.db
            db.add(new_post)
            db.flush()

            if in_reply_to_post:
                new_post.set_parent(in_reply_to_post)
            elif in_reply_to_idea and cls != models.ExtractComment:
                # don't create IdeaRelatedPostLink when we have both
                # in_reply_to_post and in_reply_to_idea or if it's a comment
                # for an extract
                idea_post_link = models.IdeaRelatedPostLink(
                    creator_id=user_id,
                    content=new_post,
                    idea=in_reply_to_idea
                )
                db.add(idea_post_link)
            db.flush()

            attachments = args.get('attachments', [])
            for document_id in attachments:
                document = models.Document.get(document_id)
                models.PostAttachment(
                    document=document,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    post=new_post,
                    title=document.title,
                    attachmentPurpose=EMBED_ATTACHMENT
                )

            db.flush()

        return CreatePost(post=new_post)


class UpdateShareCount(graphene.Mutation):
    __doc__ = docs.UpdateShareCount.__doc__

    class Input:
        node_id = graphene.ID(required=True, description=docs.UpdateShareCount.node_id)

    node = graphene.Field(lambda: Node)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        node_type, node_id = Node.from_global_id(args.get('node_id'))
        node_id = int(node_id)
        node = None
        if node_type == 'Post':
            node = models.Post.get(node_id)
        elif node_type == 'Idea':
            node = models.Idea.get(node_id)
        if node:
            node.increment_share_count()
        return UpdateShareCount(node=node)


class UpdatePost(graphene.Mutation):
    __doc__ = docs.UpdatePost.__doc__

    class Input:
        post_id = graphene.ID(required=True, description=docs.UpdatePost.post_id)
        subject = graphene.String(description=docs.UpdatePost.subject)
        body = graphene.String(required=True, description=docs.UpdatePost.body)
        attachments = graphene.List(graphene.String, description=docs.UpdatePost.attachments)
        publication_state = PublicationStates(description=docs.UpdatePost.publication_state)

    post = graphene.Field(lambda: Post)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        EMBED_ATTACHMENT = models.AttachmentPurpose.EMBED_ATTACHMENT.value
        user_id = context.authenticated_userid or Everyone
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        cls = models.Post

        permissions = get_permissions(user_id, discussion_id)
        allowed = post.user_can(user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()
        if (post.publication_state == models.PublicationStates.PUBLISHED and
                P_MODERATE not in permissions and
                discussion.preferences['with_moderation']):
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
                        attachmentPurpose=EMBED_ATTACHMENT
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
                    document.delete_file()
                    post.db.delete(document)
                    post.attachments.remove(post_attachment)
                    post.db.flush()

        publication_state = models.PublicationStates.from_string(args.get('publication_state')) if args.get('publication_state') in models.PublicationStates.values() else None
        if publication_state and publication_state != post.publication_state:
            post.publication_state = publication_state
            changed = True
            # Update the creation date when switching from draft to published
            if post.publication_state == models.PublicationStates.DRAFT and publication_state == models.PublicationStates.PUBLISHED:
                post.creation_date = datetime.utcnow()

        if changed:
            post.modification_date = datetime.utcnow()
            post.body_mime_type = u'text/html'
            post.db.flush()
            post.db.expire(post.subject, ["entries"])
            post.db.expire(post.body, ["entries"])

        return UpdatePost(post=post)


class ValidatePost(graphene.Mutation):

    __doc__ = docs.ValidatePost.__doc__

    class Input:
        post_id = graphene.ID(required=True, description=docs.ValidatePost.post_id)

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
        allowed = P_MODERATE in permissions
        if not allowed:
            raise HTTPUnauthorized()

        post.publication_state = models.PublicationStates.PUBLISHED
        post.db.flush()
        return ValidatePost(post=post)


class DeletePost(graphene.Mutation):
    __doc__ = docs.DeletePost.__doc__

    class Input:
        post_id = graphene.ID(required=True, description=docs.DeletePost.post_id)

    post = graphene.Field(lambda: Post)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        user_id = context.authenticated_userid or Everyone
        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        discussion_id = context.matchdict['discussion_id']
        permissions = get_permissions(user_id, discussion_id)

        require_instance_permission(CrudPermissions.DELETE, post, context)

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


class AddPostExtract(graphene.Mutation):
    __doc__ = docs.AddPostExtract.__doc__

    class Input:
        post_id = graphene.ID(required=True, description=docs.AddPostExtract.post_id)
        body = graphene.String(required=True, description=docs.AddPostExtract.body)
        important = graphene.Boolean(description=docs.AddPostExtract.important)
        lang = graphene.String(required=True, description=docs.AddPostExtract.lang)
        xpath_start = graphene.String(required=True, description=docs.AddPostExtract.xpath_start)
        xpath_end = graphene.String(required=True, description=docs.AddPostExtract.xpath_end)
        offset_start = graphene.Int(required=True, description=docs.AddPostExtract.offset_start)
        offset_end = graphene.Int(required=True, description=docs.AddPostExtract.offset_end)
        tags = graphene.List(graphene.String, description=docs.AddPostExtract.tags)
        is_extract = graphene.Boolean(graphene.Boolean, description=docs.AddPostExtract.is_extract)

    post = graphene.Field(lambda: Post)
    extract = graphene.Field(lambda: Extract)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone
        is_extract = args.get('is_extract')

        if is_extract:
            require_specific_permission(P_ADD_SIDE_COMMENT, context)

        post_id = args.get('post_id')
        post_id = int(Node.from_global_id(post_id)[1])
        post = models.Post.get(post_id)
        extract_hash = models.Extract.get_extract_hash(
            args.get('lang'),
            args.get('xpath_start'),
            args.get('xpath_end'),
            args.get('offset_start'),
            args.get('offset_end'),
            post_id
        )
        db = post.db
        exist = db.query(exists().where(models.Extract.extract_hash == extract_hash)).scalar()
        if exist:
            raise Exception("Extract already exists!")

        new_extract = models.Extract(
            creator_id=user_id,
            owner_id=user_id,
            discussion_id=discussion_id,
            body=args.get('body'),
            important=args.get('important', False),
            content=post,
            extract_hash=extract_hash
        )
        new_extract.lang = args.get('lang')
        tags = models.Keyword.get_tags(args.get('tags', []), discussion_id, db)
        new_extract.tags = tags['new_tags'] + tags['tags']
        db.add(new_extract)
        range = models.TextFragmentIdentifier(
            extract=new_extract,
            xpath_start=args.get('xpath_start'),
            offset_start=args.get('offset_start'),
            xpath_end=args.get('xpath_end'),
            offset_end=args.get('offset_end'))
        db.add(range)
        db.flush()

        return AddPostExtract(post=post, extract=new_extract)


# Used by the Bigdatext app
class AddPostsExtract(graphene.Mutation):
    class Input:
        extracts = graphene.List(
            PostExtractEntryInput, required=True, description=docs.AddPostsExtract.extracts)
        extract_nature = ExtractNatures(description=docs.AddPostsExtract.extract_nature)
        extract_state = ExtractStates(description=docs.AddPostsExtract.extract_state)

    status = graphene.Boolean(description=docs.AddPostsExtract.status)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        status = False
        require_cls_permission(CrudPermissions.CREATE, models.Extract, context)
        discussion_id = context.matchdict['discussion_id']
        # Retrieve the user id
        user_id = context.authenticated_userid or Everyone
        extracts = args.get('extracts')
        status = True
        extract_nature = args.get('extract_nature', None)
        extract_nature = models.ExtractNatureVocabulary.Enum(extract_nature) if extract_nature else None
        extract_state = args.get('extract_state', None)
        # Add all of extracts
        for extract in extracts:
            post_id = extract.get('post_id')
            post_id = int(Node.from_global_id(post_id)[1])
            post = models.Post.get(post_id) if post_id else None
            if not post:
                continue

            db = post.db
            extract_hash = models.Extract.get_extract_hash(
                extract.get('lang'),
                extract.get('xpath_start'),
                extract.get('xpath_end'),
                extract.get('offset_start'),
                extract.get('offset_end'),
                post_id)
            exist = db.query(exists().where(models.Extract.extract_hash == extract_hash)).scalar()
            if not exist:
                new_extract = models.Extract(
                    creator_id=user_id,
                    owner_id=user_id,
                    discussion_id=discussion_id,
                    body=extract.get('body'),
                    important=extract.get('important', False),
                    content=post,
                    extract_nature=extract_nature,
                    extract_state=extract_state,
                    extract_hash=extract_hash
                )
                new_extract.lang = extract.get('lang')
                db.add(new_extract)
                range = models.TextFragmentIdentifier(
                    extract=new_extract,
                    xpath_start=extract.get('xpath_start'),
                    offset_start=extract.get('offset_start'),
                    xpath_end=extract.get('xpath_end'),
                    offset_end=extract.get('offset_end'))
                db.add(range)
                db.flush()

        return AddPostsExtract(status=status)
