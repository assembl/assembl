from . import app, init

@app.task
def import_mails(mbox_id, only_new=True):
    init()
    from ..models import Mailbox
    mailbox = Mailbox.get(id=mbox_id)
    Mailbox.do_import_content(mailbox, only_new)
