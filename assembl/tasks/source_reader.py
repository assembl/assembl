import sys
from threading import Thread, Event
from datetime import datetime, timedelta
from abc import ABCMeta, abstractmethod

import imaplib2
from pyramid.paster import get_appsettings
from zope.component import getGlobalSiteManager
from kombu import BrokerConnection, Exchange, Queue
from kombu.mixins import ConsumerMixin
from kombu.utils.debug import setup_logging
import transaction

from assembl.tasks import configure
from assembl.lib.config import set_config

# Status
CREATED = 0
READING = 1
POLLING = 2  # A state where new data will come without prompting
WAITING = 3  # A state where new data will come when prompted
CLOSED = 4
ERROR = 5    # Try again later
CLIENT_ERROR = 6  # Make a new client to re-try
IRRECOVERABLE_ERROR = 7  # This server will never work.
CLOSING = 8

# Timings. Those should vary per source type, maybe even by source?
MIN_TIME_BETWEEN_READS = timedelta(minutes=1)
TIME_BETWEEN_READS = timedelta(minutes=10)
TIME_BETWEEN_READS_AFTER_ERROR = timedelta(hours=1)
MAX_IDLE_PERIOD = timedelta(hours=3)

# Connection constants
ROUTING_KEY = "source_reader"
QUEUE_NAME = "source_reader"


class SourceReader(Thread):
    __metaclass__ = ABCMeta
    deamon = True

    def __init__(self, source, sessionmaker):
        super(SourceReader, self).__init__()
        self.source = source
        self.session = sessionmaker()
        self.status = CREATED
        self.last_prod = datetime.fromtimestamp(0)
        self.last_read = datetime.fromtimestamp(0)
        self.last_successful_read = datetime.fromtimestamp(0)
        self.can_poll = False  # Set to true for, eg, imap with polling.
        self.event = Event()

    def prod(self):
        if self.status == WAITING and (datetime.now() - max(
                self.last_prod, self.last_read) > MIN_TIME_BETWEEN_READS):
            self.event.set()
            self.last_prod = datetime.now()
        else:
            pass
            # That prod is lost, maybe queue it?

    def run(self):
        self.setup()
        # The polling version might be quite different.
        self.read()
        while self.status not in (
                CLIENT_ERROR, IRRECOVERABLE_ERROR, CLOSING):
            waitfor = TIME_BETWEEN_READS if self.status != ERROR \
                else TIME_BETWEEN_READS_AFTER_ERROR
            self.event.wait(waitfor.total_seconds())
            self.event.clear()
            if (datetime.now() - self.last_prod) > MAX_IDLE_PERIOD:
                # Nobody cares, I can die in peace
                break
            if self.status in (WAITING, ERROR):
                self.read()
        self.do_close()
        self.status = CLOSED

    @abstractmethod
    def do_close(self):
        pass

    @abstractmethod
    def setup(self):
        # After the setup, set can_poll, then do this:
        if self.can_poll:
            self.status = POLLING
        else:
            self.status = READING

    def read(self):
        self.status = READING
        results = None
        try:
            # hmmm. and if asynchronous?
            with transaction.manager:
                results = self.do_read()
        except:
            self.status = ERROR
            # TODO: Distinguish error types with different exception classes?
        self.last_read = datetime.now()
        if results:
            # this may also go in a callback on succesful read...
            self.last_successful_read = datetime.now()
            if self.can_poll:
                self.status = POLLING
            else:
                self.status = WAITING
        return results

    @abstractmethod
    def do_read(self):
        pass

    def stop(self):
        # TODO: lock.
        if self.status in (WAITING, ERROR):
            self.status = CLOSING
            self.event.set()


class IMAPReader(SourceReader):
    # TODO
    def do_read(self):
        print "READING FROM IMAP ", self.source.id
        return True

    def setup(self):
        print "SETTING UP IMAP ", self.source.id
        super(IMAPReader, self).setup()

    def do_close(self):
        print "CLOSING IMAP ", self.source.id
        super(IMAPReader, self).setup()

# Kombu communication. Does not work yet.


_exchange = Exchange("source_reader", "direct")
_queue = Queue(
    QUEUE_NAME, exchange=_exchange, routing_key=ROUTING_KEY)
_producer_connection = None


def prod(source_id):
    global _producer_connection
    from kombu.common import maybe_declare
    from kombu.pools import producers
    with producers[_producer_connection].acquire(block=True) as producer:
        maybe_declare(_exchange, producer.channel)
        producer.publish(
            source_id, serializer="json", routing_key=ROUTING_KEY)


class SourceDispatcher(ConsumerMixin):

    def __init__(self, connection):
        super(SourceDispatcher, self).__init__()
        self.connection = connection
        self.readers = {}
        from assembl.models import ContentSource
        self.sessionmaker = ContentSource.db

    def get_consumers(self, Consumer, channel):
        global _queue
        return [Consumer(queues=(_queue,),
                         callbacks=[self.callback])]

    def callback(self, body, message):
        self.read(body)
        message.ack()

    def read(self, source_id):
        from assembl.models import ContentSource
        source = ContentSource.get(source_id)
        if source_id not in self.readers:
            self.readers[source_id] = self.make_reader(source)
        reader = self.readers[source_id]
        if reader.status == IRRECOVERABLE_ERROR:
            return False
        if not reader.is_alive():
            reader.status = CLIENT_ERROR
        if reader.status in (CLIENT_ERROR, CLOSED):
            if reader.status == CLIENT_ERROR:
                reader.do_close()  # Just in case.
            reader = self.make_reader(source)
            self.readers[source_id] = reader
        reader.prod()
        return True

    def make_reader(self, source):
        from assembl.models import IMAPMailbox
        if isinstance(source, IMAPMailbox):
            reader = IMAPReader(source, self.sessionmaker)
        else:
            # fail silently?
            raise RuntimeError("Unknown source type")
        reader.start()
        return reader

    def stop(self):
        for reader in self.readers.itervalues():
            reader.stop()


def includeme(config):
    global _producer_connection, _exchange
    setup_logging(loglevel='DEBUG')
    url = config.registry.settings.get('celery_tasks.imap.broker')
    _producer_connection = BrokerConnection(url)


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print "usage: python source_reader.py configuration.ini"
    setup_logging(loglevel='DEBUG')
    settings = get_appsettings(sys.argv[-1], 'assembl')
    registry = getGlobalSiteManager()
    registry.settings = settings
    set_config(settings)
    configure(registry, 'source_reader')
    url = settings.get('celery_tasks.imap.broker')
    with BrokerConnection(url) as conn:
        sourcedispatcher = SourceDispatcher(conn)
        try:
            sourcedispatcher.run()
        except KeyboardInterrupt:
            sourcedispatcher.stop()
