import graphene
import assembl.graphql.docstrings as docs


class Locale(graphene.ObjectType):
    __doc__ = docs.Locale.__doc__

    locale_code = graphene.String(required=True, description=docs.Locale.locale_code)
    label = graphene.String(required=True, description=docs.Locale.label)
