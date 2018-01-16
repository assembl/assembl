from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.ext.declarative import declared_attr
from sqlalchemy.orm import relationship, backref

from .langstrings import LangString


def langstring_relationship(model_name, column, column_name):
    return relationship(
        LangString,
        lazy="joined",
        single_parent=True,
        primaryjoin=column == LangString.id,
        backref=backref(model_name + "_from_" + column_name, lazy="dynamic"),
        cascade="all, delete-orphan"
    )


def LangStringId():
    return Column(Integer(), ForeignKey(LangString.id))


def make_langstring_id():
    @declared_attr
    def langstring_id(cls):
        return LangStringId()
    return langstring_id


def make_langstring(id_name, langstring_name):
    @declared_attr
    def langstring(cls):
        return langstring_relationship(cls.__tablename__, getattr(cls, id_name), langstring_name)
    return langstring


def langstrings_attrs_dict(langstrings_names):
    d = {}
    for langstring_name in langstrings_names:
        id_name = langstring_name + "_id"
        d[id_name] = make_langstring_id()
        d[langstring_name] = make_langstring(id_name, langstring_name)
    return d


def langstrings_base(langstrings_names, model_name):
    """ Create and returns a class with sqlalchemy columns for the given langstrings_names.
        :param model_name: A string to differenciate the type created.
        You need to provide a different model_name for each call to this function. """
    langstrings_base = type(
        "LangstringsBase" + model_name,
        (object, ),
        langstrings_attrs_dict(langstrings_names)
    )
    return langstrings_base
