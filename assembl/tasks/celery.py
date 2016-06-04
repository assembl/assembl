from .notify import notify_celery_app
from .notification_dispatch import notif_dispatch_celery_app
from .imap import imap_celery_app
from .translate import translation_celery_app

celery = notify_celery_app

# This module fakes flower into believing there is a "celery" module in assembl
# with all the tasks. You can monitor celery tasks with:
# celery -A assembl.tasks -b redis://localhost:6379/0 flower
