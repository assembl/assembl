#!/usr/bin/python
"""A long-running process that receives requests to read data from various ContentSources,
and reads at reasonable intervals. It can also handle sources that can push changes. """
import sys
import signal
from random import uniform
from time import sleep
from threading import Thread, Event, currentThread
from traceback import print_stack
from datetime import datetime, timedelta
from abc import ABCMeta, abstractmethod
import logging
from logging.config import fileConfig

from pyramid.paster import get_appsettings
from zope.component import getGlobalSiteManager
from kombu import BrokerConnection, Exchange, Queue
from kombu.mixins import ConsumerMixin
from kombu.utils.debug import setup_logging
from sqlalchemy import event, inspect
from sqlalchemy.exc import TimeoutError

from assembl.tasks import configure
from assembl.lib.raven_client import capture_exception
from assembl.lib.config import set_config
from assembl.lib.enum import OrderedEnum
from assembl.lib.sqla import configure_engine

log = logging.getLogger('assembl')
pool_counter = 0


class ReaderStatus(OrderedEnum):
    # See doc/sourcereader.dot
    CREATED = 0
    READING = 1
    WAIT_FOR_PUSH = 2  # A state where new data will come without prompting
    PAUSED = 3  # A state where new data will come when prompted
    CLOSED = 4
    SHUTDOWN = 5
    TRANSIENT_ERROR = 10    # Try again later (same connection)
    CLIENT_ERROR = 11  # Make a new connection to re-try
    IRRECOVERABLE_ERROR = 12  # This server will never work.


known_transitions = {
    ReaderStatus.CREATED: {
        ReaderStatus.READING,
        ReaderStatus.CLOSED,
        ReaderStatus.CLIENT_ERROR,
        ReaderStatus.IRRECOVERABLE_ERROR,
    },
    ReaderStatus.READING: {
        ReaderStatus.CLIENT_ERROR,
        ReaderStatus.READING,
        ReaderStatus.IRRECOVERABLE_ERROR,
        ReaderStatus.PAUSED,
        ReaderStatus.TRANSIENT_ERROR,
        ReaderStatus.WAIT_FOR_PUSH,
        ReaderStatus.CLOSED,
        ReaderStatus.SHUTDOWN,  # Should this not go to closed first?
    },
    ReaderStatus.PAUSED: {
        ReaderStatus.CLOSED,
        ReaderStatus.READING,
        ReaderStatus.WAIT_FOR_PUSH,
    },
    ReaderStatus.CLIENT_ERROR: {
        ReaderStatus.SHUTDOWN,
        ReaderStatus.CLIENT_ERROR,
        ReaderStatus.IRRECOVERABLE_ERROR,
        ReaderStatus.READING,
    },
    ReaderStatus.CLOSED: {
        ReaderStatus.CLIENT_ERROR,
        ReaderStatus.SHUTDOWN,
    },
    ReaderStatus.IRRECOVERABLE_ERROR: {
        ReaderStatus.IRRECOVERABLE_ERROR,
        ReaderStatus.READING,
        ReaderStatus.SHUTDOWN,
    },
    ReaderStatus.TRANSIENT_ERROR: {
        ReaderStatus.READING,
    },
    ReaderStatus.WAIT_FOR_PUSH: {
        ReaderStatus.CLIENT_ERROR,
        ReaderStatus.CLOSED,
        ReaderStatus.PAUSED,
        ReaderStatus.READING,
        ReaderStatus.TRANSIENT_ERROR,
        ReaderStatus.IRRECOVERABLE_ERROR,
        ReaderStatus.WAIT_FOR_PUSH,
    },
    ReaderStatus.SHUTDOWN: {
        ReaderStatus.SHUTDOWN,
    },
}

disconnected_states = set((
        ReaderStatus.CLIENT_ERROR, ReaderStatus.IRRECOVERABLE_ERROR,
        ReaderStatus.CLOSED, ReaderStatus.SHUTDOWN))


# Connection constants
QUEUE_NAME = "source_reader"
ROUTING_KEY = QUEUE_NAME


class ReaderError(RuntimeError):
    status = ReaderStatus.TRANSIENT_ERROR
    pass


class ClientError(ReaderError):
    status = ReaderStatus.CLIENT_ERROR
    pass


class IrrecoverableError(ClientError):
    status = ReaderStatus.IRRECOVERABLE_ERROR
    pass


class ReadingForTooLong(ClientError):
    pass


class SourceReader(Thread):
    """ """
    __metaclass__ = ABCMeta
    deamon = True

    # Timings. Those should vary per source type, maybe even by source?
    min_time_between_reads = timedelta(minutes=1)
    time_between_reads = timedelta(minutes=10)
    max_idle_period = timedelta(hours=3)

    transient_error_backoff = timedelta(seconds=10)
    transient_error_numlimit = 10
    client_error_backoff = timedelta(minutes=15)
    client_error_numlimit = 3
    irrecoverable_error_backoff = timedelta(days=1)
    reading_takes_too_long = timedelta(minutes=15)

    def __init__(self, source_id):
        super(SourceReader, self).__init__()
        self.source_id = source_id
        self.source = None
        self.status = ReaderStatus.CREATED
        self.last_prod = datetime.utcnow()
        self.last_read_started = datetime.fromtimestamp(0)
        self.last_read = datetime.fromtimestamp(0)
        self.last_successful_login = datetime.fromtimestamp(0)
        self.last_error_status = None
        self.reimporting = False
        self.can_push = False  # Set to true for, eg, imap with polling.
        self.event = Event()

    def set_status(self, status):
        lvl = logging.INFO if status in known_transitions[self.status] else logging.ERROR
        log.log(lvl, "%s %d: %s -> %s" % (
            self.__class__.__name__, self.source_id, self.status.name,
            status.name))
        if status == ReaderStatus.READING and self.status != ReaderStatus.READING:
            self.source.connection_error = self.status.value
            self.source.db.commit()
            self.refresh_source()
        self.status = status

    def successful_login(self):
        self.last_successful_login = datetime.utcnow()
        self.source.db.commit()
        self.after_login = True

    def successful_read(self):
        from assembl.models import ContentSource
        self.last_read = datetime.utcnow()
        self.reset_errors()
        self.reimporting = False
        self.source.db.commit()
        self.refresh_source()

    def reset_errors(self):
        self.error_count = 0
        self.last_error_status = None
        self.error_backoff_until = None
        self.source.reset_errors()

    def new_error(self, reader_error, status=None, expected=True):
        import traceback
        from assembl.models import ContentSource
        log.error(traceback.format_exc())
        if not expected:
            capture_exception()
        status = status or reader_error.status
        if status != self.last_error_status:
            # Counter-intuitive, but either lighter or more severe errors
            # reset the count.
            self.error_count = 1
        elif status == self.last_error_status:
            self.error_count += 1
            # escalate errors with repetition
            if status == ReaderStatus.TRANSIENT_ERROR:
                if self.error_count > self.transient_error_numlimit:
                    status = ReaderStatus.CLIENT_ERROR
                    self.error_count = 1
            elif status == ReaderStatus.CLIENT_ERROR:
                if self.error_count > self.client_error_numlimit:
                    status = ReaderStatus.IRRECOVERABLE_ERROR
                    self.error_count = 1
            else:
                assert False
        if status == ReaderStatus.TRANSIENT_ERROR:
            error_backoff = self.transient_error_backoff
        elif status == ReaderStatus.CLIENT_ERROR:
            error_backoff = self.client_error_backoff
        elif status == ReaderStatus.IRRECOVERABLE_ERROR:
            error_backoff = self.irrecoverable_error_backoff
        else:
            assert False
        # double backoff every time
        error_backoff *= 2 ** (self.error_count - 1)

        self.last_error_status = status
        self.source.db.rollback()
        self.refresh_source()
        self.source.connection_error = status.value
        self.source.error_description = str(reader_error)
        if (status > ReaderStatus.TRANSIENT_ERROR and
                self.status != ReaderStatus.SHUTDOWN):
            self.set_status(status)
            self.reimporting = False
        self.error_backoff_until = datetime.utcnow() + error_backoff
        self.source.error_backoff_until = self.error_backoff_until
        self.source.db.commit()
        self.refresh_source()

    def refresh_source(self):
        # after a commit, refresh the source so it's still usable
        self.source.db.query(
            self.source.__class__
            ).populate_existing().get(self.source.id)

    def is_in_error(self):
        return self.last_error_status is not None

    def is_connected(self):
        return self.status not in disconnected_states

    def setup_read(self, reimport, **kwargs):
        self.reimporting = reimport
        self.extra_args = kwargs

    def handle_new_content(self, content):
        from .translate import translate_content
        translate_content(content)  # should delay

    def wake(self):
        print "SourceReader.wake"
        if self.status in (ReaderStatus.PAUSED, ReaderStatus.CLOSED) and (
                datetime.utcnow() - max(self.last_prod, self.last_read)
                > self.min_time_between_reads):
            self.event.set()
        elif self.status == ReaderStatus.TRANSIENT_ERROR and (
                datetime.utcnow() - max(self.last_prod, self.last_error_status)
                > self.transient_error_backoff):
            # Exception: transient backoff escalation can be cancelled by wake
            self.event.set()
        elif (self.status == ReaderStatus.READING
            and (datetime.utcnow() - self.last_read_started)
                > self.reading_takes_too_long):
            try:
                self.do_close()
                self.new_error(ReadingForTooLong())
            except ReaderError as e:
                self.new_error(e)

        self.last_prod = datetime.utcnow()

    def run(self):
        self.setup()
        while self.status not in (
                ReaderStatus.SHUTDOWN, ReaderStatus.IRRECOVERABLE_ERROR):
            if self.error_backoff_until:
                interval = (self.error_backoff_until - datetime.utcnow()).total_seconds()
                if interval > 0:
                    self.event.wait(interval)
                    self.event.clear()
            try:
                self.login()
                self.successful_login()
            except ReaderError as e:
                self.new_error(e)
                if self.status > ReaderStatus.TRANSIENT_ERROR:
                    self.try_close()
                continue
            except Exception as e:
                self.new_error(e, ReaderStatus.CLIENT_ERROR, expected=False)
                self.try_close()
                break
            while self.after_login or self.is_connected():
                if self.status == ReaderStatus.SHUTDOWN:
                    break
                self.after_login = False
                # Read in all cases
                try:
                    self.read()
                except ReaderError as e:
                    self.new_error(e)
                    if self.status > ReaderStatus.TRANSIENT_ERROR:
                        self.try_close()
                except Exception as e:
                    self.new_error(e, ReaderStatus.CLIENT_ERROR, expected=False)
                    self.try_close()
                    break
                if not self.is_connected():
                    break
                if self.can_push:
                    self.set_status(ReaderStatus.WAIT_FOR_PUSH)
                    while self.status == ReaderStatus.WAIT_FOR_PUSH:
                        try:
                            # This is not a final close, but sends it back to the QueuePool
                            self.source.db.close()
                            self.wait_for_push()
                        except ReaderError as e:
                            self.new_error(e)
                            if self.status > ReaderStatus.TRANSIENT_ERROR:
                                self.try_close()
                            else:
                                self.end_wait_for_push()
                            break
                        except Exception as e:
                            self.new_error(e, ReaderStatus.CLIENT_ERROR, expected=False)
                            self.try_close()
                            break
                        if not self.is_connected():
                            break
                        if self.status == ReaderStatus.READING:
                            self.set_status(ReaderStatus.WAIT_FOR_PUSH)
                        if self.status == ReaderStatus.PAUSED:
                            # If wait_for_push leaves us in PAUSED state,
                            # restart reading cycle
                            break
                    if not self.is_connected():
                        break
                    continue  # to next read cycle
                if not self.is_connected():
                    break
                if (self.last_read - self.last_prod
                        > self.max_idle_period):
                    # Nobody cares, I can stop reading
                    try:
                        if self.status == ReaderStatus.WAIT_FOR_PUSH:
                            self.end_wait_for_push()
                    finally:
                        self.close()

                    if self.status != ReaderStatus.SHUTDOWN:
                        self.event.wait(0)
                        self.event.clear()
                else:
                    self.event.wait(self.time_between_reads.total_seconds())
                    self.event.clear()
        if self.source and not inspect(self.source).detached:
            self.source.db.close()

    @abstractmethod
    def login(self):
        pass

    @abstractmethod
    def wait_for_push(self):
        # redefine in push-capable readers
        assert self.can_push
        # Leave a non-error status as either WAIT_FOR_PAUSE
        # or READING; the latter will loop.

    @abstractmethod
    def end_wait_for_push(self):
        # redefine in push-capable readers
        if (self.status in (ReaderStatus.READING, ReaderStatus.WAIT_FOR_PUSH)):
            self.set_status(ReaderStatus.PAUSED)
        self.source.db.close()

    def close(self):
        if self.status == ReaderStatus.WAIT_FOR_PUSH:
            try:
                self.end_wait_for_push()
            except ReaderError as e:
                self.new_error(e, min(e.status, ReaderStatus.CLIENT_ERROR))
        self.set_status(ReaderStatus.CLOSED)
        try:
            self.do_close()
        except ReaderError as e:
            self.new_error(e, min(e.status, ReaderStatus.CLIENT_ERROR))
        finally:
            self.set_status(ReaderStatus.SHUTDOWN)
            self.source.db.close()

    def try_close(self):
        try:
            self.do_close()
        except ReaderError as e:
            self.new_error(e, min(e.status, ReaderStatus.CLIENT_ERROR))

    @abstractmethod
    def do_close(self):
        pass

    def setup(self):
        from assembl.models import ContentSource
        backoff = 0.5 + uniform(0, 0.5)
        while self.source is None:
            try:
                self.source = ContentSource.get(self.source_id)
            except TimeoutError:
                # Ran out of connection pool
                log.error("TimeoutError for " + self.source_id)
                sleep(backoff)
                backoff *= 2
        connection_error = (
            ReaderStatus(self.source.connection_error)
            if self.source.connection_error else None)
        self.error_backoff_until = self.source.error_backoff_until
        if connection_error:
            self.status = connection_error

    def read(self):
        self.set_status(ReaderStatus.READING)
        self.last_read_started = datetime.utcnow()
        self.do_read()
        self.successful_read()
        if (self.status in (ReaderStatus.READING, ReaderStatus.WAIT_FOR_PUSH)):
            self.set_status(ReaderStatus.PAUSED)  # or WAIT_FOR_PUSH

    @abstractmethod
    def do_read(self):
        pass

    def shutdown(self):
        # TODO: lock.
        if self.is_connected():
            self.close()
        self.set_status(ReaderStatus.SHUTDOWN)
        self.event.set()

    def __repr__(self):
        return "<%s.%d in %s>" % (
            self.__class__.__name__, self.source_id, self._Thread__name)


class PullSourceReader(SourceReader):
    # Simple reader, no wait for push, just redefine do_read

    def login(self):
        pass

    def wait_for_push(self):
        assert False, "This reader cannot wait for push"

    def end_wait_for_push(self):
        assert False, "This reader cannot wait for push"

    def do_close(self):
        pass



# Kombu communication. Does not work yet.

_exchange = Exchange(QUEUE_NAME)
_queue = Queue(
    QUEUE_NAME, exchange=_exchange, routing_key=ROUTING_KEY)
_producer_connection = None


def wake(source_id, reimport=False, force_restart=False, **kwargs):
    global _producer_connection
    from kombu.common import maybe_declare
    from kombu.pools import producers
    with producers[_producer_connection].acquire(block=True) as producer:
        maybe_declare(_exchange, producer.channel)
        kwargs.update(dict(source=source_id, reimport=reimport, force_restart=force_restart))
        producer.publish(kwargs, serializer="json", routing_key=ROUTING_KEY)


def external_shutdown():
    global _producer_connection
    from kombu.common import maybe_declare
    from kombu.pools import producers
    with producers[_producer_connection].acquire(block=True) as producer:
        maybe_declare(_exchange, producer.channel)
        producer.publish(
            {"shutdown": True}, serializer="json", routing_key=ROUTING_KEY)


class SourceDispatcher(ConsumerMixin):

    def __init__(self, connection):
        super(SourceDispatcher, self).__init__()
        self.connection = connection
        self.readers = {}

    def get_consumers(self, Consumer, channel):
        global _queue
        return [Consumer(queues=(_queue,),
                         callbacks=[self.callback])]

    def callback(self, body, message):
        if isinstance(body, list):
            message.ack()
            return  # old message
        if body.get("shutdown", False):
            self.shutdown()
        else:
            source_id = body.get("source", None)
            if not source_id:
                raise ValueError("source not defined in "+repr(body))
            self.read(source_id, **body)
        message.ack()

    def read(self, source_id, reimport=False, force_restart=False, **kwargs):
        from assembl.models import ContentSource

        reader = self.readers.get(source_id, None)

        if force_restart and reader is not None:
            reader.shutdown()
            reader = None

        if not (reader and reader.is_connected()):
            source = ContentSource.get(source_id)
            if not source:
                return False
            if source.connection_error == ReaderStatus.IRRECOVERABLE_ERROR and not force_restart:
                return False
            if force_restart:
                source.reset_errors()
            reader = source.make_reader()
            self.readers[source_id] = reader
            if reader is None:
                return False

            reader.setup_read(reimport, **kwargs)
            reader.start()
            return True

        if reader is None:
            return False

        # We know it is connected by now.
        reader.setup_read(reimport, **kwargs)
        reader.wake()
        return True

    def shutdown(self):
        self.should_stop = True
        for reader in self.readers.itervalues():
            if reader is not None:
                reader.shutdown()


def includeme(config):
    global _producer_connection, _exchange
    setup_logging(loglevel='DEBUG')
    url = (config.registry.settings.get('celery_tasks.broker') or
           config.registry.settings.get('celery_tasks.imap.broker'))
    _producer_connection = BrokerConnection(url)



if __name__ == '__main__':
    if len(sys.argv) != 2:
        print "usage: python source_reader.py configuration.ini"
    config_file_name = sys.argv[-1]
    settings = get_appsettings(config_file_name, 'assembl')
    registry = getGlobalSiteManager()
    registry.settings = settings
    set_config(settings)
    fileConfig(config_file_name)
    # set the basic session maker without zope or autoflush
    engine = configure_engine(settings, False, autoflush=False, max_overflow=20)

    # @event.listens_for(engine, "checkin")
    def show_checkin(*args):
        global pool_counter
        pool_counter -= 1
        print "checkin pool: %d in %s" % (pool_counter, currentThread())
        print_stack()

    # @event.listens_for(engine, "checkout")
    def show_checkout(*args):
        global pool_counter
        pool_counter += 1
        print "checkout pool: %d in %s" % (pool_counter, currentThread())
        print_stack()

    configure(registry, 'source_reader')
    url = (settings.get('celery_tasks.broker') or
           settings.get('celery_tasks.imap.broker'))
    with BrokerConnection(url) as conn:
        sourcedispatcher = SourceDispatcher(conn)
        def shutdown(*args):
            sourcedispatcher.shutdown()
        signal.signal(signal.SIGTERM, shutdown)
        try:
            sourcedispatcher.run()
        except KeyboardInterrupt:
            shutdown()
