from . import celery_queue, init

@celery_queue.task
def import_mails(mbox_id, only_new=True):
    init()
    from ..models import IMAPMailbox
    mailbox = IMAPMailbox.get(id=mbox_id)
    IMAPMailbox.do_import_content(mailbox, only_new)
