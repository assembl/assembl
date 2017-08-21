from lxml import html
from lxml.html.clean import Cleaner
from bs4 import BeautifulSoup

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


def sanitize_html_keep(html_value, valid_tags, valid_attributes=VALID_ATTRIBUTES):
    """Remove unwanted tags. Unlike other cleaners like bleach, keep those tag's contents."""
    soup = BeautifulSoup(html_value)
    for tag in soup.find_all(True):
        if tag.name not in valid_tags:
            tag.hidden = True
            if tag.name in ('p', 'br'):
                tag.append('\n')
        else: # it might have bad attributes
            for attr in tag.attrs.keys():
                if attr not in valid_attributes:
                    del tag[attr]
    return soup.decode_contents()


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
