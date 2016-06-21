"""Schema to use Colander. Not used at the moment."""

from __future__ import absolute_import
from colander import SchemaType, null, Invalid
from colander.compat import (
    text_,
    text_type,
    )
from colanderalchemy import SQLAlchemySchemaNode
import translationstring

_ = translationstring.TranslationStringFactory('colander')


class CustomFieldsSASchema(SQLAlchemySchemaNode):

    def __init__(self,
                 class_,
                 includes=None,
                 excludes=None,
                 overrides=None,
                 unknown='ignore',
                 field_overrides=None,
                 **kw):

        super(CustomFieldsSASchema, self).__init__(
            class_, includes, excludes, overrides, unknown, **kw)

        self.field_map = {}

        if field_overrides:
            for field in field_overrides:
                node_field = self.get(field)
                field_data = field_overrides[field]

                for key in field_data:
                    if key == 'name':
                        self.field_map[field] = field_data[key]
                    setattr(
                        node_field,
                        key,
                        field_data[key],
                    )

        self.reverse_field_map = dict(
            [(v, k) for k, v in self.field_map.items()])


    def deserialize(self, data, *a, **kw):
        res =  super(CustomFieldsSASchema, self).deserialize(
            data, *a, **kw)
        for key in res:
            model_key = self._get_model_field_name(key)
            if model_key != key:
                res[model_key] = res.pop(key)
        return res


    def serialize(self, data, *a, **kw):
        for key in res:
            model_key = self._get_schema_field_name(key)
            if model_key != key:
                res[model_key] = res.pop(key)

        res =  super(CustomFieldsSASchema, self).serialize(
            data, *a, **kw)


    def _get_model_field_name(self, schema_field_name):
        return (self.reverse_field_map.get(schema_field_name, None)
                or schema_field_name)


    def _get_schema_field_name(self, model_field_name):
        return (self.field_map.get(model_field_name, None)
                or model_field_name)


    def dictify(self, obj):
        """ Return a dictified version of `obj` using schema information.

        The schema will be used to choose what attributes will be
        included in the returned dict.

        Thus, the return value of this function is suitable for consumption
        as a ``Deform`` ``appstruct`` and can be used to pre-populate
        forms in this specific use case.

        Arguments/Keywords

        obj
            An object instance to be converted to a ``dict`` structure.
            This object should conform to the given schema.  For
            example, ``obj`` should be an instance of this schema's
            mapped class, an instance of a sub-class, or something that
            has the same attributes.
        """
        dict_ = {}
        for node in self:
            model_field_name = self._get_model_field_name(node.name)

            try:
                getattr(self.inspector.column_attrs, model_field_name)
                value = getattr(obj, model_field_name)

            except AttributeError:
                try:
                    prop = getattr(self.inspector.relationships, model_field_name)
                    if prop.uselist:
                        value = [self[node.name].children[0].dictify(o)
                                 for o in getattr(obj, model_field_name)]
                    else:
                        o = getattr(obj, model_field_name)
                        value = None if o is None else self[node.name].dictify(o)
                except AttributeError:
                    # The given node isn't part of the SQLAlchemy model
                    msg = 'SQLAlchemySchemaNode.dictify: %s not found on %s'
                    log.debug(msg, node.name, self)
                    continue

            dict_[node.name] = value

        return dict_


class ValidateMeta(type):
    """
    Set this as model's meta class if you need to use Colander
    validation.

    e.g.:

    >>> class MyModel(SQLAlchemySchemaNode):
    >>>     __metaclass__ = ValidateMeta

    Then MyModel will have a __ca__ attribute that includes validation
    logic.
    """

    # class Node(object):
    #     def __call__(inst):


    def __new__(mcs, *a, **kw):
        clsinst = type(*a, **kw)
        field_overrides = getattr(clsinst, '__ca_field_overrides__', None)
        clsinst.__ca__ = CustomFieldsSASchema(
            clsinst,
            field_overrides=field_overrides,
        )
        return clsinst


class UUIDSchema(SchemaType):
    def __init__(self, encoding=None):
        self.encoding = encoding

    def serialize(self, node, appstruct):
        if appstruct in (null, None):
            return null

        try:
            if isinstance(appstruct, (text_type, bytes)):
                encoding = self.encoding
                if encoding:
                    result = text_(appstruct, encoding).encode(encoding)
                else:
                    result = text_type(appstruct)
            else:
                result = text_type(appstruct)
            return result
        except Exception as e:
            raise Invalid(node,
                          _('${val} cannot be serialized: ${err}',
                            mapping={'val':appstruct, 'err':e})
                          )

    def deserialize(self, node, cstruct):
        if not cstruct:
            return null

        try:
            result = cstruct
            if isinstance(result, (text_type, bytes)):
                if self.encoding:
                    result = text_(cstruct, self.encoding)
                else:
                    result = text_type(cstruct)
            else:
                result = text_type(cstruct)
        except Exception as e:
            raise Invalid(node,
                          _('${val} is not a string: ${err}',
                            mapping={'val':cstruct, 'err':e}))

        return result
