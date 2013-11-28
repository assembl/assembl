import transaction
from sqla import get_session_maker
db = get_session_maker(False)

def setup(env):
    # Wait until all is done
    from assembl import models
    print env
    env['db'] = db
    env['transaction'] = transaction
    env['models'] = models
