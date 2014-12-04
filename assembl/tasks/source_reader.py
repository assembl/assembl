import sys
from threading import Thread, Event
from datetime import datetime, timedelta
import time
from abc import ABCMeta, abstractmethod

import imaplib2
from pyramid.paster import get_appsettings
from zope.component import getGlobalSiteManager
from kombu import BrokerConnection, Exchange, Queue
from kombu.common import eventloop
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

# Timings. Those should vary per source type, maybe even by source?
MIN_TIME_BETWEEN_READS = timedelta(minutes=1)
TIME_BETWEEN_READS = timedelta(minutes=10)
TIME_BETWEEN_READS_AFTER_ERROR = timedelta(hours=1)
MAX_IDLE_PERIOD = timedelta(hours=3)


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
        self.reading = Event()

    def prod(self):
        self.last_prod = datetime.now()
        if self.status == WAITING and (
                datetime.now() - self.last_prod) > MIN_TIME_BETWEEN_READS:
            self.event.set()
        else:
            pass
            # That prod is lost, maybe queue it?
        self.last_prod = datetime.now()

    def run(self):
        self.setup()
        # The polling version might be quite different.
        while self.status not in (CLIENT_ERROR, IRRECOVERABLE_ERROR):
            waitfor = TIME_BETWEEN_READS if self.status != ERROR \
                else TIME_BETWEEN_READS_AFTER_ERROR
            self.event.wait(waitfor)
            self.event.clear()
            if (datetime.now() - self.last_prod) > MAX_IDLE_PERIOD:
                # Nobody cares, I can die in peace
                break
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
                self.status = READING
        return results

    @abstractmethod
    def do_read(self):
        pass


class IMAPReader(SourceReader):
    # TODO
    def do_read(self):
        print "READING FROM IMAP"

    def setup(self):
        print "SETTING UP IMAP"
        super(IMAPReader, self).setup()

    def close(self):
        print "CLOSING IMAP"
        super(IMAPReader, self).setup()

# Kombu communication. Does not work yet.


_exchange = Exchange("source_reader", "fanout")


def get_queue(url):
    global _exchange
    queue = Queue(
        "source_reader", exchange=_exchange, routing_key="source_reader")
    connection = BrokerConnection(url)
    queue(connection.channel()).declare()
    return connection, queue


_producer = None


def prod(source_id):
    global _producer
    _producer.publish(source_id)


class SourceDispatcher(Thread):
    deamon = True
    def __init__(self, url):
        super(SourceDispatcher, self).__init__()
        self.readers = {}
        from assembl.models import ContentSource
        self.session = ContentSource.db
        connection, queue = get_queue(url)
        self.consumer = connection.Consumer(queue, callbacks=[self.callback])
        self.loop = eventloop(connection, timeout=1, ignore_timeouts=True)

    def callback(self, body, message):
        print body
        import pdb; pdb.set_trace()
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
                reader.close()  # Just in case.
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

    def run(self):
        for _ in self.loop:
            print '.',  # loop forever.


def includeme(config):
    global _producer, _exchange
    connection, queue = get_queue(
        config.registry.settings.get('celery_tasks.imap.broker'))
    _producer = connection.Producer(
        exchange=_exchange, routing_key="source_reader")


if __name__ == '__main__':
    if len(sys.argv) != 2:
        print "usage: python imap2.py configuration.ini"
    settings = get_appsettings(sys.argv[-1], 'assembl')
    registry = getGlobalSiteManager()
    registry.settings = settings
    set_config(settings)
    configure(registry, 'imap2')
    dispatcher = SourceDispatcher(settings.get('celery_tasks.imap.broker'))
    dispatcher.start()
