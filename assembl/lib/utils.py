import re
import unidecode
import inspect
from StringIO import StringIO

from pyramid.settings import asbool
from urlparse import urlparse

from . import config


def get_eol(text):
    """Return the EOL character sequence used in the text."""
    line = StringIO(text).readline()
    return line[len(line.rstrip('\r\n')):]


def slugify(str):
    str = unidecode.unidecode(str).lower()
    return re.sub(r'\W+', '-', str)


def get_subclasses_recursive(c):
    """Recursively returns the classes is a class hierarchy"""
    subclasses = c.__subclasses__()
    for d in list(subclasses):
        subclasses.extend(get_subclasses_recursive(d))
    return subclasses


def get_concrete_subclasses_recursive(c):
    """Recursively returns only the concrete classes is a class hierarchy"""
    concreteSubclasses = []
    subclasses = get_subclasses_recursive(c)
    for d in subclasses:
        if not inspect.isabstract(d):
            concreteSubclasses.append(d)
    return concreteSubclasses


def get_global_base_url(require_secure=None, override_port=None):
    """Get the base URL of this server
    DO NOT USE directly, except for Linked data;
    use Discussion.get_base_url()
    """
    port = str(override_port or config.get('public_port'))
    accept_secure_connection = asbool(
        config.get('accept_secure_connection'))
    require_secure_connection = accept_secure_connection and (require_secure or asbool(
        config.get('require_secure_connection')))
    service = 'http'
    portString = ''
    if accept_secure_connection or require_secure_connection:
        if port is None or port == "443":
            service += 's'
        elif port == "80":
            if require_secure_connection:
                service += 's'  # assume standard port upgrade
        else:
            if require_secure_connection:
                service += 's'
            portString = (':'+port)
    else:
        if port is not None and port != "80":
            portString = (':'+port)
    return '%s://%s%s' % (
        service, config.get('public_hostname'), portString)


def is_url_from_same_server(url, discussion=None):
    if not url:
        return False
    if discussion:
        base = urlparse(discussion.get_base_url())
    else:
        # TODO: If future virtual hosting allowed, using this
        # is very, very bad. Need to get the virtual host
        # address instead
        base = urlparse(get_global_base_url())
    purl = urlparse(url)
    return base.hostname == purl.hostname and base.port == purl.port


def path_qs(url):
    """Returns all components of url, including qs after hostname:port
    excluding the dangling "/"

    eg. url := "https://abcd.com:6543/a/b/c?foo=bar&baz=whocares"
    returns '/a/b/c?foo=bar&baz=whocares'
    """
    p = urlparse(url)
    return p.path + "?" + p.params
