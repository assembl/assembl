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

from sqlalchemy.orm import relationship, backref

from sqlalchemy import (
    Column,
    Integer,
    ForeignKey,
    String,
    Unicode,
    UnicodeText,
    DateTime,
    Boolean,
    or_,
    func,
)

from assembl.source.models.generic import Source, Content
from assembl.db import DBSession
from assembl.auth.models import EmailAccount


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
    username = Column(Unicode(1024), nullable=False)
    #Note:  If using STARTTLS, this should be set to false
    use_ssl = Column(Boolean, default=True)
    password = Column(Unicode(1024), nullable=False)
    folder = Column(Unicode(1024), default=u"INBOX", nullable=False)

    last_imported_email_uid = Column(Unicode(255))

    __mapper_args__ = {
        'polymorphic_identity': 'mailbox',
    }

    def import_content(self, only_new=True):
        if self.use_ssl:
            mailbox = IMAP4_SSL(host=self.host.encode('utf-8'), port=self.port)
        else:
            mailbox = IMAP4(host=self.host.encode('utf-8'), port=self.port)
        if 'STARTTLS' in mailbox.capabilities:
            #Always use starttls if server supports it
            mailbox.starttls()
        mailbox.login(self.username, self.password)
        mailbox.select(self.folder)

        command = "ALL"

        if only_new and self.last_imported_email_uid:
            command = "(UID %s:*)" % self.last_imported_email_uid
        
        search_status, search_result = mailbox.uid('search', None, command)

        email_ids = search_result[0].split()

        if only_new and self.last_imported_email_uid:
            # discard the first message, it should be the last imported email.
            del email_ids[0]
        
        def import_email(email_id):
            status, message_data = mailbox.uid('fetch', email_id, "(RFC822)")

            for response_part in message_data:
                if isinstance(response_part, tuple):
                    message_string = response_part[1]

            parsed_email = email.message_from_string(message_string)

            body = None

            def get_plain_text_payload(message):
                if message.is_multipart():
                    for part in message.walk():
                        if part.get_content_type() == 'text/plain':
                            return part.get_payload()
                else:
                    return message.get_payload()

            body = get_plain_text_payload(parsed_email)

            def email_header_to_unicode(header_string):
                decoded_header = decode_email_header(header_string);
                default_charset = 'ASCII'
                
                text = ''.join(
                    [ 
                        unicode(t[0], t[1] or default_charset) for t in \
                        decoded_header 
                    ]
                )

                return text

            new_message_id = parsed_email.get('Message-ID', None)
            if new_message_id: new_message_id = email_header_to_unicode(
                new_message_id
            )

            new_in_reply_to = parsed_email.get('In-Reply-To', None)
            if new_in_reply_to: new_in_reply_to = email_header_to_unicode(
                new_in_reply_to
            )

            sender = email_header_to_unicode(parsed_email.get('From'))
            sender_name, sender_email = parseaddr(sender)
            sender_email_account = EmailAccount.get_or_make_profile(DBSession, sender_email, sender_name)

            new_email = Email(
                recipients=email_header_to_unicode(parsed_email['To']),
                sender=sender,
                subject=email_header_to_unicode(parsed_email['Subject']),
                creation_date=datetime.utcfromtimestamp(
                    mktime(
                        email.utils.parsedate(
                            parsed_email['Date']
                        )
                    )
                ),
                message_id=new_message_id,
                in_reply_to=new_in_reply_to,
                body=body.strip().decode('ISO-8859-1'),
                full_message=str(parsed_email).decode('ISO-8859-1')
            )
            email.post.creator = sender_email_account.profile

            return new_email

        if len(email_ids):
            new_emails = [import_email(email_id) for email_id in email_ids]

            self.last_imported_email_uid = \
                email_ids[len(email_ids)-1]

            self.contents.extend(new_emails)

        # TODO: remove this line, the property `last_import` does not persist.
        self.last_import = datetime.utcnow()

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
                (most_common_addresses[address], address) for address in \
                most_common_addresses.keys()
            ], key=lambda pair: pair[0]
        )[-1][1]

        return most_common_address

    def email_most_common_recipient(
        self, 
        sender, 
        message_body,
        subject='[Assembl]', 
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

        recipients = self.most_common_recipient_address()

        message = MIMEMultipart('alternative')
        message['Subject'] = Header(subject, 'utf-8')
        message['From'] = sent_from

        message['To'] = recipients

        plain_text_body = message_body
        html_body = message_body

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

    # The send method will be a common interface on all sources.
    def send(self, sender, message, subject):
        self.email_most_common_recipient(sender, message, subject=subject)

    def serializable(self):
        serializable_source = super(Mailbox, self).serializable()

        serializable_source.update({
            "host": self.host,
            "port": self.port,
            "username": self.username,
            "use_ssl": self.use_ssl,
            "folder": self.folder,
            "most_common_recipient_address": \
                self.most_common_recipient_address()
        })

        return serializable_source

    def __repr__(self):
        return "<Mailbox %s>" % repr(self.name)


class Email(Content):
    """
    An Email refers to an email message that was imported from an Mailbox.
    """
    __tablename__ = "email"

    id = Column(Integer, ForeignKey(
        'content.id', 
        ondelete='CASCADE'
    ), primary_key=True)

    recipients = Column(Unicode(1024), nullable=False)
    sender = Column(Unicode(1024), nullable=False)
    subject = Column(Unicode(1024), nullable=False)
    body = Column(UnicodeText)

    full_message = Column(UnicodeText)

    message_id = Column(Unicode(255))
    in_reply_to = Column(Unicode(255))

    import_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    __mapper_args__ = {
        'polymorphic_identity': 'email',
    }

    def __init__(self, *args, **kwargs):
        super(Email, self).__init__(*args, **kwargs)
        self.associate_family()

    def associate_family(self):
        if self not in DBSession:
            DBSession.add(self)

        # if there is an email.in_reply_to, search posts with content.type
        # == email and email.message_id == email.in_reply_to, then set that
        # email's post's id as the parent of this new post.

        if self.in_reply_to:
            parent_email_message_id = {
                'original': self.in_reply_to,
                'cleaned': re.search(r'<(.*)>', self.in_reply_to).group(0)
            }

            parent_email = DBSession.query(Email).filter(
                or_(
                    Email.message_id==parent_email_message_id['original'],
                    Email.message_id==parent_email_message_id['cleaned']
                )
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
