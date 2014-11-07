import sys

from celery import Celery

from . import init_task_config, config_celery_app

# broker specified
notify_celery_app = Celery('celery_tasks.notify')

watcher = None


@notify_celery_app.task(ignore_result=True)
def notify(id):
    init_task_config()
    print "notify called with ", id
    sys.stderr.write("notify called with "+str(id))


@notify_celery_app.task(ignore_result=True)
def resend_notifications():
    init_task_config()
    # TODO: check notifications that need resending.


def includeme(config):
    config_celery_app(notify_celery_app, config.registry.settings)
