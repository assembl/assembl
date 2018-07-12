"""convert_thematics_medias_in_attachments

Revision ID: e757aefa55e1
Revises: 2d0777b24f0d
Create Date: 2018-07-04 22:26:29.749837

"""

# revision identifiers, used by Alembic.
revision = 'e757aefa55e1'
down_revision = '2d0777b24f0d'

from alembic import context, op
import re
import sqlalchemy as sa
import transaction

from assembl.auth import R_SYSADMIN
from assembl.lib import config


def upgrade(pyramid_env):
    from assembl import models as m
    db = m.get_session_maker()()
    doc_re = re.compile(u'/data/Discussion/(?P<discussion_id>\d+)/documents/(?P<document_id>\d+)/data')
    with transaction.manager:
        # take the first sysadmin as creator
        sysadmin_role = db.query(m.Role).filter(m.Role.name == R_SYSADMIN).first()
        creator_id = m.User.default_db.query(m.User).join(
            m.User.roles).filter(m.Role.id == sysadmin_role.id)[0:1][0].id
        for thematic in db.query(m.Thematic).all():
            if thematic.video_html_code:
                result = re.match(doc_re, thematic.video_html_code)
                if result:
                    discussion_id = result.group('discussion_id')
                    document_id = result.group('document_id')

                    new_attachment = m.IdeaAttachment(
                        idea=thematic,
                        document_id=document_id,
                        discussion_id=discussion_id,
                        creator_id=creator_id,
                        title=u'',
                        attachmentPurpose=m.AttachmentPurpose.MEDIA_ATTACHMENT.value
                    )

                    db.add(new_attachment)
                    thematic.video_html_code = u''

        db.flush()


def downgrade(pyramid_env):
    from assembl import models as m
    with transaction.manager:
        db = m.get_session_maker()()
        url_re = re.compile(u'^https?:\/\/.*?(\/.*)$')
        for thematic_id, attachment_id, doc_id in db.query(m.Thematic.id, m.IdeaAttachment.id, m.IdeaAttachment.document_id).join(m.IdeaAttachment).filter(m.IdeaAttachment.attachmentPurpose == 'MEDIA_ATTACHMENT'):
            thematic = m.Thematic.get(thematic_id)
            document = m.File.get(doc_id)
            if document and not thematic.video_html_code:
                result = re.match(url_re, document.external_url)
                if result:
                    thematic.video_html_code = result.group(1)

                attachment = m.IdeaAttachment.get(attachment_id)
                thematic.attachments.remove(attachment)
                db.delete(attachment)

        db.flush()
