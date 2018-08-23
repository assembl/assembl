"""Celery task for sending :py:class:`assembl.models.notification.Notification` to users."""
import sys
from time import sleep
from datetime import datetime, timedelta

import transaction
from pyramid.settings import asbool

from ..lib import config
from ..lib.raven_client import capture_exception
from ..lib.logging import getLogger
from . import celery, SMTP_DOMAIN_DELAYS


logger = getLogger()

# When was a mail last sent by notifications to a given domain?
# Propagates to superdomains.
DOMAIN_LAST_SENT = {}


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

    assert notification
    logger.debug(
        "process_notification called with notification %d, state was %s" % (
            notification.id, notification.delivery_state))
    if notification.delivery_state not in \
            NotificationDeliveryStateType.getRetryableDeliveryStates():
        logger.warning(
            "Refusing to process notification %d because its delivery state is: %s" % (
                notification.id, notification.delivery_state))
        return
    if asbool(config.get('disable_notifications', False)):
        logger.debug("Notifications disabled, setting to obsolete")
        notification.delivery_state = NotificationDeliveryStateType.OBSOLETED
        return
    try:
        email = notification.render_to_message()
        # logger.debug(email_str)
        recipient = notification.get_to_email_address()
        wait_if_necessary(recipient)
        celery.mailer.send_immediately(email, fail_silently=False)

        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_IN_PROGRESS
        email_was_sent(recipient)
    except UnverifiedEmailException as e:
        capture_exception()
        logger.exception("Not sending to unverified email")
        notification.db.rollback()
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
    except MissingEmailException as e:
        capture_exception()
        logger.exception("Missing email!")
        notification.db.rollback()
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
    except (smtplib.SMTPConnectError,
            socket.timeout, socket.error,
            smtplib.SMTPHeloError) as e:
        capture_exception()
        logger.exception("Temporary failure")
        notification.db.rollback()
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
    except smtplib.SMTPRecipientsRefused as e:
        logger.exception("Recepients refused")
        notification.db.rollback()
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_FAILURE
    except smtplib.SMTPSenderRefused as e:
        logger.exception("Invalid configuration!")
        notification.db.rollback()
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE
    except Exception as e:
        capture_exception()
        import traceback
        traceback.print_exc()
        logger.exception("Unknown Exception!")
        notification.db.rollback()
        notification.delivery_state = \
            NotificationDeliveryStateType.DELIVERY_TEMPORARY_FAILURE

    logger.debug(
        "process_notification finished processing %d, state is now %s"
        % (notification.id, notification.delivery_state))


@celery.task(shared=False)
def notify(id):
    """ Can be triggered by
    http://localhost:6543/data/Discussion/6/all_users/2/notifications/12/process_now """
    from ..models.notification import Notification, waiting_get
    logger.debug("notify called with " + str(id))
    with transaction.manager:
        notification = waiting_get(Notification, id)
        assert notification
        process_notification(notification)


@celery.task(shared=False)
def process_pending_notifications():
    """ Can be triggered by http://localhost:6543/data/Notification/process_now """
    from ..models.notification import (
        Notification, NotificationDeliveryStateType)
    logger.debug("process_pending_notifications called")
    retryable_notifications = Notification.default_db.query(Notification.id).filter(
        Notification.delivery_state.in_(
            NotificationDeliveryStateType.getRetryableDeliveryStates()))
    for (notification_id,) in retryable_notifications:
        try:
            with transaction.manager:
                process_notification(Notification.get(notification_id))
        except Exception as e:
            capture_exception()
