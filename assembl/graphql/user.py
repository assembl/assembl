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
from assembl.auth.password import random_string
from datetime import datetime
from .permissions_helpers import require_cls_permission


_ = TranslationStringFactory('assembl')


class AgentProfile(SecureObjectType, SQLAlchemyObjectType):

    class Meta:
        model = models.AgentProfile
        interfaces = (Node, )
        only_fields = ('id',)

    user_id = graphene.Int(required=True)
    name = graphene.String()
    username = graphene.String()
    display_name = graphene.String()
    email = graphene.String()
    image = graphene.Field(Document)
    creation_date = DateTime()  # creation_date only exists on User, not AgentProfile
    has_password = graphene.Boolean()
    is_deleted = graphene.Boolean()

    def resolve_is_deleted(self, args, context, info):
        return self.is_deleted or False

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

    def resolve_has_password(self, args, context, info):
        return self.password is not None


class UpdateUser(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)
        name = graphene.String()
        username = graphene.String()
        # this is the identifier of the part in a multipart POST
        image = graphene.String()
        old_password = graphene.String()
        new_password = graphene.String()
        new_password2 = graphene.String()

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
                    raise Exception(u"001: We already have a user with this username.")

            user.username_p = username
            name = args.get('name')
            # only modify the name if it was given in parameter
            if name is not None:
                user.real_name_p = name

            old_password = args.get('old_password')
            new_password = args.get('new_password')
            new_password2 = args.get('new_password2')
            # only modify the password if it was given in parameter
            if old_password is not None and new_password is not None and new_password2 is not None:
                if not user.check_password(old_password):
                    raise Exception(u"002: The entered password doesn't match your current password.")

                if new_password != new_password2:
                    raise Exception(u"003: You entered two different passwords.")

                if old_password == new_password:
                    raise Exception(u"004: The new password has to be different than the current password.")

                from ..auth.password import verify_password
                for p in user.old_passwords:
                    if verify_password(new_password, p.password):
                        raise Exception(u"005: The new password has to be different than the last 5 passwords you set.")

                user.password_p = new_password

            # add uploaded image as an attachment to the user
            image = args.get('image')
            if image is not None:
                filename = os.path.basename(context.POST[image].filename)
                mime_type = context.POST[image].type
                document = models.File(
                    discussion=discussion,
                    mime_type=mime_type,
                    title=filename)
                document.add_file_data(context.POST[image].file)
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

                    image.document.delete_file()
                    db.delete(image.document)
                    user.profile_attachments.remove(image)

                allowed = models.AgentProfileAttachment.user_can_cls(
                    user_id, CrudPermissions.CREATE, permissions)
                if not allowed:
                    raise HTTPUnauthorized("The authenticated user can't create an AgentProfileAttachment")

                discussion.db.add(models.AgentProfileAttachment(
                    document=document,
                    discussion=discussion,
                    user=user,
                    creator_id=context.authenticated_userid,
                    title=filename,
                    attachmentPurpose=PROFILE_PICTURE
                ))

            db.flush()

        return UpdateUser(user=user)


class DeleteUserInformation(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)

    user = graphene.Field(lambda: AgentProfile)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.User
        db = cls.default_db
        global_id = args.get('id')
        id_ = int(Node.from_global_id(global_id)[1])
        user = cls.get(id_)
        require_cls_permission(CrudPermissions.READ, cls, context)
        from assembl import models as m
        user_roles = db.query(m.UserRole).filter(m.UserRole.user_id == user.id).all()

        for ur in user_roles:
            if ur.role.name == u"r:sysadmin":
                raise Exception(u"Can't delete a user with sysadmin rights.")

        ids_of_admin_users = db.query(m.User.id).join(m.LocalUserRole).join(
            m.Role).filter(m.Role.name == "r:administrator").all()

        ids_of_admin_users = [id for (id,) in ids_of_admin_users]
        number_of_not_deleted_admin_users = db.query(m.User).filter(m.User.id.in_(ids_of_admin_users)).filter(m.User.is_deleted != True).count()  # noqa: F712

        local_user_roles = db.query(m.LocalUserRole).filter(m.LocalUserRole.user_id == user.id).all()
        user_is_admin = False
        for lur in local_user_roles:
            if lur.role.name == u'r:administrator':
                user_is_admin = True

        if int(number_of_not_deleted_admin_users) <= 1 and user_is_admin:
            raise Exception(u"User can't delete his account because this is the only admin account")

        with cls.default_db.no_autoflush as db:
            user.is_deleted = True
            user.password_p = random_string()
            user.preferred_email = random_string() + "@" + random_string()
            user.last_assembl_login = datetime(1900, 1, 1, 1, 1, 1, 1)
            user.last_login = datetime(1900, 1, 1, 1, 1, 1, 1)
            user.real_name_p = random_string()
            for p in user.old_passwords:
                p.password_p = ""

            # Deleting Username
            username = db.query(m.Username).filter(m.Username.user_id == user.id).first()
            if username:
                db.delete(username)
            # Delete Email Accounts
            email_account_ids = db.query(m.EmailAccount.id).join(m.User).filter(m.User.id == user.id).all()
            email_account_ids = [id for (id,) in email_account_ids]
            email_accounts = db.query(m.EmailAccount).filter(m.EmailAccount.id.in_(email_account_ids)).all()
            if email_accounts:
                for email_account in email_accounts[:]:
                    db.delete(email_account)

            # Notifications
            # First, we will make sure that the user has no notification with status
            # If there are, we will put them in the state obsoleted
            # Then the notification state will be unsubscribed by user
            ids = db.query(models.Notification.id).join(models.NotificationSubscription).filter(models.NotificationSubscription.user_id ==
                                                                                                user.id, models.Notification.delivery_state == models.NotificationDeliveryStateType.getRetryableDeliveryStates()).all()

            ids = [id for (id,) in ids]
            db.query(models.Notification).filter(models.Notification.id.in_(ids)).update(
                {models.Notification.delivery_state: models.NotificationDeliveryStateType.OBSOLETED}, synchronize_session=False)

            # Social Accounts
            if user.social_accounts:
                for social_account in user.social_accounts[:]:
                    db.delete(social_account)
                    user.social_accounts.remove(social_account)

            # Remove extra fields
            extra_fields = db.query(m.ProfileField).filter(m.ProfileField.agent_profile_id == user.id).all()
            for extra_field in extra_fields:
                db.delete(extra_field)

            db.flush()
        return DeleteUserInformation(user=user)
