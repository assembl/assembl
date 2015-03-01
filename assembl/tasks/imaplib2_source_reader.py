import sys

from imaplib2 import IMAP4_SSL, IMAP4

from .source_reader import (
    ReaderStatus, SourceDispatcher, SourceReader,
    ReaderError, ClientError, IrrecoverableError)


def is_ok(response):
    return response[0] == 'OK'

class IMAPReader(SourceReader):

    def login(self):
        if self.source.use_ssl:
            mailbox = IMAP4_SSL(host=self.source.host.encode('utf-8'), port=self.source.port)
        else:
            mailbox = IMAP4(host=self.source.host.encode('utf-8'), port=self.source.port)
        if 'STARTTLS' in mailbox.capabilities:
            #Always use starttls if server supports it
            res = mailbox.starttls()
            if not is_ok(res):
                # TODO: Require bad login from client error
                raise ClientError(res)
        # if 'IDLE' in capabilities:
        #     self.can_push = True
        res = mailbox.login(self.source.username, self.source.password)
        if not is_ok(res):
            # TODO: Require bad login from client error
            raise ClientError(res)
        res = mailbox.select(self.source.folder)
        if not is_ok(res):
            # TODO: Require bad login from client error
            raise ClientError(res)
        self.mailbox = mailbox


    def wait_for_push(self):
        pass

    def end_wait_for_push(self):
        pass

    def do_close(self):
        res = self.mailbox.close()
        if not is_ok(res):
            raise ClientError(res)
        res = self.mailbox.logout()
        if not is_ok(res):
            raise ClientError(res)


    def read(self, only_new=True):
        self.set_status(ReaderStatus.READING)
        mailbox = self.mailbox
        command = "ALL"
        search_status = None

        email_ids = None
        if only_new and self.source.last_imported_email_uid:
            command = "(UID %s:*)" % self.source.last_imported_email_uid

            search_status, search_result = mailbox.uid('search', None, command)
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
            #print "UID searched with: "+ command + ", got result "+repr(search_status)+" and found "+repr(search_result)
            assert search_status == 'OK'
            email_ids = search_result[0].split()

        def import_email(mailbox_obj, email_id):
            session = mailbox_obj.db()
            #print "running fetch for message: "+email_id
            status, message_data = mailbox.uid('fetch', email_id, "(RFC822)")
            assert status == 'OK'
                
            #print repr(message_data)
            for response_part in message_data:
                if isinstance(response_part, tuple):
                    message_string = response_part[1]
            assert message_string
            if mailbox_obj.message_ok_to_import(message_string):
                (email_object, dummy, error) = mailbox_obj.parse_email(message_string)
                if error:
                    raise Exception(error)
                session.add(email_object)
            else:
                print "Skipped message with imap id %s (bounce or vacation message)"% (email_id)
            #print "Setting mailbox_obj.last_imported_email_uid to "+email_id
            mailbox_obj.last_imported_email_uid = email_id
            mailbox_obj = AbstractMailbox.get(mailbox_obj.id)

        if len(email_ids):
            print "Processing messages from IMAP: %d "% (len(email_ids))
            new_emails = [import_email(self.source, email_id) for email_id in email_ids]
        else:
            print "No IMAP messages to process"

