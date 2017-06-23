import sys

from imaplib2 import IMAP4_SSL, IMAP4
import transaction

from assembl.models import ContentSource

from .source_reader import (
    ReaderStatus, SourceDispatcher, SourceReader,
    ReaderError, ClientError, IrrecoverableError)


def is_ok(response):
    return response[0] == 'OK'

class IMAPReader(SourceReader):
    """A :py:class:`assembl.tasks.source_reader.SourceReader` subclass for reading IMAP messages with imaplib2. Can wait for push."""

    def setup(self):
        super(IMAPReader, self).setup()
        self.selected_folder = False
        self.mailbox = None

    def login(self):
        try:
            if self.source.use_ssl:
                mailbox = IMAP4_SSL(host=self.source.host.encode('utf-8'), port=self.source.port)
            else:
                mailbox = IMAP4(host=self.source.host.encode('utf-8'), port=self.source.port)
            if 'STARTTLS' in mailbox.capabilities:
                #Always use starttls if server supports it
                res = mailbox.starttls()
                if not is_ok(res):
                    # TODO: Require bad login from client error
                    raise ReaderError(res)
            if 'IDLE' in mailbox.capabilities:
                self.can_push = True
            res = mailbox.login(self.source.username, self.source.password)
            if not is_ok(res):
                # TODO: Require bad login from client error
                raise ClientError(res)
            res = mailbox.select(self.source.folder)
            if not is_ok(res):
                # TODO: Require bad login from client error
                raise ClientError(res)
            self.selected_folder = True
            self.mailbox = mailbox
        except IMAP4.abort as e:
            raise IrrecoverableError(e)
        except IMAP4.error as e:
            raise ClientError(e)


    def wait_for_push(self):
        assert self.can_push
        try:
            res = self.mailbox.idle(int(self.max_idle_period.total_seconds()))
            if not is_ok(res):
                raise ClientError(res)
            # was it a timeout?
            res = self.mailbox.response('IDLE')
            if res and len(res) > 1 and len(res[1]) > 1 and res[1][1] == 'TIMEOUT':
                self.set_status(ReaderStatus.PAUSED)
                return
            if not self.is_connected():
                return
            if self.status == ReaderStatus.WAIT_FOR_PUSH:
                self.do_read()
            if self.is_connected():
                # am I still in IDLE state (WAIT_FOR_PUSH), or PAUSED?
                self.set_status(ReaderStatus.WAIT_FOR_PUSH)
        except IMAP4.abort as e:
            raise IrrecoverableError(e)
        except IMAP4.error as e:
            raise ClientError(e)

    def end_wait_for_push(self):
        # "DONE" encapsulated by imaplib2.. but not well
        self.mailbox._end_idle()
        super(IMAPReader, self).end_wait_for_push()

    def do_close(self):
        try:
            if self.selected_folder:
                res = self.mailbox.close()
                if not is_ok(res):
                    raise ClientError(res)
            if self.mailbox:
                res = self.mailbox.logout()
                if res[0] != 'BYE':
                    raise ClientError(res)
        except IMAP4.abort as e:
            raise IrrecoverableError(e)
        except IMAP4.error as e:
            raise ClientError(e)

    def import_email(self, email_id):
        mailbox = self.mailbox
        # print "running fetch for message: "+email_id
        try:
            status, message_data = mailbox.uid('fetch', email_id, "(RFC822)")
            if not is_ok((status,)):
                raise ClientError(message_data)

            # print repr(message_data)
            for response_part in message_data:
                if isinstance(response_part, tuple):
                    message_string = response_part[1]
            if not message_string:
                raise ClientError()
            try:
                if self.source.message_ok_to_import(message_string):
                    (email_object, dummy, error) = self.source.parse_email(message_string)
                    if error:
                        raise ReaderError(error)
                    self.source.db.add(email_object)
                else:
                    print "Skipped message with imap id %s (bounce or vacation message)" % (email_id)
                # print "Setting self.source.last_imported_email_uid to "+email_id
                self.source.last_imported_email_uid = email_id
                self.source.db.commit()
            finally:
                self.source = ContentSource.get(self.source.id)
        except IMAP4.abort as e:
            raise IrrecoverableError(e)
        except IMAP4.error as e:
            raise ClientError(e)

    def do_read(self):
        only_new = not self.reimporting
        try:
            self.set_status(ReaderStatus.READING)
            mailbox = self.mailbox
            command = "ALL"
            search_status = None

            email_ids = None
            if only_new and self.source.last_imported_email_uid:
                command = "(UID %s:*)" % self.source.last_imported_email_uid

                search_status, search_result = mailbox.uid('search', None, command)
                if not is_ok((search_status,)):
                    raise ReaderError(search_result)
                #print "UID searched with: "+ command + ", got result "+repr(search_status)+" and found "+repr(search_result)
                email_ids = search_result[0].split()
                #print email_ids

            if (only_new and search_status == 'OK' and email_ids
                    and email_ids[0] == self.source.last_imported_email_uid):
                # Note:  the email_ids[0]==self.source.last_imported_email_uid test is
                # necessary beacuse according to https://tools.ietf.org/html/rfc3501
                # seq-range like "3291:* includes the UID of the last message in
                # the mailbox, even if that value is less than 3291."

                # discard the first message, it should be the last imported email.
                del email_ids[0]
            else:
                # Either:
                # a) we don't import only new messages or
                # b) the message with self.source.last_imported_email_uid hasn't been found
                #    (may have been deleted)
                # In this case we request all messages and rely on duplicate
                # detection
                command = "ALL"
                search_status, search_result = mailbox.uid('search', None, command)
                if not is_ok((search_status,)):
                    raise ReaderError(search_result)
                #print "UID searched with: "+ command + ", got result "+repr(search_status)+" and found "+repr(search_result)
                email_ids = search_result[0].split()

            if len(email_ids):
                print "Processing messages from IMAP: %d "% (len(email_ids))
                for email_id in email_ids:
                    self.import_email(email_id)
                    if self.status != ReaderStatus.READING:
                        break
            else:
                print "No IMAP messages to process"
            self.successful_read()
            self.set_status(ReaderStatus.PAUSED)
        except IMAP4.abort as e:
            raise IrrecoverableError(e)
        except IMAP4.error as e:
            raise ClientError(e)
