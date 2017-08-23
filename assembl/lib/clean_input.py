from lxml import html
from lxml.html.clean import Cleaner

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
              ]

VALID_ATTRIBUTES = ['href',  # For hyperlinks
                    'alt',  # For accessiblity
                    'colspan', 'headers', 'abbr',
                    'scope', 'sorted'  # For tables
                    ]


def make_cleaner(tags):
    return Cleaner(
        allow_tags=tags, safe_attrs_only=True, remove_unknown_tags=False,
        add_nofollow=True)

BASE_CLEANER = make_cleaner(VALID_TAGS)


def _clean_html(html_value, cleaner):
    fragments = html.fragments_fromstring(html_value)
    for f in fragments:
        if isinstance(f, html.HtmlElement):
            cleaner(f)
            yield html.tostring(f)
        else:
            yield f


def lxml_remove_tag(tree, index):
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


def clean_attributes(node, valid_attributes):
    for attname in node.attrib.keys():
        if attname not in valid_attributes:
            del node.attrib[attname]


def sanitize_html_rec(fragment, valid_tags, valid_attributes):
    i = 0
    while i < len(fragment):
        child = fragment.getchildren()[i]
        sanitize_html_rec(child, valid_tags, valid_attributes)
        if child.tag in valid_tags:
            clean_attributes(child, valid_attributes)
            i += 1
        else:
            i = lxml_remove_tag(fragment, i)


def sanitize_html_frags(html_value, valid_tags, valid_attributes):
    fragments = html.fragments_fromstring(html_value)
    for f in fragments:
        if isinstance(f, html.HtmlElement):
            sanitize_html_rec(f, valid_tags, valid_attributes)
            if f.tag in valid_tags:
                clean_attributes(f, valid_attributes)
                yield html.tostring(f)
            else:
                if f.text:
                    yield f.text
                for sub in f:
                    yield html.tostring(sub)
                if f.tail:
                    yield f.tail
                if f.tag in ('p', 'br'):
                    yield '\n'
        else:
            yield f


def sanitize_html_keep(html_value, valid_tags=VALID_TAGS, valid_attributes=VALID_ATTRIBUTES):
    return ''.join(sanitize_html_frags(html_value, valid_tags, valid_attributes))


def sanitize_html(html_value, valid_tags=VALID_TAGS, keep_tag_content=True):
    if keep_tag_content:
        return sanitize_html_keep(html_value, valid_tags)
    if valid_tags is not None:
        cleaner = make_cleaner(valid_tags)
    else:
        cleaner = BASE_CLEANER
    return ''.join(_clean_html(html_value, cleaner))


def sanitize_text(text):
    if '<' in text:
        return html.fromstring(text).text_content()
    return text
