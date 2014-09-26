import argparse
from getpass import getpass, getuser
import re
from json import load
from datetime import datetime

from pyramid.paster import get_appsettings, bootstrap
import transaction

from ..lib.sqla import configure_engine, mark_changed
from ..lib.zmqlib import configure_zmq
from ..lib.model_watcher import configure_model_watcher
from ..lib.config import set_config

global all_roles


def validate_dict(d):
    global all_roles
    assert isinstance(d, dict), "%s should be a dictionary" % (repr(d),)
    for k in ('name', 'password', 'email', 'role'):
        assert k in d, "user dictionary %s is missing %s" % (repr(d), k)
    assert d['role'] in all_roles, "Role %s does not exist" % (d['role'],)
    assert ('discussion' in d) == ('localrole' in d), \
        "local role and discussion have to be defined together."
    if 'localrole' in d:
        assert d['localrole'] in all_roles,\
            "Role %s does not exist" % (d['localrole'],)


def add_user(name, email, password, role, force=False, username=None,
             localrole=None, discussion=None, **kwargs):
    from assembl.models import (
        Role, UserRole, LocalUserRole, EmailAccount, Discussion, Username,
        AgentProfile, User)
    db = Discussion.db()
    # refetch within transaction
    all_roles = {r.name: r for r in Role.db.query(Role).all()}
    user = None
    if discussion and localrole:
        discussion_ob = db.query(Discussion).filter_by(slug=discussion).first()
        assert discussion_ob,\
            "Discussion with slug %s does not exist" % (discussion,)
        discussion = discussion_ob
    existing_email = db.query(EmailAccount).filter(
        EmailAccount.email == email).first()
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
        user.set_password(password)
        if username:
            if user.username:
                user.username.username = username
            else:
                db.add(Username(username=username, user=user))
    else:
        if user:
            # Profile may have come from userless existing AgentProfile
            user = User(
                    id = user.id,
                    preferred_email=email,
                    verified=True,
                    password=password,
                    creation_date=datetime.now())
        else:
            user = User(
                name=name,
                preferred_email=email,
                verified=True,
                password=password,
                creation_date=datetime.now())
        db.add(user)
        if username:
            db.add(Username(username=username, user=user))
    for account in user.accounts:
        if isinstance(account, EmailAccount) and account.email == email:
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
    if localrole:
        localrole = all_roles[localrole]
        lur = None
        if old_user:
            lur = db.query(LocalUserRole).filter_by(
                user=user, discussion=discussion, role=role).first()
        if not lur:
            db.add(LocalUserRole(
                user=user, role=localrole, discussion=discussion))


def main():
    global all_roles
    parser = argparse.ArgumentParser()
    emailre = re.compile(
        r'^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]{2,4})$')
    parser.add_argument("configuration", help="configuration file")
    parser.add_argument("-f", help="json file with user information.", type=argparse.FileType('r'))
    parser.add_argument("--force", help="Overwrite existing user",
                        action="store_true")
    parser.add_argument("-m", "--email", help="email")
    parser.add_argument("-n", "--name", help="full name")
    parser.add_argument("-u", "--username",
                        help="username (optional, s for system username)")
    parser.add_argument("-p", "--password", help="password")
    parser.add_argument("-r", "--role", default="r:sysadmin",
                        help="global user role (default: r:sysdamin.)")
    parser.add_argument("-l", "--localrole",
                        help="local user role")
    parser.add_argument("-d", "--discussion",
                        help="slug of discussion context for local user role")
    args = parser.parse_args()
    env = bootstrap(args.configuration)
    settings = get_appsettings(args.configuration)
    set_config(settings)
    configure_zmq(settings['changes.socket'], False)
    configure_model_watcher(env['registry'], 'assembl')
    engine = configure_engine(settings, True)
    from assembl.models import Role
    all_roles = {r.name: r for r in Role.db.query(Role).all()}
    if args.f:
        userinfo = load(args.f)
        if isinstance(userinfo, dict):
            validate_dict(userinfo)
            with transaction.manager:
                add_user(**userinfo)
        elif isinstance(userinfo, list):
            for ui in userinfo:
                validate_dict(ui)
            with transaction.manager:
                for ui in userinfo:
                    add_user(**ui)
        else:
            print "Not a valid user file"
        exit()
    while not args.name:
        args.name = raw_input("Full name:")
    while not args.email or not emailre.match(args.email):
        args.email = raw_input("Email address:")
    if not args.username:
        print "You did not set a username. Enter an empty string"\
            " for no username, or simply s for your system username, '%s'"\
            % (getuser(),)
        args.username = raw_input()
    if args.username.lower() == 's':
        args.username = getuser()
    while not args.password:
        password = getpass("Password:")
        password2 = getpass("Confirm password:")
        if password == password2:
            args.password = password
    if args.role:
        assert args.role in all_roles,\
            "Role %s does not exist" % (args.role, )
    if args.localrole:
        assert args.localrole in all_roles,\
            "Role %s does not exist" % (args.localrole, )
    assert bool(args.localrole) == bool(args.discussion),\
        "local role and discussion have to be defined together."
    with transaction.manager:
        add_user(**vars(args))


if __name__ == '__main__':
    main()
