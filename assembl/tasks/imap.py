from celery import Celery
from pyramid.paster import get_appsettings

from ..lib.sqla import configure_engine, get_session_maker
from ..lib.zmqlib import configure_zmq

# TODO: Choose config.file
settings = get_appsettings('development.ini')

configure_zmq(settings['changes.socket'], False)
engine = configure_engine(settings, False)

celery_broker = settings['celery.broker']

app = Celery(broker=celery_broker)
DBSession = get_session_maker(False)


@app.task
def import_mails(mbox_id, only_new=True):
    from ..models import Mailbox
    mailbox = DBSession.query(Mailbox).get(mbox_id)
    Mailbox.do_import_content(mailbox, only_new)
