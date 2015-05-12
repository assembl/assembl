from pyramid.i18n import TranslationStringFactory, Localizer
from .config import get_config


_ = TranslationStringFactory('assembl')


def get_localizer(request=None):
    """Get the localizer.
    Searches the given request, or the current request,
    or provides a default locale."""
    if request is None:
        from pyramid.threadlocal import get_current_request
        request = get_current_request()
    if request:
        localizer = request.localizer
    else:
        locale_name = get_config().get('available_languages', 'fr en').split()[0]
        localizer = Localizer(locale_name)
    return localizer
