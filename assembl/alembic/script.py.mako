<%
    def indent(text, indents=1):
        return '\n'.join([('    ' * indents + l) for l in text.split('\n')])

%>"""${message}

Revision ID: ${up_revision}
Revises: ${down_revision}
Create Date: ${create_date}

"""

# revision identifiers, used by Alembic.
revision = ${repr(up_revision)}
down_revision = ${repr(down_revision)}

from alembic import context, op
import sqlalchemy as sa
import transaction
${imports if imports else ''}

from assembl.lib import config


def upgrade(pyramid_env):
    with context.begin_transaction():
    ${indent(upgrades if upgrades else 'pass')}

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        pass


def downgrade(pyramid_env):
    with context.begin_transaction():
    ${indent(downgrades if downgrades else 'pass')}
