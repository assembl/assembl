import re
import unidecode
import inspect
from StringIO import StringIO

from pyramid.settings import asbool

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
