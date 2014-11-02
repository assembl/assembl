from sqlalchemy.sql.expression import and_
from pyramid.security import (
    authenticated_userid, Everyone, Authenticated)
from pyramid.httpexceptions import HTTPNotFound

from ..lib.sqla import get_session_maker
from . import R_SYSADMIN, P_READ, SYSTEM_ROLES
from ..models.auth import (
    User, Role, UserRole, LocalUserRole, Permission,
    DiscussionPermission, IdentityProvider, AgentProfile)


def get_user(request):
    logged_in = authenticated_userid(request)
    if logged_in:
        return User.get(logged_in)


def get_roles(user_id, discussion_id=None):
    if user_id in SYSTEM_ROLES:
        return [user_id]
    session = get_session_maker()()
    roles = session.query(Role.name).join(UserRole).filter(
        UserRole.user_id == user_id)
    if discussion_id:
        roles = roles.union(
            session.query(Role.name).join(
                LocalUserRole).filter(and_(
                    LocalUserRole.user_id == user_id,
                    LocalUserRole.requested == 0,
                    LocalUserRole.discussion_id == discussion_id)))
    return [x[0] for x in roles.distinct()]


def get_permissions(user_id, discussion_id):
    session = get_session_maker()()
    if user_id in (Everyone, Authenticated):
        if not discussion_id:
            return None
        permissions = session.query(Permission.name).join(
            DiscussionPermission, Role).filter(
                (DiscussionPermission.discussion_id == discussion_id)
                & (Role.name == user_id))
    else:
        sysadmin = session.query(UserRole).filter_by(
            user_id=user_id).join(Role).filter_by(name=R_SYSADMIN).first()
        if sysadmin:
            return [x[0] for x in session.query(Permission.name).all()]
        if not discussion_id:
            return []
        permissions = session.query(Permission.name).join(
            DiscussionPermission, Role, UserRole).filter(
                UserRole.user_id == user_id
            ).union(session.query(Permission.name).join(
                DiscussionPermission, Role, LocalUserRole).filter(and_(
                    LocalUserRole.user_id == user_id,
                    LocalUserRole.requested == 0,
                    LocalUserRole.discussion_id == discussion_id,
                    DiscussionPermission.discussion_id == discussion_id))
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
                        LocalUserRole, and_(
                            LocalUserRole.discussion_id == DiscussionPermission.discussion_id,
                            LocalUserRole.requested == 0)
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
                    db.query(DiscussionPermission
                        ).join(Permission, Role, LocalUserRole).filter(and_(
                            # Virtuoso disregards this explicit condition
                            DiscussionPermission.discussion_id == discussion_id,
                            # So I have to add this one as well.
                            LocalUserRole.discussion_id == discussion_id,
                            LocalUserRole.user_id == user_id,
                            LocalUserRole.requested == 0,
                            Permission.name == permission))
                ).union(
                    db.query(DiscussionPermission).join(
                            Permission, Role).filter(
                                DiscussionPermission.discussion_id == discussion_id).filter(
                                    Role.name.in_((Authenticated, Everyone))).filter(
                                        Permission.name == permission)
                ).first()
    return permission is not None


def users_with_permission(discussion_id, permission, id_only=True):
    from ..models import Discussion
    # assume all ids valid
    db = Discussion.db()
    user_ids = db.query(User.id).join(
        LocalUserRole, Role, DiscussionPermission, Permission).filter(and_(
        Permission.name == permission,
        LocalUserRole.requested == 0,
        LocalUserRole.discussion_id == discussion_id,
        DiscussionPermission.discussion_id == discussion_id)
        ).union(
            db.query(User.id).join(
                UserRole, Role, DiscussionPermission, Permission).filter(
                and_(
                    Permission.name == permission,
                    DiscussionPermission.discussion_id == discussion_id))
        ).union(
            db.query(User.id).join(
                UserRole, Role).filter(
                and_(
                    Role.name == R_SYSADMIN,
                    DiscussionPermission.discussion_id == discussion_id))
        ).distinct()
    if id_only:
        return [AgentProfile.uri_generic(id) for (id, ) in user_ids]
    else:
        return db.query(AgentProfile).filter(AgentProfile.id.in_(user_ids)).all()


def get_identity_provider(request, create=True):
    auth_context = request.context
    trusted = request.registry.settings['trusted_login_providers']
    provider = None
    session = get_session_maker()()
    provider = IdentityProvider.db.query(IdentityProvider).filter_by(
        provider_type=auth_context.provider_type,
        name=auth_context.provider_name
    ).first()
    if provider and not provider.trust_emails and provider.name in trusted:
        provider.trust_emails = True
        session.add(provider)
    elif create and not provider:
        provider = IdentityProvider(
            provider_type=auth_context.provider_type,
            name=auth_context.provider_name,
            trust_emails=auth_context.provider_name in trusted)
        session.add(provider)
    return provider
