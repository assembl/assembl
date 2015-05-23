from celery import Celery

from . import init_task_config, config_celery_app

# broker specified
imap_celery_app = Celery('celery_tasks.imap')


@imap_celery_app.task(ignore_result=True)
def import_mails(mbox_id, only_new=True):
    init_task_config(imap_celery_app)
    from ..models import IMAPMailbox
    # in case of previous issues
    IMAPMailbox.default_db.rollback()
    mailbox = IMAPMailbox.get(mbox_id)
    assert mailbox is not None
    IMAPMailbox.do_import_content(mailbox, only_new)


def includeme(config):
    config_celery_app(imap_celery_app, config.registry.settings)
