#THIS CODE IS NOT ACTIVE!

from email import message_from_string
from email.message import Message

from ..lib.email import (add_header, decode_body, decode_header, formatdate,
                         parsedate)
from ..lib.utils import get_eol
from ..lib.vendor import jwzthreading as jwzt
from ..models.post import Email, Post

Post.inject_api(__name__)



def to_thread_msg(post):
    """Turn a post into a minimal email.message.Message object.

    Used when threading messages.

    """
    if post.email:
        msg_text = post.email.message
        if isinstance(post.email.message, unicode):
            msg_text = msg_text.encode('utf-8')
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
