from pyramid.security import authenticated_userid

from assembl.db import DBSession
from models import User

def get_user(request):
    logged_in = authenticated_userid(request)
    if logged_in:
        return DBSession.query(User).get(logged_in)
