from ConfigParser import ConfigParser

from sqlalchemy import create_engine
from sqlalchemy.orm import scoped_session, sessionmaker
from celery import Celery
from zope.sqlalchemy import ZopeTransactionExtension


settings = ConfigParser()
# TODO: Choose config.file
settings.read('development.ini')

db_connection = settings.get('app:main', 'sqlalchemy.url')
engine = create_engine(db_connection)

#celery_broker = 'redis://localhost:6379/0'
celery_broker = db_connection
celery = Celery('imapreader', broker=celery_broker)

DBSession = scoped_session(sessionmaker(extension=ZopeTransactionExtension()))
DBSession.configure(bind=engine)


@celery.task
def import_mails(mbox_id, only_new=True):
    from ..source.models.mail import Mailbox
    mailbox = DBSession.query(Mailbox).get(mbox_id)
    Mailbox.do_import_content(mailbox, DBSession, only_new)
