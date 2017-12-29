from sqlalchemy import Column, Integer, ForeignKey
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

def langstrings_dict(Model, lang_strings_names):
    """ Return a dict of langstrings relationships columns """
    langstrings = {}
    for lang_string_name in lang_strings_names:
        id_name = lang_string_name + "_id"
        langstrings[lang_string_name] = langstring_relationship(
            Model.__tablename__,
            getattr(Model, id_name),
            id_name,
        )
    return langstrings
        
def langstrings_ids_dict(lang_strings_names):
    """ Return a dict of langstrings ids columns """
    langstrings_ids = {}
    for lang_string_name in lang_strings_names:
        id_name = lang_string_name + '_id'
        langstrings_ids[id_name] = LangStringId()
    return langstrings_ids

def with_langstrings(ModelWithoutLangstrings):
    """ Set langstrings attributes on a model using the Model.langstrings_names """
    class_name = ModelWithoutLangstrings.__class__.__name__
    names = ModelWithoutLangstrings.__langstrings__
    ModelWithIds = type(class_name + "WithLangstringsIds",
        (ModelWithoutLangstrings, ),
        langstrings_ids_dict(names))
        
    Model = type(class_name + "WithLangstrings",
        (ModelWithIds, ),
        langstrings_dict(ModelWithIds, names))
        
    LangString.setup_ownership_load_event(Model, names)
    
    return Model