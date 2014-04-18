from sqlalchemy.sql.expression import and_
from pyramid.security import (
    authenticated_userid, Everyone, Authenticated)
from pyramid.httpexceptions import HTTPNotFound

from assembl.models.auth import (
    User, P_READ, R_SYSADMIN, Role, UserRole, LocalUserRole, Permission,
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
                LocalUserRole).filter(and_(
                    LocalUserRole.user_id == user_id,
                    LocalUserRole.discussion_id == discussion_id)))
    roles = session.query(Role.name).select_from(roles.subquery()).distinct()
    return [x[0] for x in roles]

""" TODO: maparent:  Explain how this is different from permissions_for_user """
def get_permissions(user_id, discussion_id):
    session = get_session_maker()()
    if user_id in (Everyone, Authenticated):
        permissions = session.query(Permission.name).join(
            DiscussionPermission, Role).filter(
                Role.name == user_id)
    else:
        sysadmin = session.query(UserRole).filter_by(
            user_id=user_id).join(Role).filter_by(name=R_SYSADMIN).first()
        if sysadmin:
            return [x[0] for x in session.query(Permission.name).all()]
        permissions = session.query(Permission.name).join(
            DiscussionPermission, Role, UserRole).filter(
                UserRole.user_id == user_id
            ).union(session.query(Permission.name).join(
                DiscussionPermission, Role, LocalUserRole).filter(and_(
                    LocalUserRole.user_id == user_id,
                    LocalUserRole.discussion_id == discussion_id))
            ).union(session.query(Permission.name).join(
                DiscussionPermission, Role).filter(and_(
                    DiscussionPermission.discussion_id == discussion_id,
                    Role.name.in_((Authenticated, Everyone)))))
    return [x[0] for x in permissions.distinct()]


def authentication_callback(user_id, request):
    from ..models import Discussion
    discussion_id = None
    connection = Discussion.db().connection()
    connection.info['userid'] = user_id
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
    from ..models import Discussion
    db = Discussion.db()
    if userid in (Authenticated, Everyone):
        return db.query(Discussion).join(
            DiscussionPermission, Role, Permission).filter(and_(
                Permission.name == permission,
                Role.name == userid))
    else:
        sysadmin = db.query(UserRole).filter_by(
            user_id=userid).join(Role).filter_by(name=R_SYSADMIN).first()
        if sysadmin:
            return db.query(Discussion).all()

        perms = db.query(DiscussionPermission).join(
            Role, Permission, UserRole, User).filter(
                User.id == userid).filter(
                    Permission.name == permission
                ).union(db.query(DiscussionPermission).join(
                    Role, Permission).join(
                        LocalUserRole, (
                            LocalUserRole.discussion_id == DiscussionPermission.discussion_id)
                    ).join(User).filter(
                        User.id == userid).filter(
                            Permission.name == permission)
                ).union(db.query(DiscussionPermission).join(
                    Role, Permission).filter(
                        Role.name.in_((Authenticated, Everyone))).filter(
                            Permission.name == permission)
                )
        return db.query(Discussion).join(perms.subquery('perms'))


def user_has_permission(discussion_id, user_id, permission):
    from ..models import Discussion
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
                            Permission.name == permission)
                ).union(
                    db.query(DiscussionPermission).join(
                            Permission, Role).filter(
                                DiscussionPermission.discussion_id == discussion_id).filter(
                                    Role.name.in_((Authenticated, Everyone))).filter(
                                        Permission.name == permission)
                ).first()
    return permission is not None


def permissions_for_user(discussion_id, user_id):
    from ..models import Discussion
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
                UserRole.user_id == user_id
        ).union(
            db.query(Permission.name).join(
                DiscussionPermission, Role, LocalUserRole).filter(
                    DiscussionPermission.discussion_id == discussion_id
                ).filter(LocalUserRole.user_id == user_id)
        ).union(
            db.query(Permission.name).join(
                DiscussionPermission, Role).filter(and_(
                    DiscussionPermission.discussion_id == discussion_id,
                    Role.name.in_((Authenticated, Everyone))))
        )
    return [x[0] for x in permissions]
