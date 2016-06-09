"""attachments from youtube inspiration

Revision ID: 06a588c53002
Revises: c32105f857f2
Create Date: 2016-06-09 16:20:02.204522

"""

# revision identifiers, used by Alembic.
revision = '06a588c53002'
down_revision = 'c32105f857f2'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
        pass

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        posts = db.query(m.WidgetPost
            ).options(sa.orm.joinedload(m.WidgetPost.attachments)
            ).filter(m.WidgetPost.metadata_raw.like('%://www.youtube.com/%')
            ).all()
        for post in posts:
            url = post.metadata_json.get("inspiration_url", None)
            if not url:
                continue
            if not (url.startswith("https://www.youtube.com/") or
                    url.startswith("http://www.youtube.com/")):
                # Should not happen, but elsewhere in metadata
                continue
            existing = {att.document.uri_id for att in post.attachments}
            if url in existing:
                continue
            document = db.query(m.Document).filter_by(
                uri_id=url, discussion_id=post.discussion_id).first()
            if not document:
                document = m.Document(
                    uri_id=url, discussion_id=post.discussion_id)
            attachment = m.PostAttachment(
                discussion_id=post.discussion_id,
                creator_id=post.creator_id,
                document=document,
                attachmentPurpose='EMBED_ATTACHMENT',
                post=post)
            db.add(attachment)
            db.flush()  # so document is available if repeated


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
