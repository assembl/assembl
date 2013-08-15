from colanderalchemy import (
    setup_schema,
    SQLAlchemySchemaNode,
    __colanderalchemy__,
    )

from .models import User


def includeme(config):
    setattr(SQLAlchemySchemaNode(User),
            __colanderalchemy__,
            overrides={
                'password': str,
            })
