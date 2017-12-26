from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship, backref

from .langstrings import LangString


def langStringRelationship(Model, column_name):
    column = getattr(Model, column_name + '_id')
    model_name = Model.__tablename__
    return relationship(
        LangString,
        lazy="joined",
        single_parent=True,
        primaryjoin=column == LangString.id,
        backref=backref(model_name + "_from_" + column_name, lazy="dynamic"),
        cascade="all, delete-orphan"
    )


def langStringId():
    return Column(Integer(), ForeignKey(LangString.id))


def declareLangStrings(Model, lang_strings_names):
    """ Add langstrings ids and relationships properties to a model. """

    for lang_string_name in lang_strings_names:
        id_name = lang_string_name + '_id'
        setattr(Model, id_name, langStringId())
        setattr(Model, lang_string_name, langStringRelationship(Model, lang_string_name))

    LangString.setup_ownership_load_event(Model, lang_strings_names)
