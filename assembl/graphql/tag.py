import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

import assembl.graphql.docstrings as docs
from assembl import models

from .types import SecureObjectType, SQLAlchemyInterface


class TagInterface(SQLAlchemyInterface):
    __doc__ = docs.ExtractInterface.__doc__

    class Meta:
        model = models.Tag
        only_fields = ('value', )
        # Don't add id in only_fields in an interface
        # will be just the primary key, not the base64 type:id

    value = graphene.String(description=docs.ExtractInterface.text_fragment_identifiers)


class Tag(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.ExtractInterface.__doc__

    class Meta:
        model = models.Tag
        interfaces = (Node, TagInterface)
        only_fields = ('id')
