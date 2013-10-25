from pyramid.security import authenticated_userid

from models import (
    User, R_PARTICIPANT, R_CATCHER, R_MODERATOR, R_ADMINISTRATOR,
    P_READ, P_ADD_POST, P_EDIT_POST, P_DELETE_POST, P_ADD_EXTRACT,
    P_DELETE_EXTRACT, P_EDIT_EXTRACT, P_ADD_IDEA, P_EDIT_IDEA,
    Role, UserRole, LocalUserRole
)
from ..synthesis.models import Discussion
from ..lib.sqla import get_session_maker

def get_user(request):
    logged_in = authenticated_userid(request)
    if logged_in:
        return User.get(id=logged_in)


def authentication_callback(userid, request):
    session = get_session_maker()()
    roles = session.query(Role.name).join(UserRole).filter(
        UserRole.user_id == userid).all()
    roles = {x[0] for x in roles}
    if request.matchdict:
        discussion_id = None
        if 'discussion_id' in request.matchdict:
            discussion_id = int(request.matchdict['discussion_id'])
        elif 'discussion_slug' in request.matchdict:
            discussion = session.query(Discussion).filter_by(
                slug=request.matchdict['discussion_slug']).first()
            if discussion:
                discussion_id = discussion.id
        if discussion_id:
            local_roles = session.query(Role.name).join(LocalUserRole).filter(
                LocalUserRole.user_id == userid and
                LocalUserRole.discussion_id == discussion_id).all()
            roles.update({x[0] for x in local_roles})
    return list(roles)
