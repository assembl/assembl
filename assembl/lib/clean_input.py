from lxml import html
from lxml.html.clean import Cleaner
from six.moves.html_parser import HTMLParser

VALID_TAGS = ['a',
              'b',
              'blockquote',
              'code',
              'del',
              'dd',
              'dl',
              'dt',
              'em',
              # We do not allow Hx tags, whould cause layout problems
              # (manageable however)
              'i',
              # We do not allow img tags, either the reference is a local
              # file (which we don't support yet), our we could link to a
              # bunch of outside scripts.
              'li',
              'ol',
              'p',
              'pre',
              's',
              'sup',
              'sub',
              'strike',
              'strong',
              'table',
              'td',
              'th',
              'tr',
              'ul',
              'br',
              'hr',
              # we need these for draft-js richtexteditor:
              'img',
              'div',
              'span',
              ]

VALID_ATTRIBUTES = ['href', 'target', # For hyperlinks
                    'alt',  # For accessiblity
                    'colspan', 'headers', 'abbr',
                    'scope', 'sorted',  # For tables
                    # we need these for draft-js richtexteditor:
                    'title', 'src', 'width', 'data-id', 'data-mimetype',
                    'data-blocktype', 'data-externalurl', 'data-title',
                    'class'
                    ]


_html_parser = HTMLParser()


def unescape(text):
    if text is None:
        return None

    return _html_parser.unescape(text)


def _make_cleaner(tags):
    return Cleaner(
        allow_tags=tags, safe_attrs_only=True, remove_unknown_tags=False,
        add_nofollow=True)

_BASE_CLEANER = _make_cleaner(VALID_TAGS)


def _clean_html(html_value, cleaner):
    fragments = html.fragments_fromstring(html_value)
    for f in fragments:
        if isinstance(f, html.HtmlElement):
            cleaner(f)
            yield html.tostring(f, encoding="unicode")
        else:
            yield f


def _lxml_remove_tag(tree, index):
    # remove a tag from a tree fragment without removing its content
    children = tree.getchildren()
    element = children[index]
    tree.remove(element)
    if element.text:
        if index:
            text_target = children[index - 1]
            text_target.tail = (text_target.tail or '') + element.text
        else:
            tree.text = (tree.text or '') + element.text
    for sub in element.iterchildren():
        tree.insert(index, sub)
        index += 1
    tail = element.tail or ''
    if element.tag in ('p', 'br'):
        tail += '\n'
    if tail:
        if index:
            text_target = tree.getchildren()[index - 1]
            text_target.tail = (text_target.tail or '') + tail
        else:
            tree.text = (tree.text or '') + tail
    return index


def _clean_attributes(node, valid_attributes):
    for attname in node.attrib.keys():
        if attname not in valid_attributes:
            del node.attrib[attname]


def _sanitize_html_rec(fragment, valid_tags, valid_attributes):
    i = 0
    while i < len(fragment):
        child = fragment.getchildren()[i]
        _sanitize_html_rec(child, valid_tags, valid_attributes)
        if child.tag in valid_tags:
            _clean_attributes(child, valid_attributes)
            i += 1
        else:
            i = _lxml_remove_tag(fragment, i)


def _sanitize_html_frags(html_value, valid_tags, valid_attributes):
    fragments = html.fragments_fromstring(html_value)
    for f in fragments:
        if isinstance(f, html.HtmlElement):
            _sanitize_html_rec(f, valid_tags, valid_attributes)
            if f.tag in valid_tags:
                _clean_attributes(f, valid_attributes)
                yield html.tostring(f, encoding="unicode")
            else:
                if f.text:
                    yield f.text
                for sub in f:
                    yield html.tostring(sub, encoding="unicode")
                if f.tail:
                    yield f.tail
                if f.tag in ('p', 'br'):
                    yield u'\n'
        else:
            yield f


def _sanitize_html_keep(html_value, valid_tags=VALID_TAGS, valid_attributes=VALID_ATTRIBUTES):
    return u''.join(_sanitize_html_frags(html_value, valid_tags, valid_attributes))


def sanitize_html(html_value, valid_tags=VALID_TAGS,
                  valid_attributes=VALID_ATTRIBUTES, keep_tag_content=True):
    """Clean a HTML string, keeping only a subset of tags and attributes.

    :param [string] valid_tags: The name of tags that will be kept.
    :param [string] valid_attributes: The name of attributes that will be kept.
      Only used if keep_tag_content is true.
    :param bool keep_tag_content: Keep the content of tags that are removed
    """
    if keep_tag_content:
        return _sanitize_html_keep(html_value, valid_tags, valid_attributes)
    if valid_tags is not None:
        cleaner = _make_cleaner(valid_tags)
    else:
        cleaner = _BASE_CLEANER
    return u''.join(_clean_html(html_value, cleaner))


def sanitize_text(text):
    """Clean a HTML string, keeping only the text."""
    if text is not None and '<' in text:
        return html.fromstring(text).text_content()
    return unescape(text)

def escape_html(text):
  """Converts "<" to "&lt;", etc. See https://wiki.python.org/moin/EscapingHtml"""
  import cgi
  return cgi.escape(text)
