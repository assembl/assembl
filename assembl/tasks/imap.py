from celery import Celery
from pyramid.paster import get_appsettings

from ..lib.sqla import configure_engine, get_session_maker


# TODO: Choose config.file
settings = get_appsettings('development.ini')

engine = configure_engine(settings, False)

#celery_broker = 'redis://localhost:6379/0'
celery_broker = 'sqla+' + db_connection
celery = Celery('imapreader', broker=celery_broker)
DBSession = get_session_maker(False)


@celery.task
def import_mails(mbox_id, only_new=True):
    from ..models import Mailbox
    mailbox = DBSession.query(Mailbox).get(mbox_id)
    Mailbox.do_import_content(mailbox, only_new)
