
from os import urandom
from base64 import b64encode
from subprocess import call
from tempfile import TemporaryFile

from zope import interface

from assembl.lib import config
from assembl.lib.discussion_creation import IDiscussionCreationCallback


class CreateVMMMailboxAtDiscussionCreation(object):
    """A :py:class:`IDiscussionCreationCallback` that creates an IMAP account with VMM

    Ensure that the following is in /etc/sudoers:
    assembl_user ALL=NOPASSWD: /usr/sbin/vmm ua *
    """
    interface.implements(IDiscussionCreationCallback)

    def discussionCreated(self, discussion):
        from assembl.models import IMAPMailbox
        password = b64encode(urandom(12))
        email = "@".join((discussion.slug, config.get("imap_domain")))
        mailbox = IMAPMailbox(
            name=discussion.slug + " imap",
            host='localhost',
            username=email,
            password=password,
            admin_sender=email,
            discussion=discussion,
            folder='inbox',
            port=143,
            use_ssl=False)
        discussion.db.add(mailbox)
        with TemporaryFile() as stderr:
            rcode = call(['sudo', 'vmm', 'ua', email, password],
                         stderr=stderr)
            if rcode != 0:
                stderr.seek(0)
                error = stderr.read()
                if " already exists" not in error:
                    raise RuntimeError(
                        "vmm useradd failed: %d\n%s" % (rcode, error))
