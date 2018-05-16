import graphene
from graphene.relay import Node
from graphene.types.generic import GenericScalar
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.utils import get_query
from pyramid.i18n import TranslationStringFactory

from assembl import models
from assembl.models.configurable_fields import ConfigurableFieldIdentifiersEnum
from assembl.auth import CrudPermissions
from .langstring import LangStringEntry, LangStringEntryInput, resolve_langstring, resolve_langstring_entries, langstring_from_input_entries, update_langstring_from_input_entries
from .permissions_helpers import require_cls_permission, require_instance_permission
from .types import SecureObjectType, SQLAlchemyUnion
from .user import AgentProfile
from .utils import abort_transaction_on_exception


_ = TranslationStringFactory('assembl')


class ConfigurableFieldInterface(graphene.Interface):

    identifier = graphene.String()
    order = graphene.Float()
    required = graphene.Boolean()
    title = graphene.String(lang=graphene.String())
    title_entries = graphene.List(LangStringEntry)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')


class TextField(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.TextField
        interfaces = (Node, ConfigurableFieldInterface)
        only_fields = ('field_type', 'id')


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
            db.query(models.ProfileField).filter(
                models.ProfileField.configurable_field_id == text_field_id).delete()
            db.flush()
            db.delete(text_field)
            db.flush()

        return DeleteTextField(success=True)


class ConfigurableFieldUnion(SQLAlchemyUnion):
    class Meta:
        types = (TextField, )
        model = models.AbstractConfigurableField

    @classmethod
    def resolve_type(cls, instance, context, info):
        if isinstance(instance, graphene.ObjectType):
            return type(instance)
        elif isinstance(instance, models.TextField):
            return TextField


class ProfileField(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.ProfileField
        interfaces = (Node, )
        only_fields = ('id', )

    agent_profile = graphene.Field(lambda: AgentProfile)
    configurable_field = graphene.Field(lambda: ConfigurableFieldUnion, required=True)
    value_data = GenericScalar()

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

    def resolve_value_data(self, args, context, info):
        return getattr(self, 'value_data', {u'value': None})


class FieldData(graphene.AbstractType):
    configurable_field_id = graphene.ID(required=True)
    id = graphene.ID(required=True)
    value_data = GenericScalar(required=True)


class FieldDataInput(graphene.InputObjectType, FieldData):
    pass


class UpdateProfileFields(graphene.Mutation):
    class Input:
        data = graphene.List(FieldDataInput, required=True)
        lang = graphene.String(required=True)

    profile_fields = graphene.List(ProfileField)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.ProfileField
        discussion_id = context.matchdict['discussion_id']
        user_id = context.authenticated_userid
        agent_profile = models.AgentProfile.get(user_id)
        require_instance_permission(CrudPermissions.UPDATE, agent_profile, context)
        with cls.default_db.no_autoflush as db:
            for field_info in args.get('data'):
                profile_field_id = field_info['id']
                profile_field_id = int(Node.from_global_id(profile_field_id)[1])
                profile_field = cls.get(profile_field_id)
                if profile_field:
                    require_instance_permission(CrudPermissions.UPDATE, profile_field, context)
                    profile_field.value_data = field_info['value_data']
                else:
                    configurable_field_id = field_info['configurable_field_id']
                    configurable_field_id = int(Node.from_global_id(configurable_field_id)[1])
                    configurable_field = models.AbstractConfigurableField.get(configurable_field_id)
                    if configurable_field.identifier == ConfigurableFieldIdentifiersEnum.FULLNAME.value:
                        agent_profile.real_name_p = field_info['value_data']['value']
                    elif configurable_field.identifier == ConfigurableFieldIdentifiersEnum.EMAIL.value:
                        agent_profile.preferred_email = field_info['value_data']['value']
                    elif configurable_field.identifier == ConfigurableFieldIdentifiersEnum.USERNAME.value:
                        agent_profile.username_p = field_info['value_data']['value']
                    elif configurable_field.identifier == ConfigurableFieldIdentifiersEnum.CUSTOM.value:
                        require_cls_permission(CrudPermissions.CREATE, cls, context)
                        profile_field = cls(
                            agent_profile=agent_profile,
                            configurable_field_id=configurable_field_id,
                            discussion_id=discussion_id,
                            value_data=field_info['value_data']
                        )
                        db.add(profile_field)

            db.flush()

        profile_fields = get_query(cls, context).filter(cls.discussion_id == discussion_id)
        return UpdateProfileFields(profile_fields=profile_fields)
