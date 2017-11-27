import graphene


class Locale(graphene.ObjectType):
    locale_code = graphene.String(required=True)
    label = graphene.String(required=True)
