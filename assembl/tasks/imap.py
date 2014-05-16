from . import app, init

@app.task
def import_mails(mbox_id, only_new=True):
    init()
    from ..models import IMAPMailbox
    mailbox = IMAPMailbox.get(id=mbox_id)
    IMAPMailbox.do_import_content(mailbox, only_new)
