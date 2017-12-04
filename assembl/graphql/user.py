import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.security import Everyone

from assembl import models
from assembl.auth import CrudPermissions
from assembl.auth.util import get_permissions

from .types import SecureObjectType
from .utils import abort_transaction_on_exception


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
        # TODO check security
        return self.get_preferred_email()


class UpdateUser(graphene.Mutation):
    class Input:
        id = graphene.ID(required=True)
        name = graphene.String(required=True)
        username = graphene.String()

    user = graphene.Field(lambda: AgentProfile)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.User
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid or Everyone

        global_id = args.get('id')
        id_ = int(Node.from_global_id(global_id)[1])
        user = cls.get(id_)

        permissions = get_permissions(user_id, discussion_id)
        allowed = user.user_can(
            user_id, CrudPermissions.UPDATE, permissions)
        if not allowed:
            raise HTTPUnauthorized()

        with cls.default_db.no_autoflush as db:
            user.username_p = args.get('username')
            user.real_name_p = args.get('name')
            db.flush()

        return UpdateUser(user=user)
