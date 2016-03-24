#!env python
import itertools
from collections import defaultdict
import argparse
from inspect import isabstract
import logging.config
import traceback
from functools import partial
import pdb

from pyramid.paster import get_appsettings, bootstrap
from sqlalchemy.orm import (
    class_mapper, undefer, with_polymorphic, sessionmaker)
from sqlalchemy.orm.properties import ColumnProperty
import transaction
from sqlalchemy.sql.visitors import ClauseVisitor
from sqlalchemy.sql.expression import and_

from assembl.auth import SYSTEM_ROLES, ASSEMBL_PERMISSIONS
from assembl.lib.config import set_config
from assembl.lib.sqla import (
    configure_engine, get_session_maker, make_session_maker)
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.model_watcher import configure_model_watcher


def find_or_create_object_by_keys(db, keys, obj, columns=None):
    args = {key: getattr(obj, key) for key in keys}
    eq = db.query(obj.__class__).filter_by(**args).first()
    if eq is None:
        if columns is not None:
            args.update({key: getattr(obj, key) for key in columns})
        eq = obj.__class__(**args)
        db.add(eq)
    return eq


fn_for_classes = None

user_refs = None

def init_key_for_classes(db):
    global fn_for_classes, user_refs
    from assembl.models import (
        AgentProfile, User, Permission, Role, Webpage, Action, LocalUserRole,
        IdentityProvider, EmailAccount, WebLinkAccount, NotificationSubscription)
    fn_for_classes = {
        AgentProfile: partial(find_or_create_agent_profile, db),
        User: partial(find_or_create_agent_profile, db),
        Webpage: partial(find_or_create_object_by_keys, db, ['url']),
        Permission: partial(find_or_create_object_by_keys, db, ['name']),
        Role: partial(find_or_create_object_by_keys, db, ['name']),
        IdentityProvider: partial(find_or_create_object_by_keys, db, ['provider_type', 'name']),
        EmailAccount: partial(find_or_create_object_by_keys, db, ['email'], columns=['preferred']),
        WebLinkAccount: partial(find_or_create_object_by_keys, db, ['user_link']),
    }
    user_refs = {
        Action: 'actor',
        NotificationSubscription: 'user',
        LocalUserRole: 'user',
    }


def find_or_create_object(ob):
    global fn_for_classes
    assert ob.__class__ in fn_for_classes
    return fn_for_classes[ob.__class__](ob)


def is_special_class(ob):
    global fn_for_classes
    if ob.__class__ in fn_for_classes:
        return True
    if ob.__class__.__name__ == 'UserTemplate':
        return False
    assert not isinstance(ob, tuple(fn_for_classes.keys())),\
        "Missing subclass: "+ob.__class__
    return False


def find_or_create_provider_account(db, account):
    from assembl.models import SocialAuthAccount
    assert isinstance(account, SocialAuthAccount)
    # Note: need a similar one for SourceSpecificAccount
    provider = find_or_create_object(account.provider)
    args = {
        "provider": provider,
        "uid": account.uid,
        "username": account.username,
        "provider_domain": account.provider_domain
    }
    to_account = db.query(SocialAuthAccount).filter_by(**args).first()
    if to_account is None:
        for k in ['profile_info', 'picture_url']:
            args[k] = getattr(account, k)
        to_account = account.__class__(**args)
        db.add(to_account)
    return to_account


def find_or_create_agent_profile(db, profile):
    from assembl.models import (
        AgentProfile, SocialAuthAccount, User)
    assert isinstance(profile, AgentProfile)
    accounts = []
    profiles = set()
    for account in profile.accounts:
        if isinstance(account, SocialAuthAccount):
            eq = find_or_create_provider_account(db, account)
        else:
            eq = find_or_create_object(account)
        if eq.profile:
            profiles.add(eq.profile)
        accounts.append(eq)
    if not profiles:
        cols = ['name', 'description']
        # if isinstance(profile, User):
        #     cols += ["preferred_email", "timezone"]
        new_profile = AgentProfile(**{k: getattr(profile, k) for k in cols})
        db.add(new_profile)
    else:
        user_profiles = {p for p in profiles if isinstance(p, User)}
        if user_profiles:
            new_profile = user_profiles.pop()
            profiles.remove(new_profile)
        else:
            new_profile = profiles.pop()
        while profiles:
            new_profile.merge(profiles.pop())
    for account in accounts:
        if account.profile is None:
            account.profile = new_profile
            db.add(account)
    return new_profile


def find_or_create_user_template(db, template):
    pass

def print_path(path):
    print [(x, y.__class__.__name__, y.id) for (x, y) in path]


def prefetch(session, discussion_id):
    from assembl.lib.sqla import class_registry
    from assembl.models import DiscussionBoundBase
    for name, cls in class_registry.items():
        if issubclass(cls, DiscussionBoundBase) and not isabstract(cls):
            mapper = class_mapper(cls)
            undefers = [undefer(attr.key) for attr in mapper.iterate_properties
                        if getattr(attr, 'deferred', False)]
            conditions = cls.get_discussion_conditions(discussion_id)
            session.query(with_polymorphic(cls, "*")).filter(
                and_(*conditions)).options(*undefers).all()


def recursive_fetch(ob, visited=None):
    # Not used
    visited = visited or {ob}
    mapper = class_mapper(ob.__class__)

    for attr in mapper.iterate_properties:
        if getattr(attr, 'deferred', False):
            getattr(ob, attr.key)
    for reln in mapper.relationships:
        subobs = getattr(ob, reln.key)
        if not subobs:
            continue
        if not isinstance(subobs, list):
            subobs = [subobs]
        for subob in subobs:
            if subob in visited:
                continue
            visited.add(subob)
            if is_special_class(subob):
                continue
            recursive_fetch(subob, visited)

class_info = {}


def get_mapper_info(mapper):
    if mapper not in class_info:
        pk_keys_cols = set([c for c in mapper.primary_key])
        direct_reln = {r for r in mapper.relationships
                       if r.direction.name == 'MANYTOONE'}
        direct_reln_cols = set(itertools.chain(
            *[r.local_columns for r in direct_reln]))
        avoid_columns = pk_keys_cols.union(direct_reln_cols)
        copy_col_props = {a for a in mapper.iterate_properties
                          if isinstance(a, ColumnProperty)
                          and not avoid_columns.intersection(set(a.columns))}

        non_nullable_reln = {
            r for r in direct_reln
            if any([not c.nullable for c in r.local_columns])}
        nullable_relns = direct_reln - non_nullable_reln
        class_info[mapper] = (
            direct_reln, copy_col_props, nullable_relns, non_nullable_reln)
    return class_info[mapper]


def assign_dict(values, r, subob):
    assert r.direction.name == 'MANYTOONE'
    values[r.key] = subob
    for col in r.local_columns:
        if col.foreign_keys:
            fkcol = next(iter(col.foreign_keys)).column
            k = next(iter(r.local_columns))
            values[col.key] = getattr(subob, fkcol.key)


def assign_ob(ob, r, subob):
    assert r.direction.name == 'MANYTOONE'
    setattr(ob, r.key, subob)
    for col in r.local_columns:
        if col.foreign_keys:
            fkcol = next(iter(col.foreign_keys)).column
            k = next(iter(r.local_columns))
            setattr(ob, col.key, getattr(subob, fkcol.key))


class JoinColumnsVisitor(ClauseVisitor):
    def __init__(self, cls, query, classes_by_table):
        super(JoinColumnsVisitor, self).__init__()
        self.classes = {cls}
        self.query = query
        self.classes_by_table = classes_by_table
        self.missing = []

    def is_known_class(self, cls):
        if cls in self.classes:
            return True
        for other_cls in self.classes:
            if issubclass(cls, other_cls):
                self.classes.add(cls)
                return True
            elif issubclass(other_cls, cls):
                self.classes.add(cls)
                return True

    def treat_column(self, column):
        source_cls = self.classes_by_table[column.table]
        foreign_keys = getattr(column, 'foreign_keys', ())
        for foreign_key in foreign_keys:
            # Do not bother with inheritance here
            dest_cls = self.classes_by_table[foreign_key.column.table]
            if not self.is_known_class(dest_cls):
                orm_reln = filter(
                    lambda r: column in r.local_columns and r.secondary is None,
                    source_cls.__mapper__.relationships)
                assert len(orm_reln) == 1, "wrong orm_reln for %s.%s : %s" % (
                    column.table.name, column.name, str(orm_reln))
                rattrib = getattr(source_cls, orm_reln[0].key)
                self.query = self.query.join(dest_cls, rattrib)
                self.classes.add(dest_cls)

    def final_query(self):
        while len(self.missing):
            missing = []
            for column in self.missing:
                source_cls = self.classes_by_table[column.table]
                if self.is_known_class(source_cls):
                    self.treat_column(column)
                else:
                    missing.append(column)
            if len(missing) == len(self.missing):
                break
            self.missing = missing
        assert not self.missing
        return self.query

    def visit_column(self, column):
        source_cls = self.classes_by_table[column.table]
        if not self.is_known_class(source_cls):
            self.missing.append(column)
            return
        self.treat_column(column)


def delete_discussion(session, discussion_id):
    from assembl.models import Discussion, DiscussionBoundBase
    # delete anything related first
    classes = DiscussionBoundBase._decl_class_registry.itervalues()
    classes_by_table = {
        cls.__dict__.get('__table__', None): cls for cls in classes
        if isinstance(cls, type)}
    # Only direct subclass of abstract
    concrete_classes = set(filter(lambda cls:
        issubclass(cls, DiscussionBoundBase) and (not isabstract(cls))
        and isabstract(cls.mro()[1]),
        classes_by_table.values()))
    tables = DiscussionBoundBase.metadata.sorted_tables
    tables.reverse()
    for table in tables:
        if table not in classes_by_table:
            continue
        cls = classes_by_table[table]
        if cls not in concrete_classes:
            continue
        print 'deleting', cls.__name__
        query = session.query(cls.id)
        conds = cls.get_discussion_conditions(discussion_id)
        assert conds
        cond = and_(*conds)
        v = JoinColumnsVisitor(cls, query, classes_by_table)
        v.traverse(cond)
        query = v.final_query().filter(cond)
        if query.count():
            print "*" * 20, "Not all deleted!"
            session.query(cls).filter(
                cls.id.in_(query.subquery())).delete(False)
        session.flush()
    # Then, delete the discussion.
    session.delete(Discussion.get(discussion_id))
    session.flush()


def clone_discussion(
        from_session, discussion_id, to_session=None, new_slug=None):
    from assembl.models import (
        DiscussionBoundBase, Discussion, Post, User, LocalUserRole, Action)
    global user_refs
    discussion = from_session.query(Discussion).get(discussion_id)
    assert discussion
    prefetch(from_session, discussion_id)
    changes = defaultdict(dict)
    if to_session is None:
        to_session = from_session
        changes[discussion]['slug'] = new_slug or (discussion.slug + "_copy")
    else:
        changes[discussion]['slug'] = new_slug or discussion.slug
    copies_of = {}
    copies = set()
    in_process = set()
    promises = defaultdict(list)

    def resolve_promises(ob, copy):
        if ob in promises:
            for (o, reln) in promises[ob]:
                print 'fullfilling', o.__class__, o.id
                assign_ob(o, reln, copy)
            del promises[ob]

    def recursive_clone(ob, path):
        if ob in copies_of:
            return copies_of[ob]
        if ob in copies:
            return ob
        if ob in in_process:
            print "in process", ob.__class__, ob.id
            return None
        if is_special_class(ob):
            if from_session == to_session:
                copy = ob
            else:
                copy = find_or_create_object(ob)
                to_session.flush()
            assert copy is not None
            copies_of[ob] = copy
            return copy
        if isinstance(ob, DiscussionBoundBase):
            assert discussion_id == ob.get_discussion_id()
        print "recursive_clone",
        print_path(path)

        mapper = class_mapper(ob.__class__)
        (direct_reln, copy_col_props, nullable_relns, non_nullable_reln
         ) = get_mapper_info(mapper)
        values = {r.key: getattr(ob, r.key, None) for r in copy_col_props}

        print "->", ob.__class__, ob.id
        in_process.add(ob)
        for r in non_nullable_reln:
            subob = getattr(ob, r.key, None)
            if subob is None:
                from assembl.models import Idea, IdeaLink
                # Those might be None because the underlying idea is tombstoned
                if isinstance(ob, IdeaLink):
                    subob_id = None
                    if r.key == 'source':
                        subob_id = ob.source_id
                    elif r.key == 'target':
                        subob_id = ob.target_id
                    if subob_id:
                        subob = from_session.query(Idea).get(subob_id)
            assert subob is not None
            assert subob not in in_process
            print 'recurse ^0', r.key, subob.id
            result = recursive_clone(subob, path + [(r.key, subob)])
            assert result is not None
            assert result.id
            print 'result', result.__class__, result.id
            assign_dict(values, r, result)
        local_promises = {}
        for r in nullable_relns:
            subob = getattr(ob, r.key, None)
            if subob is not None:
                if subob in copies_of:
                    assign_dict(values, r, copies_of[subob])
                else:
                    local_promises[r] = subob
        values.update(changes[ob])
        if isinstance(ob, Discussion):
            values['table_of_contents'] = None
            values['root_idea'] = None
            values['next_synthesis'] = None
        elif isinstance(ob, tuple(user_refs.keys())):
            for cls in ob.__class__.mro():
                if cls in user_refs:
                    user = values.get(user_refs[cls])
                    if not isinstance(user, User):
                        return ob
                    break
        copy = ob.__class__(**values)
        to_session.add(copy)
        to_session.flush()
        print "<-", ob.__class__, ob.id, copy.id
        copies_of[ob] = copy
        copies.add(copy)
        in_process.remove(ob)
        resolve_promises(ob, copy)
        for reln, subob in local_promises.items():
            if subob in in_process:
                promises[subob].append((copy, reln))
            else:
                print 'recurse 0', reln.key, subob.id
                result = recursive_clone(subob, path + [(reln.key, subob)])
                if result is None:  # in process
                    print "promising", subob.__class__, subob.id, reln.key
                    promises[subob].append((copy, reln))
                else:
                    print "resolving promise", reln.key, result.__class__, result.id
                    assign_ob(copy, reln, result)
        to_session.flush()
        return copy

    treating = set()

    def stage_2_rec_clone(ob, path):
        if ob in treating:
            return
        if is_special_class(ob):
            if from_session == to_session:
                copy = ob
            else:
                copy = find_or_create_object(ob)
                to_session.flush()
            assert copy is not None
            copies_of[ob] = copy
            return copy
        print "stage_2_rec_clone",
        if isinstance(ob, DiscussionBoundBase):
            assert discussion_id == ob.get_discussion_id()
        print_path(path)
        treating.add(ob)
        if ob in copies_of:
            copy = copies_of[ob]
        elif ob in copies:
            copy = ob
        else:
            copy = recursive_clone(ob, path)
            resolve_promises(ob, copy)
        treating.add(copy)
        mapper = class_mapper(ob.__class__)
        (
            direct_reln, copy_col_props, nullable_relns, non_nullable_reln
        ) = get_mapper_info(mapper)
        for r in mapper.relationships:
            if r in direct_reln:
                continue
            subobs = getattr(ob, r.key)
            if subobs is None:
                continue
            if not isinstance(subobs, list):
                subobs = [subobs]
            for subob in subobs:
                stage_2_rec_clone(subob, path + [(r.key, subob)])

    path = [('', discussion)]
    copy = recursive_clone(discussion, path)
    stage_2_rec_clone(discussion, path)
    to_session.flush()
    for p in to_session.query(Post).filter_by(
            discussion=copy, parent_id=None).all():
        p._set_ancestry('')
    to_session.flush()
    return copy


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "configuration",
        help="configuration file with destination database configuration")
    parser.add_argument("-n", "--new_name", help="slug of new discussion")
    parser.add_argument("-d", "--delete", action="store_true", default=False,
                        help="delete discussion copy if exists")
    parser.add_argument("--debug", action="store_true", default=False,
                        help="enter pdb on failure")
    parser.add_argument(
        "-s", "--source_db_configuration",
        help="""configuration file with source database configuration, if distinct.
        Be aware that ODBC.ini settings are distinct.""")
    parser.add_argument("discussion", help="original discussion slug")
    parser.add_argument("-p", "--permissions", action="append", default=[],
                        help="Add a role+permission pair to the copy "
                        "(eg system.Authenticated+admin_discussion)")
    args = parser.parse_args()
    env = bootstrap(args.configuration)
    logging.config.fileConfig(args.configuration)
    settings = get_appsettings(args.configuration, 'assembl')
    set_config(settings)
    raven_client = None
    try:
        pipeline = settings.get('pipeline:main', 'pipeline').split()
        if 'raven' in pipeline:
            raven_dsn = settings.get('filter:raven', 'dsn')
            from raven import Client
            raven_client = Client(raven_dsn)
    except Exception:
        pass
    try:
        configure_zmq(settings['changes.socket'], False)
        configure_model_watcher(env['registry'], 'assembl')
        to_engine = configure_engine(settings, True)
        to_session = get_session_maker()
        init_key_for_classes(to_session)
        new_slug = args.new_name or (args.discussion + "_copy")
        if args.source_db_configuration:
            from_session = make_session_maker(zope_tr=True)
            settings = get_appsettings(args.source_db_configuration, 'assembl')
            from_engine = configure_engine(settings, session_maker=from_session)
            from_session = sessionmaker(from_engine)()
        else:
            from_engine = to_engine
            from_session = to_session
        from assembl.models import Discussion
        discussion = from_session.query(Discussion).filter_by(
            slug=args.discussion).one()
        assert discussion, "No discussion named " + args.discussion
        permissions = [x.split('+') for x in args.permissions]
        for (role, permission) in permissions:
            assert role in SYSTEM_ROLES
            assert permission in ASSEMBL_PERMISSIONS
        existing = to_session.query(Discussion).filter_by(slug=new_slug).first()
        if existing:
            if args.delete:
                print "deleting", new_slug
                with transaction.manager:
                    delete_discussion(to_session, existing.id)
            else:
                print "Discussion", new_slug,
                print "already exists! Add -d to delete it."
                exit(0)
        with transaction.manager:
            from assembl.models import Role, Permission, DiscussionPermission
            copy = clone_discussion(
                from_session, discussion.id, to_session, new_slug)
            for (role, permission) in permissions:
                role = to_session.query(Role).filter_by(name=role).one()
                permission = to_session.query(Permission).filter_by(
                    name=permission).one()
                # assumption: Not already defined.
                to_session.add(DiscussionPermission(
                    discussion=copy, role=role, permission=permission))
    except Exception:
        traceback.print_exc()
        if args.debug:
            pdb.post_mortem()
        elif raven_client:
            raven_client.captureException()
