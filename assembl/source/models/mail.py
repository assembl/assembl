# coding=UTF-8
import email
import re
import smtplib
from cgi import escape as html_escape
from collections import defaultdict

from email.header import decode_header as decode_email_header, Header
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import parseaddr
import jwzthreading

from bs4 import BeautifulSoup, Comment

from pyramid.threadlocal import get_current_registry

from datetime import datetime
from time import mktime
from imaplib2 import IMAP4_SSL, IMAP4
import transaction

from sqlalchemy.orm import relationship, backref, deferred
from sqlalchemy.orm import joinedload_all
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

from assembl.source.models.generic import PostSource, Content
from assembl.source.models.post import ImportedPost
from assembl.auth.models import EmailAccount
from assembl.tasks.imap import import_mails
from assembl.lib.sqla import mark_changed


class Mailbox(PostSource):
    """
    A Mailbox refers to an Email inbox that can be accessed with IMAP, and
    whose messages should be imported and displayed as Posts.
    """
    __tablename__ = "mailbox"
    id = Column(Integer, ForeignKey(
        'post_source.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
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

    VALID_TAGS = ['strong', 'em', 'p', 'ul', 'li', 'br']

    @staticmethod
    def sanitize_html(html_value, valid_tags=VALID_TAGS):
        soup = BeautifulSoup(html_value)
        comments = soup.findAll(text=lambda text:isinstance(text, Comment))
        [comment.extract() for comment in comments]
        for tag in soup.find_all(True):
            if tag.name not in valid_tags:
                tag.hidden = True

        return soup.decode_contents()

    @staticmethod
    def body_as_html(text_value):
        text_value = html_escape(text_value)
        text_value = text_value.replace("\r", '').replace("\n", "<br />")
        return text_value


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
            if html_part:
                return self.sanitize_html(html_part)
            elif text_part:
                return self.body_as_html(text_part)
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
        sender_email_account = EmailAccount.get_or_make_profile(self.db, sender_email, sender_name)
        creation_date = datetime.utcfromtimestamp(
            mktime(email.utils.parsedate(parsed_email['Date'])))
        subject = email_header_to_unicode(parsed_email['Subject'])
        recipients = email_header_to_unicode(parsed_email['To'])
        body = body.strip()
        # Try/except for a normal situation is an antipattern,
        # but sqlalchemy doesn't have a function that returns
        # 0, 1 result or an exception
        try:
            email_object = self.db.query(Email).filter(
                Email.message_id == new_message_id,
                Email.discussion_id == self.discussion_id,
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
                discussion_id=self.discussion_id,
                recipients=recipients,
                sender=sender,
                subject=subject,
                creation_date=creation_date,
                message_id=new_message_id,
                in_reply_to=new_in_reply_to,
                body=body,
                full_message=message_string
            )
        email_object.creator = sender_email_account.profile
        email_object.source = self
        email_object = self.db.merge(email_object)
        return (email_object, parsed_email)
        
    """
    emails have to be a complete set
    """
    @staticmethod
    def thread_mails(emails):
        print('Threading...')
        emails_for_threading = []
        for mail in emails:
            email_for_threading = jwzthreading.make_message(email.message_from_string(mail.full_message))
            #Store our emailsubject, jwzthreading does not decode subject itself
            email_for_threading.subject = mail.subject
            #Store our email object pointer instead of the raw message text
            email_for_threading.message = mail
            emails_for_threading.append(email_for_threading)

        threaded_emails = jwzthreading.thread(emails_for_threading)

        # Output
        L = threaded_emails.items()
        L.sort()
        for subj, container in L:
            jwzthreading.print_container(container, 0, True)
            
        def update_threading(threaded_emails, parent=None, debug=False):
            if debug:
                print "\n\nEntering update_threading() for %s mails:" % len(threaded_emails)
            for container in threaded_emails:
                if debug:
                    #jwzthreading.print_container(container)
                    print("\nProcessing:  " + repr(container.message.subject) + " " + repr(container.message.message_id)+ " " + repr(container.message.message.id))
                    print "container: " + (repr(container))
                    print "parent: " + repr(container.parent)
                    print "children: " + repr(container.children)

                

                if(container.message):
                    current_parent = container.message.message.parent
                    if(current_parent):
                        db_parent_message_id = current_parent.message_id
                    else:
                        db_parent_message_id = None

                    if parent:
                        if parent.message:
                            #jwzthreading strips the <>, re-add them
                            algorithm_parent_message_id = unicode("<"+parent.message.message_id+">")
                        else:
                            if debug:
                                print "Parent was a dummy container, we may need \
                                     to handle this case better, as we just \
                                     potentially lost sibbling relationships"
                            algorithm_parent_message_id = None
                    else:
                        algorithm_parent_message_id = None
                    if debug:
                        print("Current parent from database: " + repr(db_parent_message_id))
                        print("Current parent from algorithm: " + repr(algorithm_parent_message_id))
                        print("References: " + repr(container.message.references))
                    if algorithm_parent_message_id != db_parent_message_id:
                        if current_parent == None or isinstance(current_parent, Email):
                            if debug:
                                print("UPDATING PARENT for :" + repr(container.message.message.message_id))
                            new_parent = parent.message.message if algorithm_parent_message_id else None
                            if debug:
                                print repr(new_parent)
                            container.message.message.set_parent(new_parent)
                        else:
                            if debug:
                                print "Skipped reparenting:  the current parent \
                                isn't an email, the threading algorithm only \
                                considers mails"
                    update_threading(container.children, container, debug=debug)
                else:
                    if debug: 
                        print "Current message ID: None, was a dummy container"
                    update_threading(container.children, parent, debug=debug)
                
        update_threading(threaded_emails.values(), debug=False)

    def reprocess_content(self):
        """ Allows re-parsing all content as if it were imported for the first time
            but without re-hitting the source, or changing the object ids.
            Call when a code change would change the representation in the database
            """
        emails = self.db.query(Email).filter(
                Email.source_id == self.id,
                ).options(joinedload_all(Email.parent))
        session = self.db
        for email in emails:
            #session = Email.db
            #session.add(email)
            (email_object, _) = self.parse_email(email.full_message, email)
            #session.add(email_object)
            session.commit()
            #session.remove()

        self.thread_mails(emails)
        
    def import_content(self, only_new=True):
        #Mailbox.do_import_content(self, only_new)
        import_mails.delay(self.id, only_new)

    @staticmethod
    def do_import_content(mbox, only_new=True):
        mbox = mbox.db.merge(mbox)
        mbox.db.add(mbox)
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
            session = mailbox_obj.db()
            status, message_data = mailbox.uid('fetch', email_id, "(RFC822)")
            for response_part in message_data:
                if isinstance(response_part, tuple):
                    message_string = response_part[1]

            (email_object, _) = mailbox_obj.parse_email(message_string)
            session.add(email_object)
            transaction.commit()
            mailbox_obj = Mailbox.get(id=mailbox_obj.id)

        if len(email_ids):
            new_emails = [import_email(mbox, email_id) for email_id in email_ids]

            mbox.last_imported_email_uid = \
                email_ids[len(email_ids)-1]

        discussion_id = mbox.discussion_id
        mailbox.close()
        mailbox.logout()
        mark_changed()
        transaction.commit()

        with transaction.manager:
            if len(email_ids):
                #We imported mails, we need to re-thread
                emails = Email.db().query(Email).filter(
                    Email.discussion_id == discussion_id,
                    ).options(joinedload_all(Email.parent))

                Mailbox.thread_mails(emails)
                mark_changed()

    _address_match_re = re.compile(
        r'[\w\-][\w\-\.]+@[\w\-][\w\-\.]+[a-zA-Z]{1,4}'
    )

    def most_common_recipient_address(self):
        """
        Find the most common recipient address of the contents of this emaila
        address. This address can, in most use-cases can be considered the
        mailing list address.
        """

        recipients = self.db.query(
            Email.recipients,
        ).filter(
            Email.source_id == self.id,
        )

        addresses = defaultdict(int)

        for (recipients, ) in recipients:
            for address in self._address_match_re.findall(recipients):
                addresses[address] += 1

        if addresses:
            addresses = addresses.items()
            addresses.sort(key=lambda (address, count): count)
            return addresses[-1][0]

    def get_send_address(self):
        """
        Get the email address to send a message to the discussion
        """
        return self.most_common_recipient_address()

    def send_post(self, post):
        #TODO benoitg
        print "TODO: Mail::send_post():  Actually queue message"
        #self.send_mail(sender=post.creator, message_body=post.body, subject=post.subject)
        
    def send_mail(
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


class Email(ImportedPost):
    """
    An Email refers to an email message that was imported from an Mailbox.
    """
    __tablename__ = "email"

    id = Column(Integer, ForeignKey(
        'imported_post.id',
        ondelete='CASCADE',
        onupdate='CASCADE'
    ), primary_key=True)

    # in virtuoso, varchar is 1024 bytes and sizeof(wchar)==4, so varchar is 256 chars
    recipients = deferred(Column(UnicodeText, nullable=False), group='raw_details')
    sender = deferred(Column(Unicode(), nullable=False), group='raw_details')

    full_message = deferred(Column(Binary), group='raw_details')

    in_reply_to = Column(Unicode())

    __mapper_args__ = {
        'polymorphic_identity': 'email',
    }

    def __init__(self, *args, **kwargs):
        super(Email, self).__init__(*args, **kwargs)

    def REWRITEMEreply(self, sender, response_body):
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
            #"sender": self.sender,
            #"creator": self.creator.serializable(),
            "recipients": self.recipients,
        })

        return serializable_content

    def __repr__(self):
        return "<Email '%s to %s'>" % (
            self.sender.encode('utf-8'),
            self.recipients.encode('utf-8')
        )

    def get_body(self):
        return self.body

    def get_title(self):
        return self.subject
