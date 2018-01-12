import os

import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.i18n import TranslationStringFactory

from assembl import models
from assembl.auth import CrudPermissions
from assembl.auth import Everyone, P_SYSADMIN, P_ADMIN_DISC
from assembl.auth.util import get_permissions

from .document import Document
from .types import SecureObjectType
from .utils import DateTime, abort_transaction_on_exception


_ = TranslationStringFactory('assembl')


class AgentProfile(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.AgentProfile
        interfaces = (Node, )
        only_fields = ('id', )

    user_id = graphene.Int(required=True)
    name = graphene.String()
    username = graphene.String()
    display_name = graphene.String()
    email = graphene.String()
    image = graphene.Field(Document)
    creation_date = DateTime()  # creation_date only exists on User, not AgentProfile

    def resolve_user_id(self, args, context, info):
        return self.id

    def resolve_name(self, args, context, info):
        return self.real_name()

    def resolve_username(self, args, context, info):
        if self.username:
            return self.username.username

    def resolve_display_name(self, args, context, info):
        return self.display_name()

    def resolve_email(self, args, context, info):
        user_id = context.authenticated_userid or Everyone
        discussion_id = context.matchdict['discussion_id']
        permissions = get_permissions(user_id, discussion_id)
        include_emails = P_ADMIN_DISC in permissions or P_SYSADMIN in permissions
        if include_emails or self.id == user_id:
            return self.get_preferred_email()

    def resolve_image(self, args, context, info):
        PROFILE_PICTURE = models.AttachmentPurpose.PROFILE_PICTURE.value
        for attachment in self.profile_attachments:
            if attachment.attachmentPurpose == PROFILE_PICTURE:
                return attachment.document


class UpdateUser(graphene.Mutation):
    class Input:
        id = graphene.ID(required=True)
        name = graphene.String()
        username = graphene.String()
        # this is the identifier of the part in a multipart POST
        image = graphene.String()
        password = graphene.String()

    user = graphene.Field(lambda: AgentProfile)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        PROFILE_PICTURE = models.AttachmentPurpose.PROFILE_PICTURE.value
        cls = models.User
        discussion_id = context.matchdict['discussion_id']
        discussion = models.Discussion.get(discussion_id)
        user_id = context.authenticated_userid or Everyone

        global_id = args.get('id')
        id_ = int(Node.from_global_id(global_id)[1])
        user = cls.get(id_)

        permissions = get_permissions(user_id, discussion_id)
        allowed = user.user_can(
            user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized("The authenticated user can't update this user")

        with cls.default_db.no_autoflush as db:
            username = args.get('username')
            if username and username != user.username_p:
                if db.query(models.Username).filter_by(
                    username=username
                ).count():
                    msg = context.localizer.translate(_(
                        "We already have a user with this username."))
                    raise Exception(msg)

            user.username_p = username
            name = args.get('name')
            # only modify the name if it was given in parameter
            if name is not None:
                user.real_name_p = name

            password = args.get('password')
            # only modify the password if it was given in parameter
            if password is not None:
                user.password_p = password

            # add uploaded image as an attachment to the user
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
                # if there is already an PROFILE_PICTURE, remove it with the
                # associated document
                images = [
                    att for att in user.profile_attachments
                    if att.attachmentPurpose == PROFILE_PICTURE]
                if images:
                    image = images[0]
                    allowed = image.user_can(
                        user_id, CrudPermissions.DELETE, permissions)
                    if not allowed:
                        raise HTTPUnauthorized("The authenticated user can't delete the existing AgentProfileAttachment")

                    db.delete(image.document)
                    user.profile_attachments.remove(image)

                allowed = models.AgentProfileAttachment.user_can_cls(
                    user_id, CrudPermissions.CREATE, permissions)
                if not allowed:
                    raise HTTPUnauthorized("The authenticated user can't create an AgentProfileAttachment")

                models.AgentProfileAttachment(
                    document=document,
                    discussion=discussion,
                    user=user,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose=PROFILE_PICTURE
                )

            db.flush()

        return UpdateUser(user=user)
