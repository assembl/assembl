from pyramid.security import (
    authenticated_userid, Everyone, Authenticated)

from models import (
    User, R_PARTICIPANT, R_CATCHER, R_MODERATOR, R_ADMINISTRATOR,
    P_READ, P_ADD_POST, P_EDIT_POST, P_DELETE_POST, P_ADD_EXTRACT,
    P_DELETE_EXTRACT, P_EDIT_EXTRACT, P_ADD_IDEA, P_EDIT_IDEA,
    Role, UserRole, LocalUserRole, Permission, DiscussionPermission
)
from ..synthesis.models import Discussion
from ..lib.sqla import get_session_maker


def get_user(request):
    logged_in = authenticated_userid(request)
    if logged_in:
        return User.get(id=logged_in)


def get_roles(user_id, discussion_id=None):
    session = get_session_maker()()
    roles = session.query(Role).join(UserRole).filter(
        UserRole.user_id == user_id)
    if discussion_id:
        roles = roles.union(
            session.query(Role).join(
                LocalUserRole).filter(
                    LocalUserRole.user_id == user_id and
                    LocalUserRole.discussion_id == discussion_id))
    roles = session.query(Role.name).select_from(roles.subquery()).distinct()
    return [x[0] for x in roles]


def get_permissions(user_id, discussion_id):
    session = get_session_maker()()
    if user_id in (Everyone, Authenticated):
        permissions = session.query(Permission.name).join(
            DiscussionPermission, Role).filter(
                Role.name == user_id)
    else:
        permissions = session.query(Permission.name).join(
            DiscussionPermission, Role, UserRole).filter(
                UserRole.user_id == user_id
            ).union(session.query(Permission.name).join(
                DiscussionPermission, Role, LocalUserRole).filter(
                    LocalUserRole.user_id == user_id and
                    LocalUserRole.discussion_id == discussion_id))
    return [x[0] for x in permissions.distinct()]


def authentication_callback(user_id, request):
    discussion_id = None
    if request.matchdict:
        if 'discussion_id' in request.matchdict:
            discussion_id = int(request.matchdict['discussion_id'])
        elif 'discussion_slug' in request.matchdict:
            session = get_session_maker()()
            discussion = session.query(Discussion).filter_by(
                slug=request.matchdict['discussion_slug']).first()
            if discussion:
                discussion_id = discussion.id
    return get_roles(user_id, discussion_id)
