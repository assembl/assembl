import email
from email.header import decode_header as decode_email_header
from datetime import datetime
from time import mktime
from imaplib import IMAP4_SSL, IMAP4

from sqlalchemy.orm import relationship, backref, aliased
from sqlalchemy.sql import func, cast, select

from sqlalchemy import (
    Column, 
    Boolean,
    Integer, 
    String, 
    Text,
    Unicode, 
    UnicodeText, 
    DateTime,
    ForeignKey,
    desc
)

from ..db import DBSession
from ..db.models import SQLAlchemyBaseModel



class Source(SQLAlchemyBaseModel):
    """
    A Discussion Source is where commentary that is handled in the form of
    Assembl posts comes from. 

    A discussion source should have a method for importing all content, as well
    as only importing new content. Maybe the standard interface for this should
    be `source.import()`.
    """
    __tablename__ = "source"

    id = Column(Integer, primary_key=True)
    name = Column(Unicode(60), nullable=False)
    type = Column(String(60), nullable=False)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    last_import = Column(DateTime)

    discussion_id = Column(Integer, ForeignKey(
        'discussion.id', 
        ondelete='CASCADE'
    ))

    discussion = relationship(
        "Discussion", 
        backref=backref('sources', order_by=creation_date)
    )

    __mapper_args__ = {
        'polymorphic_identity': 'source',
        'polymorphic_on': type
    }

    def __repr__(self):
        return "<Source '%s'>" % self.name


class Content(SQLAlchemyBaseModel):
    """
    Content is a polymorphic class to describe what is imported from a Source.
    """
    __tablename__ = "content"

    id = Column(Integer, primary_key=True)
    type = Column(String(60), nullable=False)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    
    import_date = Column(DateTime, default=datetime.utcnow)

    source_id = Column(Integer, ForeignKey('source.id', ondelete='CASCADE'))
    source = relationship(
        "Source",
        backref=backref('contents', order_by=import_date)
    )

    post = relationship("Post", uselist=False)

    __mapper_args__ = {
        'polymorphic_identity': 'content',
        'polymorphic_on': 'type'
    }

    def __init__(self, *args, **kwargs):
        super(Content, self).__init__(*args, **kwargs)
        self.post = self.post or Post(content=self)

    def __repr__(self):
        return "<Content '%s'>" % self.type


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

    host = Column(Unicode(1024), nullable=False)
    port = Column(Integer, nullable=False)
    username = Column(Unicode(1024), nullable=False)
    use_ssl = Column(Boolean, default=True)
    password = Column(Unicode(1024), nullable=False)
    mailbox = Column(Unicode(1024), default=u"INBOX", nullable=False)

    last_imported_email_uid = Column(Unicode(255))

    __mapper_args__ = {
        'polymorphic_identity': 'mailbox',
    }

    def import_content(self, only_new=True):
        if self.use_ssl:
            mailbox = IMAP4_SSL(host=self.host, port=self.port)
        else:
            mailbox = IMAP4(host=self.host, port=self.port)

        mailbox.login(self.username, self.password)
        mailbox.select(self.mailbox)

        command = "ALL"

        if only_new and self.last_imported_email_uid:
            command = "(UID %s:*)" % self.last_imported_email_uid
        
        search_status, search_result = mailbox.uid('search', None, command)

        email_ids = search_result[0].split()

        if only_new:
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

            new_email = Email(
                to_address=email_header_to_unicode(parsed_email['To']),
                from_address=email_header_to_unicode(parsed_email['From']),
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

            return new_email

        if len(email_ids):
            new_emails = [import_email(email_id) for email_id in email_ids]

            self.last_imported_email_uid = \
                email_ids[len(email_ids)-1]

            self.contents.extend(new_emails)

        self.last_import = datetime.utcnow()

    def __repr__(self):
        return "<Mailbox '%s'>" % self.name


class Email(Content):
    """
    An Email refers to an email message that was imported from an Mailbox.
    """
    __tablename__ = "email"

    id = Column(Integer, ForeignKey(
        'content.id', 
        ondelete='CASCADE'
    ), primary_key=True)

    to_address = Column(Unicode(1024), nullable=False)
    from_address = Column(Unicode(1024), nullable=False)
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
            parent_email = DBSession.query(Email).filter_by(
                message_id=self.in_reply_to,
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

    def __repr__(self):
        return "<Email '%s to %s'>" % (
            self.from_address.encode('utf-8'), 
            self.to_address.encode('utf-8')
        )


class Post(SQLAlchemyBaseModel):
    """
    A Post represents input into the broader discussion taking place on
    Assembl. It may be a response to another post, it may have responses, and
    its content may be of any type.
    """
    __tablename__ = "post"

    id = Column(Integer, primary_key=True)
    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)

    ancestry = Column(Text, default="")

    content_id = Column(Integer, ForeignKey('content.id', ondelete='CASCADE'))
    content = relationship('Content', uselist=False)

    parent_id = Column(Integer, ForeignKey('post.id'))
    children = relationship(
        "Post",
        backref=backref('parent', remote_side=[id])
    )

    def get_descendants(self):
        ancestry_query_string = "%s%d,%%" % (self.ancestry or '', self.id)

        descendants = DBSession.query(Post).join(Content).filter(
            Post.ancestry.like(ancestry_query_string)
        ).order_by(Content.creation_date).all()

        return descendants

    def set_ancestry(self, new_ancestry):
        descendants = self.get_descendants()
        old_ancestry = self.ancestry or ''
        self.ancestry = new_ancestry
        DBSession.add(self)

        for descendant in descendants:
            updated_ancestry = descendant.ancestry.replace(
                "%s%d," % (old_ancestry, self.id),
                "%s%d," % (new_ancestry, self.id),
                1
            )

            descendant.ancestry = updated_ancestry
            DBSession.add(descendant)
            
    def set_parent(self, parent):
        self.parent = parent
        DBSession.add(self)
        DBSession.add(parent)

        self.set_ancestry("%s%d," % (
            parent.ancestry or '',
            parent.id
        ))

    def number_of_unread_descendants(self):
        ancestry_query_string = "%s%d,%%" % (self.ancestry or '', self.id)
        return DBSession.query(Post).filter(
                Post.ancestry.like(ancestry_query_string)
            ).filter_by(
                is_read=False
            ).count()

    def responses(self, limit=15, offset=None):
        lower_post = aliased(Post, name="lower_post")
        lower_content = aliased(Content, name="lower_content")
        upper_post = aliased(Post, name="upper_post")

        latest_response = select([
            func.max(Content.creation_date).label('last_update'),
        ], lower_post.content_id==lower_content.id).where(
            lower_post.ancestry.like(
                upper_post.ancestry + cast(upper_post.id, String) + ',%'
            )
        ).label("latest_response")

        query = DBSession.query(
            upper_post,
        ).join(
            Content,
        ).filter(
            upper_post.parent_id==self.id
        ).order_by(
            desc(latest_response),
            Content.creation_date.desc()
        )

        if limit:
            query = query.limit(limit)

        if offset:
            query = query.offset(offset)

        return query.all()

    def __repr__(self):
        return "<Post '%s %s' >" % (
            self.content.type,
            self.content.id,
        )
