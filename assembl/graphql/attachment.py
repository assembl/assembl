# -*- coding=utf-8 -*-
import graphene
from graphene_sqlalchemy import SQLAlchemyObjectType

from assembl import models

import assembl.graphql.docstrings as docs
from .document import Document

from .types import SecureObjectType


class Attachment(SecureObjectType, SQLAlchemyObjectType):
    __doc__ = docs.Attachment.__doc__

    class Meta:
        model = models.Attachment
        only_fields = ('id',)

    document = graphene.Field(
        Document, description=docs.Attachment.document)
