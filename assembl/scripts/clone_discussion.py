#!env python
import itertools
from collections import defaultdict
import argparse
from inspect import isabstract

from pyramid.paster import get_appsettings, bootstrap
from sqlalchemy.orm import class_mapper, undefer, with_polymorphic, sessionmaker
from sqlalchemy.orm.properties import ColumnProperty
import transaction
from sqlalchemy.sql.visitors import ClauseVisitor

from assembl.lib.config import set_config
from assembl.lib.sqla import configure_engine, get_session_maker
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.model_watcher import configure_model_watcher


def find_or_create_object_by_keys(db, obj, keys, columns=None):
    args = {key: getattr(obj, key) for key in keys}
    eq = db.query(obj.__class__).filter_by(**args).first()
    if eq is None:
        if columns is not None:
            args.update({key: getattr(obj, key) for key in columns})
        eq = obj.__class__(**args)
        db.add(eq)
    return eq


def find_or_create_permission(db, perm):
    from assembl.models import Permission
    assert isinstance(perm, Permission)
    return find_or_create_object_by_keys(db, perm, ['name'])


def find_or_create_role(db, role):
    from assembl.models import Role
    assert isinstance(role, Role)
    return find_or_create_object_by_keys(db, role, ['name'])


def find_or_create_webpage(db, page):
    from assembl.models import Webpage
    assert isinstance(page, Webpage)
    page = find_or_create_object_by_keys(db, page, ['url'])
    # Do something with last_modified_date?
    return page


def find_or_create_identity_provider(db, provider):
    from assembl.models import IdentityProvider
    assert isinstance(provider, IdentityProvider)
    return find_or_create_object_by_keys(db, obj, ['provider_type', 'name'])


def find_or_create_email_account(db, account):
    from assembl.models import EmailAccount
    assert isinstance(account, EmailAccount)
    return find_or_create_object_by_keys(db, obj, ['email'], ['preferred'])


def find_or_create_provider_account(db, account):
    from assembl.models import IdentityProviderAccount
    assert isinstance(account, IdentityProviderAccount, IdentityProvider)
    provider = find_or_create_identity_provider(account.provider)
    args = {
        "provider": provider,
        "userid": account.userid,
        "username": account.username,
        "domain": account.domain
    }
    account = db.query(IdentityProviderAccount).filter_by(**args).first()
    if account is None:
        for k in ['profile_info', 'picture_url']:
            args[k] = getattr(account, k)
        account = IdentityProvider(**args)
        db.add(account)
    return account


def find_or_create_agent_profile(db, profile):
    from assembl.models import (
        AgentProfile, IdentityProviderAccount, EmailAccount, User)
    assert isinstance(profile, AgentProfile)
    accounts = []
    profiles = set()
    for account in profile.accounts:
        if isinstance(account, EmailAccount):
            eq = find_or_create_email_account(account)
        elif isinstance(account, IdentityProviderAccount):
            eq = find_or_create_provider_account(account)
        if eq.profile:
            profiles.add(eq.profile)
        accounts.append(eq)
    if not profiles:
        cols = ['name', 'description']
        if isinstance(profile, User):
            cols += ["preferred_email", "timezone"]
        new_profile = AgentProfile(**{k: getattr(profile, k) for k in cols})
        db.add(new_profile)
    else:
        new_profile = profiles.pop()
        while profiles:
            new_profile = new_profile.merge(profiles.pop())
    for account in accounts:
        if account.profile is None:
            account.profile = new_profile
            db.add(account)
    return new_profile


def get_special_classes():
    from assembl.models import (
        AgentProfile, User, Webpage, Permission, Role)
    return {
        AgentProfile: find_or_create_agent_profile,
        User: find_or_create_agent_profile,
        Webpage: find_or_create_webpage,
        Permission: find_or_create_permission,
        Role: find_or_create_role}


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
            condition = cls.get_discussion_condition(discussion_id)
            session.query(with_polymorphic(cls, "*")).filter(
                condition).options(*undefers).all()


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
            if isinstance(subob, tuple(get_special_classes().keys())):
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

        non_nullable_reln = {r for r in direct_reln
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
                    lambda r: column in r.local_columns,
                    source_cls.__mapper__.relationships)
                assert len(orm_reln) == 1
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
    # First, delete the discussion.
    session.delete(Discussion.get(discussion_id))
    session.flush()
    # See if anything is left...
    classes = DiscussionBoundBase._decl_class_registry.itervalues()
    classes_by_table = {
        cls.__dict__.get('__table__', None): cls for cls in classes }
    # Only direct subclass of abstract
    concrete_classes = set(filter(lambda cls:
        issubclass(cls, DiscussionBoundBase) and (not isabstract(cls)) and isabstract(cls.mro()[1]),
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
        cond = cls.get_discussion_condition(discussion_id)
        assert cond is not None
        v = JoinColumnsVisitor(cls, query, classes_by_table)
        v.traverse(cond)
        query = v.final_query().filter(cond)
        if query.count():
            print "*" * 20, "Not all deleted!"
            session.query(cls).filter(cls.id.in_(query.subquery())).delete(False)


def clone_discussion(
        from_session, discussion_id, to_session=None, new_slug=None):
    from assembl.models import DiscussionBoundBase, Discussion, Post
    discussion = Discussion.get(discussion_id)
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
                print 'fullfilling', o.__class__, o.id, k
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
        if isinstance(ob, tuple(get_special_classes().keys())):
            if from_session == to_session:
                copy = ob
            else:
                copy = get_special_classes()[ob.__class__](ob)
            copies_of[ob] = copy
            return copy
        if isinstance(ob, DiscussionBoundBase):
            assert discussion_id == ob.get_discussion_id()
        print "recursive_clone",
        print_path(path)

        mapper = class_mapper(ob.__class__)
        (direct_reln, copy_col_props, nullable_relns, non_nullable_reln) = get_mapper_info(mapper)
        values = {r.key: getattr(ob, r.key, None) for r in copy_col_props}

        print "->", ob.__class__, ob.id
        in_process.add(ob)
        for r in non_nullable_reln:
            subob = getattr(ob, r.key, None)
            assert subob is not None
            assert subob not in in_process
            print 'recurse ^0', r.key
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
                print 'recurse 0', reln.key
                result = recursive_clone(subob, path + [(reln.key, subob)])
                if result is None:  # in process
                    print "promising", subob.__class__, subob.id, reln.key
                    promises[subob].append((copy, reln))
                else:
                    print "delayed", reln.key, result.__class__, result.id
                    assign_ob(copy, reln, result)
        return copy

    treating = set()

    def stage_2_rec_clone(ob, path):
        if ob in treating:
            return
        if isinstance(ob, tuple(get_special_classes().keys())):
            if from_session == to_session:
                copy = ob
            else:
                copy = get_special_classes()[ob.__class__](ob)
            copies_of[ob] = copy
            return copy
        print "stage_2_rec_clone",
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
        (direct_reln, copy_col_props, nullable_relns, non_nullable_reln) = get_mapper_info(mapper)
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


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "configuration",
        help="configuration file with destination database configuration")
    parser.add_argument("-n", "--new_name", help="slug of new discussion")
    parser.add_argument("-d", "--delete", action="store_true", default=False,
                        help="delete discussion copy if exists")
    parser.add_argument(
        "-c", "--connection_string",
        help="connection string of source database if different")
    parser.add_argument("discussion", help="original discussion slug")
    args = parser.parse_args()
    env = bootstrap(args.configuration)
    settings = get_appsettings(args.configuration)
    set_config(settings)
    configure_zmq(settings['changes.socket'], False)
    configure_model_watcher(env['registry'], 'assembl')
    to_engine = configure_engine(settings, True)
    to_session = get_session_maker()
    new_slug = args.new_name or (args.discussion + "_copy")
    if args.connection_string:
        from_engine = configure_engine(args.connection)
        from_session = session_maker(from_engine)()
    else:
        from_engine = to_engine
        from_session = to_session
    from assembl.models import Discussion
    discussion = from_session.query(Discussion).filter_by(
        slug=args.discussion).one()
    assert discussion, "No discussion named " + args.discussion
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
        clone_discussion(from_session, discussion.id, to_session, new_slug)
    # TODO: Options to clone participant permissions into 
    # Authenticated permissions. Maybe also to make globally readable.
