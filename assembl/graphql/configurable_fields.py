import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType
from pyramid.i18n import TranslationStringFactory

from assembl import models
from assembl.auth import CrudPermissions
from .langstring import LangStringEntry, LangStringEntryInput, resolve_langstring, resolve_langstring_entries, langstring_from_input_entries, update_langstring_from_input_entries
from .permissions_helpers import require_cls_permission, require_instance_permission
from .types import SecureObjectType
from .user import AgentProfile
from .utils import abort_transaction_on_exception


_ = TranslationStringFactory('assembl')


class TextField(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.TextField
        interfaces = (Node, )
        only_fields = ('field_type', 'id', 'order', 'required')

    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')


class CreateTextField(graphene.Mutation):
    class Input:
        lang = graphene.String()
        title_entries = graphene.List(LangStringEntryInput, required=True)
        order = graphene.Float()
        required = graphene.Boolean()

    text_field = graphene.Field(lambda: TextField)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.TextField
        require_cls_permission(CrudPermissions.CREATE, cls, context)
        discussion_id = context.matchdict['discussion_id']
        with cls.default_db.no_autoflush as db:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception(
                    'TextField titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            title_langstring = langstring_from_input_entries(title_entries)

            saobj = cls(
                discussion_id=discussion_id,
                title=title_langstring,
                order=args.get('order'),
                required=args.get('required'))
            db.add(saobj)
            db.flush()

        return CreateTextField(text_field=saobj)


class UpdateTextField(graphene.Mutation):
    class Input:
        id = graphene.ID(required=True)
        lang = graphene.String(required=True)
        title_entries = graphene.List(LangStringEntryInput, required=True)
        order = graphene.Float(required=True)
        required = graphene.Boolean(required=True)

    text_field = graphene.Field(lambda: TextField)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.TextField
        text_field_id = args.get('id')
        text_field_id = int(Node.from_global_id(text_field_id)[1])
        text_field = cls.get(text_field_id)
        require_instance_permission(CrudPermissions.UPDATE, text_field, context)
        with cls.default_db.no_autoflush as db:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception(
                    'TextField titleEntries needs at least one entry')
                # Better to have this message than
                # 'NoneType' object has no attribute 'owner_object'
                # when creating the saobj below if title=None

            update_langstring_from_input_entries(text_field, 'title', title_entries)
            text_field.order = args['order']
            text_field.required = args['required']
            db.flush()

        return UpdateTextField(text_field=text_field)


class DeleteTextField(graphene.Mutation):

    class Input:
        id = graphene.ID(required=True)

    success = graphene.Boolean()

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.TextField
        text_field_id = args.get('id')
        text_field_id = int(Node.from_global_id(text_field_id)[1])
        text_field = models.TextField.get(text_field_id)
        require_instance_permission(CrudPermissions.DELETE, text_field, context)
        with cls.default_db.no_autoflush as db:
            db.query(models.ProfileTextField).filter(
                models.ProfileTextField.text_field_id == text_field_id).delete()
            db.flush()
            db.delete(text_field)
            db.flush()

        return DeleteTextField(success=True)


class ProfileField(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.ProfileTextField
        interfaces = (Node, )
        only_fields = ('id', 'value')

    agent_profile = graphene.Field(lambda: AgentProfile)
    text_field = graphene.Field(lambda: TextField)

    def resolve_id(self, args, context, info):
        if self.id < 0:
            # this is a temporary object we created manually in resolve_profile_fields
            return self.id
        else:
            # this is a SQLAlchemy object
            # we can't use super here, so we just copy/paste resolve_id method from SQLAlchemyObjectType class
            from graphene.relay import is_node
            graphene_type = info.parent_type.graphene_type
            if is_node(graphene_type):
                return self.__mapper__.primary_key_from_instance(self)[0]
            return getattr(self, graphene_type._meta.id, None)
