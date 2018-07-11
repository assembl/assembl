import graphene

import assembl.graphql.docstrings as docs
from .langstring import (
    LangStringEntry, LangStringEntryInput,
    resolve_langstring, resolve_langstring_entries,
    update_langstring_from_input_entries)

entries_suffix = "_entries"


def make_langstring_resolver(langstring_name, langstring_def):
    def langstring_resolver(self, args, context, info):
        parent = self
        if 'relation_name' in langstring_def:
            parent = getattr(self, langstring_def['relation_name'])
        target_name = langstring_name
        if 'target_name' in langstring_def:
            target_name = langstring_def['target_name']
        return resolve_langstring(getattr(parent, target_name), args.get('lang'))
    return langstring_resolver


def make_entries_resolver(langstring_name, langstring_def):
    def entries_resolver(self, args, context, info):
        parent = self
        if 'relation_name' in langstring_def:
            parent = getattr(self, langstring_def['relation_name'])
        target_name = langstring_name
        if 'target_name' in langstring_def:
            target_name = langstring_def['target_name']
        return resolve_langstring_entries(parent, target_name)
    return entries_resolver


def graphql_langstrings_attrs_dict(langstrings_defs):
    d = {}
    for langstring_name in langstrings_defs.keys():
        d[langstring_name] = graphene.String(
            lang=graphene.String(required=True, description=docs.Default.required_language_input),
            description=langstrings_defs[langstring_name]['documentation']['base'])
        d["resolve_" + langstring_name] = make_langstring_resolver(
            langstring_name,
            langstrings_defs[langstring_name]
        )

        entries_name = langstring_name + entries_suffix
        d[entries_name] = graphene.List(
            LangStringEntry, description=langstrings_defs[langstring_name]['documentation']['entries'])
        d["resolve_" + entries_name] = make_entries_resolver(
            langstring_name,
            langstrings_defs[langstring_name]
        )
    return d


def langstrings_interface(langstrings_defs, model_name):
    langstrings_interface = type(
        model_name + "LangstringsInterface",
        (graphene.Interface, ),
        graphql_langstrings_attrs_dict(langstrings_defs)
    )
    return langstrings_interface


def update_langstrings(model, langstrings_defs, args):
    for name in langstrings_defs.keys():
        target_name = name
        langstring_def = langstrings_defs[name]
        if 'target_name' in langstring_def:
            target_name = langstring_def['target_name']
        parent = model
        if 'relation_name' in langstring_def:
            parent = getattr(model, langstring_def['relation_name'])
        update_langstring_from_input_entries(
            parent,
            target_name,
            args.get(name + entries_suffix)
        )


def add_langstrings_input_attrs(Input, langstrings_names):
    for langstring_name in langstrings_names:
        setattr(
            Input,
            langstring_name + entries_suffix,
            graphene.List(LangStringEntryInput)
        )
