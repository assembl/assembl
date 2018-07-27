import graphene
from graphene.relay import Node
from graphene.types.generic import GenericScalar
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.utils import get_query
from pyramid.i18n import TranslationStringFactory

import assembl.graphql.docstrings as docs
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
    __doc__ = docs.ConfigurableFieldInterface.__doc__

    identifier = graphene.String(description=docs.ConfigurableFieldInterface.identifier)
    order = graphene.Float(description=docs.ConfigurableFieldInterface.order)
    required = graphene.Boolean(description=docs.ConfigurableFieldInterface.required)
    title = graphene.String(lang=graphene.String(description=docs.Default.required_language_input), description=docs.ConfigurableFieldInterface.title)
    title_entries = graphene.List(LangStringEntry, description=docs.ConfigurableFieldInterface.title_entries)
    hidden = graphene.Boolean(required=True, description=docs.ConfigurableFieldInterface.hidden)

    def resolve_title(self, args, context, info):
        return resolve_langstring(self.title, args.get('lang'))

    def resolve_title_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'title')


class TextField(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.TextField.__doc__

    class Meta:
        model = models.TextField
        interfaces = (Node, ConfigurableFieldInterface)
        only_fields = ('field_type', 'id')


class SelectFieldOption(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.SelectFieldOption.__doc__

    class Meta:
        model = models.SelectFieldOption
        interfaces = (Node,)
        only_fields = ('id', 'order')

    label = graphene.String(lang=graphene.String(description=docs.Default.required_language_input), description=docs.SelectFieldOption.label)
    label_entries = graphene.List(LangStringEntry, description=docs.SelectFieldOption.label_entries)

    def resolve_label(self, args, context, info):
        return resolve_langstring(self.label, args.get('lang'))

    def resolve_label_entries(self, args, context, info):
        return resolve_langstring_entries(self, 'label')


class SelectFieldOptionInput(graphene.InputObjectType):
    id = graphene.ID(description=docs.SelectFieldOptionInput.id)
    label_entries = graphene.List(LangStringEntryInput, required=True, description=docs.SelectFieldOptionInput.label_entries)
    order = graphene.Float(required=True, description=docs.SelectFieldOptionInput.order)


class SelectField(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.SelectField.__doc__

    class Meta:
        model = models.SelectField
        interfaces = (Node, ConfigurableFieldInterface)
        only_fields = ('id', 'multivalued')

    options = graphene.List(SelectFieldOption)


class CreateTextField(graphene.Mutation):
    __doc__ = docs.CreateTextField.__doc__

    class Input:
        lang = graphene.String(description=docs.CreateTextField.lang)
        title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.CreateTextField.title_entries)
        order = graphene.Float(description=docs.CreateTextField.order)
        required = graphene.Boolean(description=docs.CreateTextField.required)
        hidden = graphene.Boolean(description=docs.CreateTextField.required)
        options = graphene.List(SelectFieldOptionInput, required=False, description=docs.CreateTextField.options)

    field = graphene.Field(lambda: ConfigurableFieldUnion)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        options = args.get('options')
        if options is not None:
            cls = models.SelectField
        else:
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

            if options is not None:
                for option in options:
                    label_ls = langstring_from_input_entries(
                        option['label_entries'])
                    order = option['order']
                    saobj.options.append(
                        models.SelectFieldOption(
                            label=label_ls, order=order)
                    )

            db.add(saobj)
            db.flush()

        return CreateTextField(field=saobj)


class UpdateTextField(graphene.Mutation):
    __doc__ = docs.UpdateTextField.__doc__

    class Input:
        id = graphene.ID(required=True, description=docs.UpdateTextField.id)
        lang = graphene.String(required=True, description=docs.UpdateTextField.lang)
        title_entries = graphene.List(LangStringEntryInput, required=True, description=docs.UpdateTextField.title_entries)
        order = graphene.Float(required=True, description=docs.UpdateTextField.order)
        required = graphene.Boolean(required=True, description=docs.UpdateTextField.required)
        hidden = graphene.Boolean(required=True, description=docs.UpdateTextField.hidden)
        options = graphene.List(SelectFieldOptionInput, required=False, description=docs.UpdateTextField.options)

    field = graphene.Field(lambda: ConfigurableFieldUnion)

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        options = args.get('options')
        if options is not None:
            cls = models.SelectField
        else:
            cls = models.TextField

        field_id = args.get('id')
        field_id = int(Node.from_global_id(field_id)[1])
        field = cls.get(field_id)
        require_instance_permission(CrudPermissions.UPDATE, field, context)
        with cls.default_db.no_autoflush as db:
            title_entries = args.get('title_entries')
            if len(title_entries) == 0:
                raise Exception(
                    'field titleEntries needs at least one entry')

            update_langstring_from_input_entries(field, 'title', title_entries)
            field.order = args['order']
            field.required = args['required']
            field.hidden = args['hidden']

            if options is not None:
                existing_options = {
                    option.id: option for option in field.options}
                updated_options = set()
                for option_input in options:
                    if not option_input.get('id', '-1').startswith('-'):
                        # update the option
                        id_ = int(Node.from_global_id(option_input['id'])[1])
                        updated_options.add(id_)
                        option = models.SelectFieldOption.get(id_)
                        update_langstring_from_input_entries(
                            option, 'label', option_input['label_entries'])
                        option.order = option_input['order']
                    else:
                        # create the option
                        label_ls = langstring_from_input_entries(
                            option_input.get('label_entries', None))
                        order = option_input.get('order')
                        field.options.append(
                            models.SelectFieldOption(
                                label=label_ls, order=order)
                        )

                # remove options that are not in options input
                for option_id in set(existing_options.keys()
                                       ).difference(updated_options):
                    db.delete(existing_options[option_id])

            db.flush()

        return UpdateTextField(field=field)


class DeleteTextField(graphene.Mutation):
    __doc__ = docs.DeleteTextField.__doc__

    class Input:
        id = graphene.ID(required=True, description=docs.DeleteTextField.id)

    success = graphene.Boolean()

    @staticmethod
    @abort_transaction_on_exception
    def mutate(root, args, context, info):
        cls = models.AbstractConfigurableField
        field_id = args.get('id')
        field_id = int(Node.from_global_id(field_id)[1])
        field = cls.get(field_id)
        require_instance_permission(CrudPermissions.DELETE, field, context)
        with cls.default_db.no_autoflush as db:
            db.query(models.ProfileField).filter(
                models.ProfileField.configurable_field_id == field_id).delete()
            db.flush()
            db.delete(field)
            db.flush()

        return DeleteTextField(success=True)


class ConfigurableFieldUnion(SQLAlchemyUnion):
    __doc__ = docs.ConfigurableFieldUnion.__doc__

    class Meta:
        types = (TextField, SelectField)
        model = models.AbstractConfigurableField

    @classmethod
    def resolve_type(cls, instance, context, info):
        if isinstance(instance, graphene.ObjectType):
            return type(instance)
        elif isinstance(instance, models.TextField):
            return TextField
        elif isinstance(instance, models.SelectField):
            return SelectField


class ProfileField(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.ProfileField.__doc__

    class Meta:
        model = models.ProfileField
        interfaces = (Node, )
        only_fields = ('id', )

    agent_profile = graphene.Field(lambda: AgentProfile, description=docs.ProfileField.agent_profile)
    configurable_field = graphene.Field(lambda: ConfigurableFieldUnion, required=True, description=docs.ProfileField.configurable_field)
    value_data = GenericScalar(description=docs.ProfileField.value_data)

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
    __doc__ = docs.FieldData.__doc__

    configurable_field_id = graphene.ID(required=True, description=docs.FieldData.configurable_field_id)
    id = graphene.ID(required=True, description=docs.FieldData.id)
    value_data = GenericScalar(required=True, description=docs.FieldData.value_data)


class FieldDataInput(graphene.InputObjectType, FieldData):
    pass


class UpdateProfileFields(graphene.Mutation):
    __doc__ = docs.UpdateProfileFields.__doc__

    class Input:
        data = graphene.List(FieldDataInput, required=True, description=docs.UpdateProfileFields.data)
        lang = graphene.String(required=True, description=docs.UpdateProfileFields.lang)

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
