import sys
from datetime import timedelta

from celery import Celery

from . import init_task_config, config_celery_app


CELERYBEAT_SCHEDULE = {
    'resend-every-10-minutes': {
        'task': 'assembl.tasks.notify.process_pending_notifications',
        'schedule': timedelta(seconds=600),
        'args': ()
    },
}

# broker specified
notify_celery_app = Celery('celery_tasks.notify')
notify_celery_app._preconf = {"CELERYBEAT_SCHEDULE": CELERYBEAT_SCHEDULE}

watcher = None


@notify_celery_app.task(ignore_result=True)
def notify(id):
    init_task_config()
    print "notify called with ", id
    sys.stderr.write("notify called with "+str(id))


@notify_celery_app.task(ignore_result=False)
def process_pending_notifications():
    init_task_config()
    sys.stderr.write("processing...")
    # TODO: check notifications that need resending.


def includeme(config):
    config_celery_app(notify_celery_app, config.registry.settings)
