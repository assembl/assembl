import graphene
from assembl import models


class Locale(graphene.ObjectType):
    locale_code = graphene.String(required=True)
    label = graphene.String(required=False, lang=graphene.String(required=False))

    def resolve_label(self, args, context, info):
        lang = args.get('lang')
        if not lang:
            return None
        target_locale = models.Locale.get_or_create(lang)
        labels = models.LocaleLabel.names_in_locale(target_locale)
        return labels[self.locale_code]
