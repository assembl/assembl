from email import message_from_string

from . import BaseAPI
from ..lib.utils import get_eol
from ..lib.vendor import jwzthreading as jwzt
from ..models.post import Email, Post


class PostAPI(BaseAPI):
    def __init__(self):
        super(PostAPI, self).__init__(model_cls=Post)

    def create(self, post=None, email_text=None, **fields):
        """Create and save a post with the provided field values.

        It email_text is provided, make a post out of it.

        """
        if email_text is not None:
            msg = message_from_string(email_text)
            post = Post.from_email(msg)
            headers, body = email_text.split(get_eol(email_text) * 2, 1)
            email = Email(headers=headers, body=body)
            post.email = email

        return super(PostAPI, self).create(obj=post, **fields)

    def thread(self, posts):
        """Thread the posts list that corresponds to the criteria."""
        posts = dict([(p.id, p) for p in posts])
        emails = (jwzt.make_message(p.to_thread_msg()) for p in posts.values())
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
