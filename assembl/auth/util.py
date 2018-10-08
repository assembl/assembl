"""Sundry utility functions having to do with users or permissions"""
from csv import reader
from datetime import datetime, timedelta
import base64

from sqlalchemy.sql.expression import and_
from pyramid.security import (Everyone, Authenticated, forget)
from pyramid.httpexceptions import HTTPNotFound
from pyisemail import is_email
from pyramid.authentication import SessionAuthenticationPolicy

from assembl.lib.locale import _
from ..lib.sqla import get_session_maker
from . import R_SYSADMIN, P_READ, SYSTEM_ROLES
from .password import verify_data_token, Validity
from ..models.auth import (
    User, Role, UserRole, LocalUserRole, Permission,
    DiscussionPermission, AgentProfile,
    EmailAccount)


def get_user(request):
    logged_in = request.authenticated_userid
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
                    LocalUserRole.requested == False,  # noqa: E712
                    LocalUserRole.discussion_id == discussion_id)))
    return [x[0] for x in roles.distinct()]


def get_permissions(user_id, discussion_id):
    user_id = user_id or Everyone
    session = get_session_maker()()
    if user_id == Everyone:
        if not discussion_id:
            return []
        permissions = session.query(Permission.name).join(
            DiscussionPermission, Role).filter(
                (DiscussionPermission.discussion_id == discussion_id) & (Role.name == user_id))
    elif user_id == Authenticated:
        if not discussion_id:
            return []
        permissions = session.query(Permission.name).join(
            DiscussionPermission, Role).filter(
                (DiscussionPermission.discussion_id == discussion_id) & (Role.name.in_((Authenticated, Everyone))))
    else:
        sysadmin = session.query(UserRole).filter_by(
            user_id=user_id).join(Role).filter_by(name=R_SYSADMIN).first()
        if sysadmin:
            return [x[0] for x in session.query(Permission.name).all()]
        if not discussion_id:
            return []
        permissions = session.query(Permission.name).join(
            DiscussionPermission, Role, UserRole).filter(
                UserRole.user_id == user_id,
                DiscussionPermission.discussion_id == discussion_id
            ).union(session.query(Permission.name).join(
                DiscussionPermission, Role, LocalUserRole).filter(and_(
                    LocalUserRole.user_id == user_id,
                    LocalUserRole.requested == False,  # noqa: E712
                    LocalUserRole.discussion_id == discussion_id,
                    DiscussionPermission.discussion_id == discussion_id))
            ).union(session.query(Permission.name).join(
                DiscussionPermission, Role).filter(and_(
                    DiscussionPermission.discussion_id == discussion_id,
                    Role.name.in_((Authenticated, Everyone)))))
    return [x[0] for x in permissions.distinct()]


def discussion_from_request(request):
    from ..models import Discussion
    from assembl.views.traversal import TraversalContext
    if request.matchdict:
        if 'discussion_id' in request.matchdict:
            discussion_id = int(request.matchdict['discussion_id'])
            discussion = Discussion.get_instance(discussion_id)
            if not discussion:
                raise HTTPNotFound("No discussion ID %d" % (discussion_id,))
            return discussion
        elif 'discussion_slug' in request.matchdict:
            slug = request.matchdict['discussion_slug']
            session = get_session_maker()()
            discussion = session.query(Discussion).filter_by(
                slug=slug).first()
            if not discussion:
                raise HTTPNotFound("No discussion named %s" % (slug,))
            return discussion
    if getattr(request, "context", None) and isinstance(
            request.context, TraversalContext):
        discussion_id = request.context.get_discussion_id()
        if discussion_id:
            return Discussion.get(discussion_id)
    if request.session.get("discussion", None):
        slug = request.session["discussion"]
        session = get_session_maker()()
        discussion = session.query(Discussion).filter_by(
            slug=slug).first()
        if not discussion:
            raise HTTPNotFound("No discussion named %s" % (slug,))
        return discussion


def get_current_discussion():
    from pyramid.threadlocal import get_current_request
    r = get_current_request()
    # CAN ONLY BE CALLED IF THERE IS A CURRENT REQUEST.
    assert r
    return discussion_from_request(r)


def get_current_user_id():
    from pyramid.threadlocal import get_current_request
    r = get_current_request()
    # CAN ONLY BE CALLED IF THERE IS A CURRENT REQUEST.
    assert r
    return r.authenticated_userid


def get_non_expired_user_id(request):
    user_id = request.authenticated_userid
    discussion = discussion_from_request(request)
    if user_id:
        user = User.get(user_id)
        if user.login_expired(discussion):
            forget(request)
            localizer = request.localizer
            request.session.flash(localizer.translate(_(
                "Your session has expired, you need to login again")))
            user_id = None
    return user_id


class UpgradingSessionAuthenticationPolicy(SessionAuthenticationPolicy):
    """ A session authentication policy that tells the underlying beaker session
    whenever the user logs in or out. Allows to have different cookie policies"""

    def remember(self, request, user_id, **kwargs):
        request.session.elevate_privilege(True)
        return super(UpgradingSessionAuthenticationPolicy, self).remember(
            request, user_id, **kwargs)

    def forget(self, request):
        request.session.elevate_privilege(False)
        return super(UpgradingSessionAuthenticationPolicy, self).forget(
            request)


class TokenSessionAuthenticationPolicy(SessionAuthenticationPolicy):
    """ A session authentication policy that accepts tokens for identity instead of
    the beaker session's login."""

    API_TOKEN_HEADER = 'X-Api-Key'

    def user_from_token(self, request):
        token = request.headers.get(self.API_TOKEN_HEADER, None)
        if token:
            # Those tokens are eternal
            data, valid = verify_data_token(
                token, max_age=timedelta(days=36525))
            if valid == Validity.VALID:
                try:
                    data, salt = data.split('.', 1)
                    salt = base64.urlsafe_b64decode(salt)
                    data = [int(i) for i in data.split(',')]
                    user_id = data[0]
                    return user_id
                except:
                    pass

    def effective_principals(self, request):
        p = super(TokenSessionAuthenticationPolicy, self
                  ).effective_principals(request)
        if len(p) == 1:
            user_id = self.user_from_token(request)
            if user_id:
                discussion = None
                # No use case for this yet.
                # try:
                #     discussion = discussion_from_request(request)
                #     if discussion is not None:
                #         discussion = discussion.id
                # except:
                #     pass
                p.append(Authenticated)
                p.extend(get_roles(user_id, discussion))
        return p

    def authenticated_userid(self, request):
        return (
            super(TokenSessionAuthenticationPolicy, self
                  ).authenticated_userid(request) or
            self.user_from_token(request))


class UpgradingTokenSessionAuthenticationPolicy(
        TokenSessionAuthenticationPolicy,
        UpgradingSessionAuthenticationPolicy):
    """ Mixing :py:class:`UpgradingSessionAuthenticationPolicy` and
    :py:class:`TokenSessionAuthenticationPolicy`."""
    pass


def authentication_callback(user_id, request):
    "This is how pyramid knows the user's permissions"
    connection = User.default_db.connection()
    connection.info['userid'] = user_id
    discussion = discussion_from_request(request)
    discussion_id = discussion.id if discussion else None
    # this is a good time to tell raven about the user
    from raven.base import Raven
    if Raven:
        if user_id:
            Raven.user_context({'user_id': user_id})
        if discussion_id:
            Raven.context.merge({'discussion_id': discussion_id})

    return get_roles(user_id, discussion_id)


def discussions_with_access(userid, permission=P_READ):
    from ..models import Discussion
    userid = userid or Everyone
    db = Discussion.default_db
    if userid == Everyone:
        return db.query(Discussion).join(
            DiscussionPermission, Role, Permission).filter(and_(
                Permission.name == permission,
                Role.name == userid))
    elif userid == Authenticated:
        return db.query(Discussion).join(
            DiscussionPermission, Role, Permission).filter(and_(
                Permission.name == permission,
                Role.name.in_((Authenticated, Everyone))))
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
                            LocalUserRole.requested == False)  # noqa: E712
                    ).join(User).filter(
                        User.id == userid).filter(
                            Permission.name == permission)
                ).union(db.query(DiscussionPermission).join(
                    Role, Permission).filter(
                        Role.name.in_((Authenticated, Everyone))).filter(
                            Permission.name == permission)
                )
        return db.query(Discussion).join(perms.subquery('perms'))


def roles_with_permission(discussion, permission=P_READ):
    return [x for (x,) in discussion.db.query(Role.name).join(
        DiscussionPermission).join(Permission).filter(and_(
            Permission.name == permission,
            DiscussionPermission.discussion == discussion))]


def roles_with_permissions(discussion, *permissions):
    return [x for (x,) in discussion.db.query(Role.name).join(
        DiscussionPermission).join(Permission).filter(and_(
            Permission.name.in_(permissions),
            DiscussionPermission.discussion == discussion))]


def user_has_permission(discussion_id, user_id, permission):
    from ..models import Discussion
    # assume all ids valid
    user_id = user_id or Everyone
    db = Discussion.default_db
    if user_id == Everyone:
        permission = db.query(DiscussionPermission).join(
            Permission, Role).filter(
                DiscussionPermission.discussion_id == discussion_id).filter(
                    Role.name == user_id).filter(
                        Permission.name == permission).first()
        return permission is not None
    elif user_id == Authenticated:
        permission = db.query(DiscussionPermission).join(
            Permission, Role).filter(
                DiscussionPermission.discussion_id == discussion_id).filter(
                    Role.name.in_((Authenticated, Everyone))).filter(
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
                            LocalUserRole.requested == False,  # noqa: E712
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
    db = Discussion.default_db
    user_ids = db.query(User.id).join(
        LocalUserRole, Role, DiscussionPermission, Permission).filter(and_(
            Permission.name == permission,
            LocalUserRole.requested == False,  # noqa: E712
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


def maybe_auto_subscribe(user, discussion, check_authorization=True):
    """Auto-subscribe user to notifications if discussion requires it

    Idempotent. Currently called at first login, maybe at user invite,
    but certainly configurable.
    """
    if (not discussion or
            not discussion.subscribe_to_notifications_on_signup or
            (check_authorization and not discussion.check_authorized_email(user))):
        return False
    # really auto-subscribe user
    user.subscribe(discussion)
    discussion.db.flush()
    # apply new notifications (on the same thread)
    user.get_notification_subscriptions(discussion.id, on_thread=False)
    return True


def add_user(name, email, password, role, force=False, username=None,
             localrole=None, discussion=None, change_old_password=True, db=None,
             **kwargs):
    from assembl.models import Discussion, Username
    db = db or Discussion.default_db
    # refetch within transaction
    all_roles = {r.name: r for r in db.query(Role).all()}
    user = None
    created_user = True
    if discussion and localrole:
        if isinstance(discussion, (str, unicode)):
            discussion_ob = db.query(Discussion).filter_by(
                slug=discussion).first()
            assert discussion_ob,\
                "Discussion with slug %s does not exist" % (discussion,)
        elif isinstance(discussion, int):
            discussion_ob = db.query(Discussion).get(discussion)
        discussion = discussion_ob
        assert discussion

    existing_email = None
    if email:
        existing_email = db.query(EmailAccount).filter(
            EmailAccount.email_ci == email).first()
        assert force or not existing_email,\
            "User with email %s already exists" % (email,)

    if username:
        existing_username = db.query(Username).filter_by(
            username=username).first()
        assert force or not existing_username,\
            "User with username %s already exists" % (username,)
        assert not existing_email or not existing_username or \
            existing_username.user == existing_email.profile,\
            "Two different users already exist with "\
            "username %s and email %s." % (username, email)

    if existing_email:
        user = existing_email.profile
    elif username and existing_username:
        user = existing_username.user

    old_user = isinstance(user, User)
    if old_user:
        user.preferred_email = email
        user.name = name
        user.verified = True
        created_user = False
        if change_old_password:
            if password is None:
                user.password = None
            else:
                user.password_p = password
        if username:
            if user.username:
                user.username.username = username
            else:
                db.add(Username(username=username, user=user))
    else:
        if user:
            # Profile may have come from userless existing AgentProfile
            user = user.change_class(
                User, None,
                preferred_email=email,
                verified=True,
                creation_date=datetime.utcnow(),
                is_machine=kwargs.get('is_machine', False))
            if password is not None:
                user.password_p = password
        else:
            user = User(
                name=name,
                preferred_email=email,
                verified=True,
                password=password,
                creation_date=datetime.utcnow(),
                is_machine=kwargs.get('is_machine', False))
            db.add(user)
        if username:
            db.add(Username(username=username, user=user))

    for account in user.accounts:
        if isinstance(account, EmailAccount) and account.email_ci == email:
            account.verified = True
            account.preferred = True
            break
    else:
        account = EmailAccount(
            profile=user,
            email=email,
            preferred=True,
            verified=True)
        db.add(account)

    if role:
        role = all_roles[role]
        ur = None
        if old_user:
            ur = db.query(UserRole).filter_by(user=user, role=role).first()
        if not ur:
            db.add(UserRole(user=user, role=role))

    created_localrole = False
    if localrole:
        localrole = all_roles[localrole]
        lur = None
        if old_user:
            lur = db.query(LocalUserRole).filter_by(
                user=user, discussion=discussion, role=localrole).first()
        if not lur:
            created_localrole = True
            db.add(LocalUserRole(
                user=user, role=localrole, discussion=discussion))
    # Do this at login
    # if discussion:
    #     user.get_notification_subscriptions(discussion.id)
    if kwargs.get('flush', True):
        db.flush()

    return (user, created_user, created_localrole)


def add_multiple_users_csv(
        request, csv_file, discussion_id, with_role,
        send_password_change=False, message_subject=None,
        text_message=None, html_message=None, sender_name=None,
        resend_if_not_logged_in=False):
    r = reader(csv_file, skipinitialspace=True)
    localizer = request.localizer
    for i, row in enumerate(r):
        if not len(row):
            # tolerate empty lines
            continue
        row = [x.decode('utf-8').strip() for x in row]
        if len(row) != 2:
            raise RuntimeError(localizer.translate(_(
                "The CSV file must have two columns")))
        (name, email) = row
        if not is_email(email):
            if i == 0:
                # Header
                continue
            raise RuntimeError(localizer.translate(_(
                "Not an email: <%s> at line %d")) % (email, i))
        if len(name) < 5:
            raise RuntimeError(localizer.translate(_(
                "Name too short: <%s> at line %d")) % (name, i))
        (user, created_user, created_localrole) = add_user(
            name, email, None, None, True, localrole=with_role,
            discussion=discussion_id, change_old_password=False)
        status_in_discussion = None
        if send_password_change and not (created_user or created_localrole):
            status_in_discussion = user.get_status_in_discussion(discussion_id)
        if send_password_change and (
                created_user or created_localrole or (
                    resend_if_not_logged_in and (
                        status_in_discussion is None or
                        not status_in_discussion.first_visit))):
            from assembl.views.auth.views import send_change_password_email
            from assembl.models import Discussion
            discussion = Discussion.get(discussion_id)
            send_change_password_email(
                request, user, email, subject=message_subject,
                text_body=text_message, html_body=html_message,
                discussion=discussion, sender_name=sender_name, welcome=True)
    return i
