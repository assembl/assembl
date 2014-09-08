from celery import Celery

from . import init_task_config

# broker specified
celery_queue = Celery('assembl.tasks.imap')

@celery_queue.task
def import_mails(mbox_id, only_new=True):
    init_task_config()
    from ..models import IMAPMailbox
    mailbox = IMAPMailbox.get(id=mbox_id)
    IMAPMailbox.do_import_content(mailbox, only_new)
