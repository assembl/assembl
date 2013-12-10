from pyramid.security import (
    authenticated_userid, Everyone, Authenticated)
from pyramid.httpexceptions import HTTPNotFound
from models import (
    User, R_PARTICIPANT, R_CATCHER, R_MODERATOR, R_ADMINISTRATOR,
    P_READ, P_ADD_POST, P_EDIT_POST, P_DELETE_POST, P_ADD_EXTRACT,
    P_DELETE_EXTRACT, P_EDIT_EXTRACT, P_ADD_IDEA, P_EDIT_IDEA,
    P_EDIT_SYNTHESIS, P_SEND_SYNTHESIS, P_ADMIN_DISC, P_SYSADMIN,
    R_SYSADMIN, SYSTEM_ROLES, Role, UserRole, LocalUserRole, Permission,
    DiscussionPermission
)
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
    from ..synthesis.models import Discussion
    discussion_id = None
    if request.matchdict:
        if 'discussion_id' in request.matchdict:
            discussion_id = int(request.matchdict['discussion_id'])
            discussion = Discussion.get_instance(discussion_id)
            if not discussion:
                raise HTTPNotFound("No discussion ID %d" % (discussion_id,))
        elif 'discussion_slug' in request.matchdict:
            slug = request.matchdict['discussion_slug']
            session = get_session_maker()()
            discussion = session.query(Discussion).filter_by(
                slug=slug).first()
            if not discussion:
                raise HTTPNotFound("No discussion named %s" % (slug,))
            discussion_id = discussion.id
    return get_roles(user_id, discussion_id)


def discussions_with_access(userid, permission=P_READ):
    from ..synthesis.models import Discussion
    db = Discussion.db()
    if userid in (Authenticated, Everyone):
        discussions = db.query(Discussion.id).join(
            DiscussionPermission, Role, Permission).filter(
                Permission.name == permission and
                Role.name == userid)
    else:
        discussions = db.query(Discussion.id).join(
            DiscussionPermission, Role, Permission, UserRole, User).filter(
                User.id == userid).filter(
                    Permission.name == permission
                ).union(db.query(Discussion.id).join(
                    DiscussionPermission, Role, Permission).join(
                        LocalUserRole, (
                            LocalUserRole.discussion_id == Discussion.id)
                    ).join(User).filter(
                        User.id == userid).filter(
                            Permission.name == permission)
                ).union(db.query(Discussion.id).join(
                    DiscussionPermission, Role, Permission).filter(
                        Role.name.in_((Authenticated, Everyone))).filter(
                            Permission.name == permission)
                )
    return [x[0] for x in discussions]


def user_has_permission(discussion_id, user_id, permission):
    from ..synthesis.models import Discussion
    # assume all ids valid
    db = Discussion.db()
    if user_id in (Authenticated, Everyone):
        permission = db.query(DiscussionPermission).join(
            Permission, Role).filter(
                DiscussionPermission.discussion_id == discussion_id).filter(
                    Role.name == user_id).filter(
                        Permission.name == permission).first()
        return permission is not None
    sysadmin = db.query(UserRole).filter_by(
        user_id=user_id).join(Role).filter_by(name=R_SYSADMIN).first()
    if sysadmin:
        return True
    permission = db.query(DiscussionPermission).join(
        Permission, Role, UserRole).filter(
            DiscussionPermission.discussion_id == discussion_id).filter(
                UserRole.user_id == user_id).filter(
                    Permission.name == permission
                ).union(
                    db.query(DiscussionPermission).join(
                        Permission, Role, LocalUserRole).filter(
                            DiscussionPermission.discussion_id == discussion_id
                        ).filter(LocalUserRole.user_id == user_id).filter(
                            Permission.name == permission)).first()
    return permission is not None


def permissions_for_user(discussion_id, user_id):
    from ..synthesis.models import Discussion
    # assume all ids valid
    db = Discussion.db()
    if user_id in (Authenticated, Everyone):
        permissions = db.query(Permission.name).join(
            DiscussionPermission, Role).filter(
                DiscussionPermission.discussion_id == discussion_id).filter(
                    Role.name == user_id)
        return [x[0] for x in permissions]
    sysadmin = db.query(UserRole).filter_by(
        user_id=user_id).join(Role).filter_by(name=R_SYSADMIN).first()
    if sysadmin:
        return [x[0] for x in db.query(Permission.name).all()]
    permissions = db.query(Permission.name).join(
        DiscussionPermission, Role, UserRole).filter(
            DiscussionPermission.discussion_id == discussion_id).filter(
                UserRole.user_id == user_id).union(
                    db.query(Permission.name).join(
                        DiscussionPermission, Role, LocalUserRole).filter(
                            DiscussionPermission.discussion_id == discussion_id
                        ).filter(LocalUserRole.user_id == user_id))
    return [x[0] for x in permissions]
