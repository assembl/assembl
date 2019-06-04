"""A celery process that reads messages from an IMAP source."""
from . import celery


@celery.task(ignore_result=True, shared=False)
def import_mails(mbox_id, only_new=True):
    from ..models import IMAPMailbox
    # in case of previous issues
    IMAPMailbox.default_db.rollback()
    mailbox = IMAPMailbox.get(mbox_id)
    assert mailbox is not None
    IMAPMailbox.do_import_content(mailbox, only_new)
