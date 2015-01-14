"""Fix notification constraints

Revision ID: 33c20d131cb6
Revises: 1fdfec5c3fe9
Create Date: 2014-10-29 14:17:50.940939

"""

# revision identifiers, used by Alembic.
revision = '33c20d131cb6'
down_revision = '1fdfec5c3fe9'

from alembic import context, op
import sqlalchemy as sa
import transaction


from assembl.lib import config


def upgrade(pyramid_env):
    from assembl.models.notification import *
    schema = config.get('db_schema')+"."+config.get('db_user')
    with context.begin_transaction():
            #No clean way to address constraints, and I didn't find a way to add JUST the constraint from sqlalchemy data structures
            constraintNameOld = "ck_"+config.get('db_schema')+"_"+config.get('db_user')+"_notification_subscription_notification_status"
            op.execute("""ALTER TABLE notification_subscription DROP CONSTRAINT """+constraintNameOld)
            constraintNameNew = "ck_"+config.get('db_schema')+"_"+config.get('db_user')+"_notification_subscription_notification_subscription_status"
            op.execute("""ALTER TABLE notification_subscription ADD CONSTRAINT """+constraintNameNew+"""
             CHECK (status IN ('ACTIVE', 'INACTIVE_DFT', 'UNSUBSCRIBED'))""")


            if False:
                """   WOW, no column rename in virtuoso!
                For the record, even the following doesn't work (chicken and the egg on null values)!  Darn virtuoso"""
                op.add_column('notification_subscription',
                    sa.Column('status_temp',
                          NotificationSubscriptionStatus.db_type(),
                          nullable=True,
                          index = True,
                          default = NotificationSubscriptionStatus.ACTIVE),
                    schema=schema)
    
                op.execute("""UPDATE notification_subscription SET 
                            status_temp = status""")
                op.drop_column('notification_subscription', 'status')
                op.add_column('notification_subscription',
                    sa.Column('status',
                          NotificationSubscriptionStatus.db_type(),
                          nullable=True,
                          index = True,
                          default = NotificationSubscriptionStatus.ACTIVE),
                    schema=schema)
                op.execute("""UPDATE notification_subscription SET 
                            status = status_temp""")
                op.execute("""ALTER TABLE notification_subscription 
                MODIFY status varchar(256) NOT NULL""")
                op.drop_column('notification_subscription', 'status_temp')

def downgrade(pyramid_env):
    with context.begin_transaction():
        pass
