import graphene
from graphene.relay import Node
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models

from .types import SecureObjectType, SQLAlchemyInterface


class TextFragmentIdentifier(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.TextFragmentIdentifier
        interfaces = (Node,)
        only_fields = ('xpath_start', 'xpath_end', 'offset_start', 'offset_end')


class ExtractInterface(SQLAlchemyInterface):
    class Meta:
        model = models.Extract
        only_fields = ('body', 'important')
        # Don't add id in only_fields in an interface or the the id of Post
        # will be just the primary key, not the base64 type:id

    text_fragment_identifiers = graphene.List(TextFragmentIdentifier)


class Extract(SecureObjectType, SQLAlchemyObjectType):
    class Meta:
        model = models.Extract
        interfaces = (Node, ExtractInterface)
        only_fields = ('id')
