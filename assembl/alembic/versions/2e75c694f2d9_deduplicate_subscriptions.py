"""deduplicate_subscriptions

Revision ID: 2e75c694f2d9
Revises: 29c5ef7ad189
Create Date: 2015-02-06 12:29:19.466109

"""

import sys
from os.path import dirname

sys.path.append(dirname(__file__))

# Import does not like this filename
_m = __import__('5a0ce18bf2b2_deduplicate_subscriptions',
                globals(), locals(), ['upgrade', 'downgrade'], -1)

# revision identifiers, used by Alembic.
revision = '2e75c694f2d9'
down_revision = '29c5ef7ad189'

upgrade = _m.upgrade
downgrade = _m.downgrade
