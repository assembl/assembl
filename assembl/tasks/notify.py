import sys
import transaction
from datetime import timedelta
from ..lib.sqla import mark_changed
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


def process_notification(notification):
    from ..models.notification import (
        NotificationDeliveryStateType, UnverifiedEmailException)
    import smtplib
    import socket
    from assembl.lib import config

    assert notification
    sys.stderr.write(
        "process_notification called with notification %d, state was %s" % (
            notification.id, notification.delivery_state))
    if notification.delivery_state in \
            NotificationDeliveryStateType.getNonRetryableDeliveryStates():
        sys.stderr.write(
            "Refusing to process notification "
            + str(notification.id)
            + " because it's delivery state is: "
            + str(notification.delivery_state))
        return
    try:
        email_str = notification.render_to_email()
        #sys.stderr.write(email_str)
        mail_host = config.get('mail.host')
        assert mail_host

        smtp_connection = smtplib.SMTP(
            mail_host
        )
        smtp_connection.set_debuglevel(1)
        smtp_retval = smtp_connection.sendmail(
            notification.get_from_email_address(),
            notification.get_to_email_address(),
            email_str
        )
        if smtp_retval:
            sys.stderr.write("Some but not all recipients failed:")
            for failed_recipient, errors in smtp_retval:
                sys.stderr.write(repr(failed_recipient), repr(errors))

        notification.delivery_state = NotificationDeliveryStateType.DELIVERY_IN_PROGRESS
        smtp_connection.quit()
    except UnverifiedEmailException as e:
        sys.stderr.write("Not sending to unverified email: "+repr(e))
        notification.delivery_state = NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
    except (smtplib.SMTPConnectError,
            socket.timeout, socket.error,
            smtplib.SMTPHeloError) as e:
        sys.stderr.write("Temporary failure: "+repr(e))
        notification.delivery_state = NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
    except smtplib.SMTPRecipientsRefused as e:
        notification.delivery_state = NotificationDeliveryStateType.DELIVERY_FAILURE
        sys.stderr.write("Recepients refused: "+repr(e))
    except smtplib.SMTPSenderRefused as e:
        notification.delivery_state = NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
        sys.stderr.write("Invalid configuration! :"+repr(e))

    mark_changed()
    sys.stderr.write(
        "process_notification finished processing %d, state is now %s"
        % (notification.id, notification.delivery_state))


@notify_celery_app.task(ignore_result=False)
def notify(id):
    """ Can be triggered by 
    http://localhost:6543/data/Discussion/6/all_users/2/notifications/12/process_now """
    init_task_config()
    from ..models.notification import Notification
    sys.stderr.write("notify called with "+str(id))
    with transaction.manager:
        notification = Notification.get(id)
        assert notification
        process_notification(notification)


@notify_celery_app.task(ignore_result=False)
def process_pending_notifications():
    """ Can be triggered by http://localhost:6543/data/Notification/process_now """
    init_task_config()
    from ..models.notification import (
        Notification, NotificationDeliveryStateType)
    sys.stderr.write("process_pending_notifications called")
    with transaction.manager:
        retryable_notifications = Notification.db.query(Notification).filter(
            Notification.delivery_state not in
            NotificationDeliveryStateType.getNonRetryableDeliveryStates())
        for notification in retryable_notifications:
            process_notification(notification)


def includeme(config):
    config_celery_app(notify_celery_app, config.registry.settings)
