from .locale import get_best_string_from_dict, _
from .config import get


class LocalizableError(ValueError):
    "Simplest LocalizableError class"
    def localized_message(self, localizer):
        return localizer.translate(self.message)


class LocalizableErrorWithMapping(LocalizableError):
    def __init__(self, message, mapping=None, langstrings=None, pluralval=None, pluralmessage=None):
        super(LocalizableError, self).__init__(message)
        self.mapping = mapping
        self.langstrings = langstrings
        self.pluralmessage = pluralmessage
        self.pluralval = pluralval

    def localized_message(self, localizer):
        mapping = self.mapping or {}
        if self.langstrings:
            for key, langstring in self.langstrings.items():
                mapping[key] = get_best_string_from_dict(
                    langstring, localizer.locale_name)
        if self.pluralmessage:
            return localizer.pluralize(
                _(self.message), _(self.pluralmessage), self.pluralval,
                mapping=mapping)
        else:
            return localizer.translate(_(self.message), mapping=mapping)


class LocalizableMultipleErrors(LocalizableError):
    def __init__(self, messages, mapping=None, langstrings=None):
        super(LocalizableError, self).__init__("\n".join(messages))
        self.mapping = mapping
        self.langstrings = langstrings
        self.messages = messages

    def localized_message(self, localizer, separator="\n"):
        mapping = self.mapping or {}
        if self.langstrings:
            for key, langstring in self.langstrings.items():
                mapping[key] = get_best_string_from_dict(
                    langstring, localizer.locale_name)
        return separator.join([localizer.translate(_(message), mapping=mapping)
                               for message in self.messages])
