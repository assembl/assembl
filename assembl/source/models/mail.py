# coding=UTF-8
import email
import re
import smtplib

from email.header import decode_header as decode_email_header, Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import parseaddr

from pyramid.threadlocal import get_current_registry

from datetime import datetime
from time import mktime
from imaplib2 import IMAP4_SSL, IMAP4
import transaction

from sqlalchemy.orm import relationship, backref, deferred
from sqlalchemy.orm.exc import NoResultFound
from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    String,
    Unicode,
    Binary,
    UnicodeText,
    DateTime,
    Boolean,
    or_,
    func,
)

from assembl.source.models.generic import Source, Content
from assembl.db import DBSession
from assembl.auth.models import EmailAccount
from assembl.tasks.imap import import_mails

class Mailbox(Source):
    """
    A Mailbox refers to an Email inbox that can be accessed with IMAP, and
    whose messages should be imported and displayed as Posts.
    """
    __tablename__ = "mailbox"
    id = Column(Integer, ForeignKey(
        'source.id',
        ondelete='CASCADE'
    ), primary_key=True)

    host = Column(String(1024), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(UnicodeText, nullable=False)
    #Note:  If using STARTTLS, this should be set to false
    use_ssl = Column(Boolean, default=True)
    password = Column(UnicodeText, nullable=False)
    folder = Column(UnicodeText, default=u"INBOX", nullable=False)

    last_imported_email_uid = Column(UnicodeText)
    subject_mangling_regex = Column(UnicodeText, nullable=True)
    subject_mangling_replacement = Column(UnicodeText, nullable=True)
    __compiled_subject_mangling_regex = None

    def _compile_subject_mangling_regex(self):
        if(self.subject_mangling_regex):
            self.__compiled_subject_mangling_regex =\
                re.compile(self.subject_mangling_regex)
        else:
            self.__compiled_subject_mangling_regex = None

    __mapper_args__ = {
        'polymorphic_identity': 'mailbox',
    }

    def mangle_mail_subject(self, subject):
        if self.__compiled_subject_mangling_regex is None:
            self._compile_subject_mangling_regex()

        if self.__compiled_subject_mangling_regex:
            if self.subject_mangling_replacement:
                repl = self.subject_mangling_replacement
            else:
                repl = ''
            (retval, num) =\
                self.__compiled_subject_mangling_regex.subn(repl, subject)
            return retval
        else:
            return subject

    def parse_email(self, message_string, existing_email=None):
        parsed_email = email.message_from_string(message_string)
        body = None

        def get_plain_text_payload(message):
            """ Returns the first text/plain body as a unicode object, falling back to text/html body """

            def process_part(part, default_charset, text_part, html_part):
                if part.is_multipart():
                    for part in part.get_payload():
                        charset = part.get_content_charset(default_charset)
                        (text_part, html_part) = process_part(
                            part, charset, text_part, html_part)
                else:
                    charset = part.get_content_charset(default_charset)
                    decoded_part = part.get_payload(decode=True)
                    decoded_part = decoded_part.decode(charset, 'replace')
                    if part.get_content_type() == 'text/plain' and text_part is None:
                        text_part = decoded_part
                    elif part.get_content_type() == 'text/html' and html_part is None:
                        html_part = decoded_part
                return (text_part, html_part)

            html_part = None
            text_part = None
            default_charset = message.get_charset() or 'ISO-8859-1'
            (text_part, html_part) = process_part(message, default_charset, text_part, html_part)

            if text_part:
                return text_part
            elif html_part:
                return html_part
            else:
                return u"Sorry, no assembl-supported mime type found in message parts"

        body = get_plain_text_payload(parsed_email)

        def email_header_to_unicode(header_string):
            decoded_header = decode_email_header(header_string)
            default_charset = 'ASCII'

            text = ''.join(
                [
                    unicode(t[0], t[1] or default_charset) for t in
                    decoded_header
                ]
            )

            return text

        new_message_id = parsed_email.get('Message-ID', None)
        if new_message_id:
            new_message_id = email_header_to_unicode(
                new_message_id)

        new_in_reply_to = parsed_email.get('In-Reply-To', None)
        if new_in_reply_to:
            new_in_reply_to = email_header_to_unicode(
                new_in_reply_to)

        sender = email_header_to_unicode(parsed_email.get('From'))
        sender_name, sender_email = parseaddr(sender)
        sender_email_account = EmailAccount.get_or_make_profile(DBSession, sender_email, sender_name)
        creation_date = datetime.utcfromtimestamp(
            mktime(email.utils.parsedate(parsed_email['Date'])))
        subject = email_header_to_unicode(parsed_email['Subject'])
        recipients = email_header_to_unicode(parsed_email['To'])
        body = body.strip()
        # Try/except for a normal situation is an antipattern,
        # but sqlalchemy doesn't have a function that returns
        # 0, 1 result or an exception
        try:
            email_object = DBSession.query(Email).filter(
                Email.message_id == new_message_id,
                Email.source_id == self.id,
            ).one()
            if existing_email and existing_email != email_object:
                raise ValueError("The existing object isn't the same as the one found by message id")
            email_object.recipients = recipients
            email_object.sender = sender
            email_object.subject = subject
            email_object.creation_date = creation_date
            email_object.message_id = new_message_id
            email_object.in_reply_to = new_in_reply_to
            email_object.body = body
            email_object.full_message = message_string
        except NoResultFound:
            email_object = Email(
                recipients=recipients,
                sender=sender,
                subject=subject,
                creation_date=creation_date,
                message_id=new_message_id,
                in_reply_to=new_in_reply_to,
                body=body,
                full_message=message_string
            )
        email_object.post.creator = sender_email_account.profile
        email_object.associate_family()
        email_object.source_id = self.id
        return email_object

    @staticmethod
    def reprocess_content(mailbox, dbsession=DBSession):
        """ Allows re-parsing all content as if it were imported for the first time
            but without re-hitting the source, or changing the object ids.
            Call when a code change would change the representation in the database
            """
        emails = dbsession.query(Email).filter(
            Email.source_id == mailbox.id)
        for email in emails:
            session = dbsession()
            email_object = mailbox.parse_email(email.full_message, email)
            dbsession.add(email_object)
            transaction.commit()
            dbsession.remove()
            mailbox = session.get(Mailbox).get(mailbox.id)


    def import_content(self, only_new=True):
        #Mailbox.do_import_content(self, only_new)
        import_mails.delay(self.id, only_new)

    @staticmethod
    def do_import_content(mbox, only_new=True, dbsession=DBSession):
        if mbox.use_ssl:
            mailbox = IMAP4_SSL(host=mbox.host.encode('utf-8'), port=mbox.port)
        else:
            mailbox = IMAP4(host=mbox.host.encode('utf-8'), port=mbox.port)
        if 'STARTTLS' in mailbox.capabilities:
            #Always use starttls if server supports it
            mailbox.starttls()
        mailbox.login(mbox.username, mbox.password)
        mailbox.select(mbox.folder)

        command = "ALL"

        if only_new and mbox.last_imported_email_uid:
            command = "(UID %s:*)" % mbox.last_imported_email_uid

        search_status, search_result = mailbox.uid('search', None, command)

        email_ids = search_result[0].split()

        if only_new and mbox.last_imported_email_uid:
            # discard the first message, it should be the last imported email.
            del email_ids[0]

        def import_email(mailbox_obj, email_id):
            session = dbsession()
            mailbox_obj = session.merge(mailbox_obj)
            status, message_data = mailbox.uid('fetch', email_id, "(RFC822)")
            for response_part in message_data:
                if isinstance(response_part, tuple):
                    message_string = response_part[1]

            email_object = mailbox.parse_email(message_string)
            dbsession.add(email_object)
            transaction.commit()
            dbsession.remove()
            mailbox = session.get(Mailbox).get(mailbox.id)

        if len(email_ids):
            new_emails = [import_email(mbox, email_id) for email_id in email_ids]

            session = dbsession()
            mbox = session.query(Mailbox).get(mbox.id)
            mbox.last_imported_email_uid = \
                email_ids[len(email_ids)-1]

        # TODO: remove this line, the property `last_import` does not persist.
        mbox.last_import = datetime.utcnow()

        mailbox.close()
        mailbox.logout()

    def most_common_recipient_address(self):
        """
        Find the most common recipient address of the contents of this emaila
        address. This address can, in most use-cases can be considered the
        mailing list address.
        """

        most_common_recipients = DBSession.query(
            func.count(
                Email.recipients
            ),
            Email.recipients,
        ).filter(
            Email.source_id == self.id,
        ).group_by(Email.recipients)

        most_common_addresses = {}

        for frequency, recipients in most_common_recipients[:50]:
            address_match = re.compile(
                r'[\w\-][\w\-\.]+@[\w\-][\w\-\.]+[a-zA-Z]{1,4}'
            )

            for recipient_address in address_match.findall(recipients):
                if recipient_address in most_common_addresses.keys():
                    most_common_addresses[
                        recipient_address
                    ] += int(frequency)

                else:
                    most_common_addresses[recipient_address] = int(frequency)

        most_common_address = sorted(
            [
                (most_common_addresses[address], address) for address in
                most_common_addresses.keys()
            ], key=lambda pair: pair[0]
        )[-1][1]

        return most_common_address

    def get_send_address(self):
        """
        Get the email address to send a message to the discussion
        """
        return self.most_common_recipient_address()

    # The send method will be a common interface on all sources.
    def send(
        self,
        sender,
        message_body,
        html_body=None,
        subject='[Assembl]'
    ):
        """
        Send an email from the given sender to the most common recipient in
        emails from this mailbox.
        """

        sent_from = ' '.join([
            "%(sender_name)s on Assembl" % {
                "sender_name": sender.display_name()
            },
            "<%(sender_email)s>" % {
                "sender_email": sender.get_preferred_email(),
            }
        ])

        if type(message_body) == 'str':
            message_body = message_body.decode('utf-8')

        recipients = self.get_send_address()

        message = MIMEMultipart('alternative')
        message['Subject'] = Header(subject, 'utf-8')
        message['From'] = sent_from

        message['To'] = recipients

        plain_text_body = message_body
        html_body = html_body or message_body

        # TODO: The plain text and html parts of the email should be different,
        # but we'll see what we can get from the front-end.

        plain_text_part = MIMEText(
            plain_text_body.encode('utf-8'),
            'plain',
            'utf-8'
        )

        html_part = MIMEText(
            html_body.encode('utf-8'),
            'html',
            'utf-8'
        )

        message.attach(plain_text_part)
        message.attach(html_part)

        smtp_connection = smtplib.SMTP(
            get_current_registry().settings['mail.host']
        )

        smtp_connection.sendmail(
            sent_from,
            recipients,
            message.as_string()
        )

        smtp_connection.quit()

    def serializable(self):
        serializable_source = super(Mailbox, self).serializable()

        serializable_source.update({
            "host": self.host,
            "port": self.port,
            "username": self.username,
            "use_ssl": self.use_ssl,
            "folder": self.folder,
            "most_common_recipient_address":
            self.most_common_recipient_address()
        })

        return serializable_source

    def __repr__(self):
        return "<Mailbox %s>" % repr(self.name)


class MailingList(Mailbox):
    """
    A mailbox with mailing list semantics
    (single post address, subjetc mangling, etc.)
    """
    __tablename__ = "source_mailinglist"
    id = Column(Integer, ForeignKey(
        'mailbox.id',
        ondelete='CASCADE'
    ), primary_key=True)

    post_email_address = Column(UnicodeText, nullable=True)

    __mapper_args__ = {
        'polymorphic_identity': 'source_mailinglist',
    }

    def get_send_address(self):
        """
        Get the email address to send a message to the discussion
        """
        return self.post_email()


class Email(Content):
    """
    An Email refers to an email message that was imported from an Mailbox.
    """
    __tablename__ = "email"

    id = Column(Integer, ForeignKey(
        'content.id',
        ondelete='CASCADE'
    ), primary_key=True)

    # in virtuoso, varchar is 1024 bytes and sizeof(wchar)==4, so varchar is 256 chars
    recipients = deferred(Column(UnicodeText, nullable=False), group='raw_details')
    sender = deferred(Column(Unicode(), nullable=False), group='raw_details')
    subject = Column(Unicode(), nullable=False)
    body = Column(UnicodeText)

    full_message = deferred(Column(Binary), group='raw_details')

    message_id = Column(Unicode())
    in_reply_to = Column(Unicode())

    import_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    __mapper_args__ = {
        'polymorphic_identity': 'email',
    }

    def __init__(self, *args, **kwargs):
        super(Email, self).__init__(*args, **kwargs)
        if self.subject.startswith('[synthesis]'):
            self.post.is_synthesis = True

    def associate_family(self):
        if self not in DBSession:
            DBSession.add(self)

        # if there is an email.in_reply_to, search posts with content.type
        # == email and email.message_id == email.in_reply_to, then set that
        # email's post's id as the parent of this new post.

        if self.in_reply_to:
            parent_email_message_id = {
                'original': self.in_reply_to,
                'cleaned': re.search(r'<(.*)>', self.in_reply_to).group(0) if
                re.search(r'<(.*)>', self.in_reply_to) else None
            }

            filter_clause = or_(
                Email.message_id == parent_email_message_id['original'],
                Email.message_id == parent_email_message_id['cleaned']
            ) if parent_email_message_id['cleaned'] else \
                Email.message_id == parent_email_message_id['original']

            parent_email = DBSession.query(Email).filter(
                filter_clause
            ).first()

            if parent_email:
                self.post.set_parent(parent_email.post)

        # search for emails where the in_reply_to is the same as the
        # message_id for this email, then set their post's parent to the
        # id of this new post.

        child_emails = DBSession.query(Email).filter_by(
            in_reply_to=self.message_id
        ).all()

        for child_email in child_emails:
            child_email.post.set_parent(self.post)

    def reply(self, sender, response_body):
        """
        Send a response to this email.

        `sender` is a user instance.
        `response` is a string.
        """

        sent_from = ' '.join([
            "%(sender_name)s on Assembl" % {
                "sender_name": sender.display_name()
            },
            "<%(sender_email)s>" % {
                "sender_email": sender.get_preferred_email(),
            }
        ])

        if type(response_body) == 'str':
            response_body = response_body.decode('utf-8')

        recipients = self.recipients

        message = MIMEMultipart('alternative')
        message['Subject'] = Header(self.subject, 'utf-8')
        message['From'] = sent_from

        message['To'] = self.recipients
        message.add_header('In-Reply-To', self.message_id)

        plain_text_body = response_body
        html_body = response_body

        # TODO: The plain text and html parts of the email should be different,
        # but we'll see what we can get from the front-end.

        plain_text_part = MIMEText(
            plain_text_body.encode('utf-8'),
            'plain',
            'utf-8'
        )

        html_part = MIMEText(
            html_body.encode('utf-8'),
            'html',
            'utf-8'
        )

        message.attach(plain_text_part)
        message.attach(html_part)

        smtp_connection = smtplib.SMTP(
            get_current_registry().settings['mail.host']
        )

        smtp_connection.sendmail(
            sent_from,
            recipients,
            message.as_string()
        )

        smtp_connection.quit()

    def serializable(self):
        serializable_content = super(Email, self).serializable()

        serializable_content.update({
            "sender": self.sender,
            "sender_profile": self.post.creator.serializable(),
            "recipients": self.recipients,
            "subject": self.subject,
            "body": self.body,
        })

        return serializable_content

    def __repr__(self):
        return "<Email '%s to %s'>" % (
            self.sender.encode('utf-8'),
            self.recipients.encode('utf-8')
        )
