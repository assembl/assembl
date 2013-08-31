from pyramid.security import authenticated_userid

from assembl.db import DBSession
from models import (
    User, R_PARTICIPANT, R_CATCHER, R_MODERATOR, R_ADMINISTRATOR,
    P_READ, P_ADD_POST, P_EDIT_POST, P_DELETE_POST, P_ADD_EXTRACT,
    P_DELETE_EXTRACT, P_EDIT_EXTRACT, P_ADD_IDEA, P_EDIT_IDEA
)


def get_user(request):
    logged_in = authenticated_userid(request)
    if logged_in:
        return DBSession.query(User).get(logged_in)
