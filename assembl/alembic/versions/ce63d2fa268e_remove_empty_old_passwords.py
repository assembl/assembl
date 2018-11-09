"""remove_empty_old_passwords

Revision ID: ce63d2fa268e
Revises: f8a3ebc5d6dd
Create Date: 2018-11-08 19:19:27.515072

"""

# revision identifiers, used by Alembic.
revision = 'ce63d2fa268e'
down_revision = 'f8a3ebc5d6dd'

from alembic import context
import transaction


def upgrade(pyramid_env):

    # Do stuff with the app's models here.
    from assembl import models as m
    db = m.get_session_maker()()
    with transaction.manager:
        empty_old_passwords = db.query(m.OldPassword).filter(m.OldPassword.password == None).all()
        for p in empty_old_passwords:
            db.delete(p)
        db.flush()


def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
