import os.path

import graphene
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone

from assembl import models
from assembl.auth import IF_OWNED, CrudPermissions
from assembl.auth.util import get_permissions

from .document import Document
from .langstring import (
    LangStringEntry, LangStringEntryInput, resolve_langstring,
    resolve_langstring_entries, update_langstring_from_input_entries)
from .utils import abort_transaction_on_exception


class LocalePreference(graphene.ObjectType):
    locale = graphene.String()
    name = graphene.String(in_locale=graphene.String(required=True))
    native_name = graphene.String()

    def resolve_name(self, args, context, info):
        in_locale = args.get('in_locale') or None
        locale_model = models.Locale.get_or_create(in_locale)

        name = models.LocaleLabel.names_of_locales_in_locale([self.locale],
                                                             locale_model)
        if not name:
            # If the locale label does not exist, fallback on English
            locale_model = models.Locale.get_or_create('en')
            name = models.LocaleLabel.names_of_locales_in_locale([self.locale],
                                                                 locale_model)

        return name[self.locale]

    def resolve_native_name(self, args, context, info):
        locale = self.locale
        if locale == 'zh_Hans':  # we have the native name only for zh
            locale = 'zh'

        locale_model = models.Locale.get_or_create(locale)
        name = models.LocaleLabel.names_of_locales_in_locale([locale],
                                                             locale_model)
        if not name:
            # If the locale label does not exist, fallback on English
            locale_model = models.Locale.get_or_create('en')
            name = models.LocaleLabel.names_of_locales_in_locale([locale],
                                                                 locale_model)

        return name[locale]


class DiscussionPreferences(graphene.ObjectType):
    languages = graphene.List(LocalePreference)


class ResourcesCenter(graphene.ObjectType):

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)
    header_image = graphene.Field(Document)

    def resolve_title(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        return resolve_langstring(
            discussion.resources_center_title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        return resolve_langstring_entries(discussion, 'resources_center_title')

    def resolve_header_image(self, args, context, info):
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        for attachment in discussion.attachments:
            if attachment.attachmentPurpose == 'RESOURCES_CENTER_HEADER_IMAGE':
                return attachment.document


class UpdateResourcesCenter(graphene.Mutation):
    class Input:
        title_entries = graphene.List(LangStringEntryInput)
        header_image = graphene.String()

    resources_center = graphene.Field(lambda: ResourcesCenter)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Discussion
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        permissions = get_permissions(user_id, discussion_id)
        allowed = discussion.user_can(
            user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush:
            db = discussion.db
            title_entries = args.get('title_entries')
            if title_entries is not None and len(title_entries) == 0:
                raise Exception(
                    'Resources center title entries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            update_langstring_from_input_entries(
                discussion, 'resources_center_title', title_entries)

            # add uploaded image as an attachment to the discussion
            image = args.get('header_image')
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

                # if there is already an IMAGE, remove it with the
                # associated document
                header_images = [
                    att for att in discussion.attachments
                    if att.attachmentPurpose == 'RESOURCES_CENTER_HEADER_IMAGE'
                ]
                if header_images:
                    header_image = header_images[0]
                    db.delete(header_image.document)
                    discussion.attachments.remove(header_image)

                models.DiscussionAttachment(
                    document=document,
                    discussion=discussion,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose="RESOURCES_CENTER_HEADER_IMAGE"
                )

        db.flush()
        resources_center = ResourcesCenter()
        return UpdateResourcesCenter(resources_center=resources_center)


class UpdateDiscussionPreferences(graphene.Mutation):
    class Input:
        languages = graphene.List(graphene.String, required=True)

    preferences = graphene.Field(lambda: DiscussionPreferences)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.Preferences
        discussion_id = context.matchdict['discussion_id']

        user_id = context.authenticated_userid or Everyone
        discussion = models.Discussion.get(discussion_id)

        permissions = get_permissions(user_id, discussion_id)
        allowed = cls.user_can_cls(
            user_id, CrudPermissions.UPDATE, permissions)
        if not allowed or (allowed == IF_OWNED and user_id == Everyone):
            raise HTTPUnauthorized()
        prefs_to_save = args.get('languages')
        if not prefs_to_save:
            raise Exception("Must pass at least one preference to be saved")

        discussion.discussion_locales = prefs_to_save
        discussion.db.flush()

        discussion_pref = DiscussionPreferences(
            languages=[LocalePreference(locale=x) for
                       x in discussion.discussion_locales])
        return UpdateDiscussionPreferences(preferences=discussion_pref)
