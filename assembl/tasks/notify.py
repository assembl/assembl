"""Celery task for sending :py:class:`assembl.models.notification.Notification` to users."""
import sys
from time import sleep
from datetime import datetime, timedelta
from traceback import print_exc
import logging

import transaction
from pyramid_mailer import mailer_factory_from_settings
from pyramid_mailer.message import Message

from ..lib.sqla import mark_changed
from ..lib.raven_client import capture_exception
from . import (config_celery_app, CeleryWithConfig)



log = logging.getLogger('assembl')
notify_process_mailer = None


CELERYBEAT_SCHEDULE = {
    'resend-every-10-minutes': {
        'task': 'assembl.tasks.notify.process_pending_notifications',
        'schedule': timedelta(seconds=600),
        'options': {
            'routing_key': 'notify',
            'exchange': 'notify'
        }
    },
}


class NotifyCeleryApp(CeleryWithConfig):
    def on_configure_with_settings(self, settings):
        global notify_process_mailer
        notify_process_mailer = mailer_factory_from_settings(settings)
        # setup SETTINGS_SMTP_DELAY
        for name, val in settings.iteritems():
            if name.startswith(SETTINGS_SMTP_DELAY):
                try:
                    val = timedelta(seconds=float(val))
                except ValueError:
                    print "Not a valid value for %s: %s" % (name, val)
                    continue
                SMTP_DOMAIN_DELAYS[name[len(SETTINGS_SMTP_DELAY):]] = val
        log.info("SMTP_DOMAIN_DELAYS: " + repr(SMTP_DOMAIN_DELAYS))


notify_celery_app = NotifyCeleryApp('celery_tasks.notify')
notify_celery_app._preconf = {
    "CELERYBEAT_SCHEDULE": CELERYBEAT_SCHEDULE
}


# When was a mail last sent by notifications to a given domain?
# Propagates to superdomains.
DOMAIN_LAST_SENT = {}

# Minimum delay between emails sent to a domain.
# For this to work, you need to have a SINGLE celery process for notification.
SMTP_DOMAIN_DELAYS = {
    '': timedelta(0)
}

# INI file values with this prefix will be used to populate SMTP_DOMAIN_DELAYS.
# Anything after the last dot is a domain name (including empty).
# Use seconds (float) as values.
SETTINGS_SMTP_DELAY = "celery_tasks.notify.smtp_delay."


def email_was_sent(email):
    domain = email.split("@")[-1].lower().split('.')
    now = datetime.utcnow()
    for i in range(len(domain) + 1):
        dom = '.'.join(domain[i:])
        DOMAIN_LAST_SENT[dom] = now


def wait_if_necessary(email):
    domain = email.split("@")[-1].lower().split('.')
    # Look for most specific delay rule
    for i in range(len(domain) + 1):
        dom = '.'.join(domain[i:])
        if dom in SMTP_DOMAIN_DELAYS:
            delay = SMTP_DOMAIN_DELAYS[dom]
            break
    else:
        return
    # Not looking at superdomains. make delays as generic as needed
    last_sent = DOMAIN_LAST_SENT.get(dom, None)
    if last_sent is None:
        return
    elapsed = datetime.utcnow() - last_sent
    if elapsed < delay:
        sleep((delay - elapsed).total_seconds())


def process_notification(notification):
    from ..models.notification import (
        NotificationDeliveryStateType, UnverifiedEmailException,
        MissingEmailException)
    import smtplib
    import socket
    from assembl.lib import config

    assert notification
    sys.stderr.write(
        "process_notification called with notification %d, state was %s" % (
            notification.id, notification.delivery_state))
    if notification.delivery_state not in \
            NotificationDeliveryStateType.getRetryableDeliveryStates():
        sys.stderr.write(
            "Refusing to process notification %d because its delivery state is: %s" % (
                notification.id, notification.delivery_state))
        return
    try:
        email = notification.render_to_message()
        # sys.stderr.write(email_str)
        recipient = notification.get_to_email_address()
        wait_if_necessary(recipient)
        notify_process_mailer.send_immediately(email, fail_silently=False)

        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_IN_PROGRESS
        email_was_sent(recipient)
    except UnverifiedEmailException as e:
        sys.stderr.write("Not sending to unverified email: " + repr(e))
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
    except MissingEmailException as e:
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
        sys.stderr.write("Missing email!: " + repr(e))
    except (smtplib.SMTPConnectError,
            socket.timeout, socket.error,
            smtplib.SMTPHeloError) as e:
        sys.stderr.write("Temporary failure: " + repr(e))
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
    except smtplib.SMTPRecipientsRefused as e:
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_FAILURE
        sys.stderr.write("Recepients refused: " + repr(e))
    except smtplib.SMTPSenderRefused as e:
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
        sys.stderr.write("Invalid configuration!: " + repr(e))
    except Exception as e:
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
        sys.stderr.write("Unkown Exception!: " + repr(e))

    mark_changed()
    sys.stderr.write(
        "process_notification finished processing %d, state is now %s"
        % (notification.id, notification.delivery_state))


@notify_celery_app.task()
def notify(id):
    """ Can be triggered by
    http://localhost:6543/data/Discussion/6/all_users/2/notifications/12/process_now """
    from ..models.notification import Notification, waiting_get
    sys.stderr.write("notify called with "+str(id))
    with transaction.manager:
        notification = waiting_get(Notification, id)
        assert notification
        process_notification(notification)


@notify_celery_app.task()
def process_pending_notifications():
    """ Can be triggered by http://localhost:6543/data/Notification/process_now """
    from ..models.notification import (
        Notification, NotificationDeliveryStateType)
    sys.stderr.write("process_pending_notifications called")
    retryable_notifications = Notification.default_db.query(Notification.id).filter(
        Notification.delivery_state.in_(
        NotificationDeliveryStateType.getRetryableDeliveryStates()))
    for (notification_id,) in retryable_notifications:
        try:
            with transaction.manager:
                process_notification(Notification.get(notification_id))
        except:
            capture_exception()


def includeme(config):
    global notify_process_mailer
    config_celery_app(notify_celery_app, config.registry.settings)
    notify_process_mailer = mailer_factory_from_settings(config.registry.settings)
