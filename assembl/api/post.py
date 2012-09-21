from email import message_from_string
from email.message import Message

from ..lib.email import (add_header, decode_body, decode_header, formatdate,
                         parsedate)
from ..lib.utils import get_eol
from ..lib.vendor import jwzthreading as jwzt
from ..models.post import Email, Post

Post.inject_api(__name__)


def create(post=None, email_text=None, flush=True, **fields):
    """Create and save a post with the provided field values.

    It email_text is provided, make a post out of it.

    """
    if email_text is not None:
        msg = message_from_string(email_text)
        post = from_email(msg)
        headers, body = email_text.split(get_eol(email_text) * 2, 1)
        email = Email(headers=headers, body=body)
        post.email = email

    return Post.create(obj=post, flush=flush, **fields)


def from_email(msg):
    """Make a post out of an email.message.Message object."""
    header = lambda header: decode_header(msg.get(header))
    if not msg.is_multipart():
        body = decode_body(msg)
    elif msg.get_content_type() == 'multipart/alternative':
        body = decode_body(msg.get_payload()[0])
    else:
        raise ValueError('Incomplete support for multipart emails in %s.'
                         % header('message-id'))
    post = Post(date=parsedate(header('date')), author=header('from'),
                subject=header('subject'), message_id=header('message-id'),
                body=body)
    if post.message_id is None:
        raise ValueError('Email headers have no message-id.')
    return post


def to_thread_msg(post):
    """Turn a post into a minimal email.message.Message object.

    Used when threading messages.

    """
    if post.email:
        try:
            msg = message_from_string(post.email.message)
        except UnicodeEncodeError, e:
            # Let's go out on a limb and assume the badly encoded message
            # contains text in the UTF-8 charset that just needs to be
            # properly encoded.
            msg_text = post.email.message.encode('utf-8')
            msg = message_from_string(msg_text)
    else:
        msg = Message()
        msg.set_payload('- body omitted -', 'us-ascii')
        add_header(msg, 'Date', post.date, formatdate)
        add_header(msg, 'From', post.author)
        add_header(msg, 'Subject', post.subject)
        add_header(msg, 'Message-ID', post.message_id)
        if post.parent:
            add_header(msg, 'In-Reply-To', post.parent.message_id)
    add_header(msg, 'X-Assembl-Post-ID', post.id, str)

    return msg


def thread(posts):
    """Thread the provided list of posts."""
    posts = dict([(p.id, p) for p in posts])
    emails = (jwzt.make_message(to_thread_msg(p)) for p in posts.values())
    root = None

    def add_child(ctr, parent=None):
        """Make ctr a child of parent.

        Then make all ctr children children of ctr.
        If there's no parent, assign to root if there is one.

        """
        if ctr.message is None:
            if parent is not None:
                raise Exception('Empty container not at top-level!')
        else:
            post = posts[int(ctr.message.message['X-Assembl-Post-ID'])]
            parent = parent or root
            if parent and post not in parent.children:
                parent.children.append(post)
            parent = post

        for container in ctr.children:
            add_child(container, parent)

    for subject, container in jwzt.thread(emails).iteritems():
        add_child(container)
