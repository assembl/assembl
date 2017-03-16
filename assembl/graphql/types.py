from collections import OrderedDict

import six
from graphene_sqlalchemy import SQLAlchemyObjectType
from graphene_sqlalchemy.converter import (
    convert_column_to_string, convert_sqlalchemy_type)
from graphene_sqlalchemy.types import construct_fields
from graphene.types.interface import Interface, InterfaceMeta
from graphene.types.options import Options
from graphene.types.utils import merge, yank_fields_from_attrs
from graphene.types.field import Field
from graphene.types.union import Union, UnionMeta
from graphene.utils.is_base_type import is_base_type
from graphene_sqlalchemy.registry import Registry, get_global_registry
from graphene_sqlalchemy.utils import is_mapped


def get_base_fields(bases, _as=None):
    '''
    Get all the fields in the given bases
    same as graphene.types.utils.get_base_fields but with SQLAlchemyInterface check
    '''
    fields = OrderedDict()
    from graphene.types import AbstractType, Interface
    from .schema import SQLAlchemyInterface
    # We allow inheritance in AbstractTypes and Interfaces but not ObjectTypes
    inherited_bases = (AbstractType, Interface, SQLAlchemyInterface)
    for base in bases:
        if base in inherited_bases or not issubclass(base, inherited_bases):
            continue
        for name, field in base._meta.fields.items():
            if name in fields:
                continue
            fields[name] = get_field_as(field, _as=_as)

    return fields


class SQLAlchemyInterfaceMeta(InterfaceMeta):

    @staticmethod
    def __new__(cls, name, bases, attrs):
        # Also ensure initialization is only performed for subclasses of SQLAlchemyInterface
        # (excluding SQLAlchemyInterface class itself).
        if not is_base_type(bases, SQLAlchemyInterfaceMeta):
            return type.__new__(cls, name, bases, attrs)

        options = Options(
            attrs.pop('Meta', None),
            name=name,
            description=attrs.pop('__doc__', None),
            model=None,
            local_fields=None,
            only_fields=(),
            exclude_fields=(),
            # id='id',
            registry=None
        )

        if not options.registry:
            options.registry = get_global_registry()
        assert isinstance(options.registry, Registry), (
            'The attribute registry in {}.Meta needs to be an'
            ' instance of Registry, received "{}".'
        ).format(name, options.registry)
        assert is_mapped(options.model), (
            'You need to pass a valid SQLAlchemy Model in '
            '{}.Meta, received "{}".'
        ).format(name, options.model)

        cls = type.__new__(cls, name, bases, dict(attrs, _meta=options))

        options.base_fields = ()
        options.base_fields = get_base_fields(bases, _as=Field)
        if not options.local_fields:
            options.local_fields = yank_fields_from_attrs(attrs, _as=Field)

        # options.registry.register(cls)

        options.fields = merge(
            options.base_fields,
            options.local_fields
        )

        options.sqlalchemy_fields = yank_fields_from_attrs(
            construct_fields(options),
            _as=Field,
        )
        options.fields = merge(
            options.sqlalchemy_fields,
            options.base_fields,
            options.local_fields
        )

        return cls


class SQLAlchemyInterface(six.with_metaclass(SQLAlchemyInterfaceMeta, Interface)):
    pass


class SQLAlchemyUnionMeta(UnionMeta):
    """Same as original UnionMeta, but with model=None in the options
    to be able to specify the model attribute for Meta in SQLAlchemyUnion
    """

    def __new__(cls, name, bases, attrs):
        # Also ensure initialization is only performed for subclasses of
        # Union
        if not is_base_type(bases, SQLAlchemyUnionMeta):
            return type.__new__(cls, name, bases, attrs)

        options = Options(
            attrs.pop('Meta', None),
            name=name,
            description=attrs.get('__doc__'),
            types=(),
            model=None
        )

        assert (
            isinstance(options.types, (list, tuple)) and
            len(options.types) > 0
        ), 'Must provide types for Union {}.'.format(options.name)

        return type.__new__(cls, name, bases, dict(attrs, _meta=options))


class SQLAlchemyUnion(six.with_metaclass(SQLAlchemyUnionMeta, Union)):
    pass

