from copy import deepcopy
import itertools
from collections import defaultdict

from sqlalchemy.orm import class_mapper, undefer, with_polymorphic
from sqlalchemy.orm.session import make_transient
from sqlalchemy.orm.properties import ColumnProperty

from ..models import (
    DiscussionBoundBase, Discussion, AgentProfile, Webpage, Permission,
    Role, IdentityProvider, IdentityProviderAccount, EmailAccount, User)
from assembl.lib.sqla import class_registry

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
    assert isinstance(perm, Permission)
    return find_or_create_object_by_keys(db, perm, ['name'])

def find_or_create_role(db, role):
    assert isinstance(role, Role)
    return find_or_create_object_by_keys(db, role, ['name'])

def find_or_create_webpage(db, page):
    assert isinstance(page, Webpage)
    page = find_or_create_object_by_keys(db, page, ['url'])
    # Do something with last_modified_date?
    return page

def find_or_create_identity_provider(db, provider):
    assert isinstance(provider, IdentityProvider)
    return find_or_create_object_by_keys(db, obj, ['provider_type', 'name'])

def find_or_create_email_account(db, account):
    assert isinstance(account, EmailAccount)
    return find_or_create_object_by_keys(db, obj, ['email'], ['preferred'])

def find_or_create_provider_account(db, account):
    assert isinstance(account, IdentityProviderAccount)
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
    assert isinstance(profile, AgentProfile)
    accounts = []
    profiles = set()
    for account in profile.accounts:
        if isinstance(account, EmailAccount):
            eq = find_or_create_email_account(account)
        elif isinstance(account, IdentityProviderAccount):
            eq= find_or_create_provider_account(account)
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

special_classes = {
    AgentProfile: find_or_create_agent_profile,
    User: find_or_create_agent_profile,
    Webpage: find_or_create_webpage,
    Permission: find_or_create_permission,
    Role: find_or_create_role}

def print_path(path):
    print [(x, y.__class__.__name__, y.id) for (x,y) in path]


def prefetch(session, discussion_id):
    for name, cls in class_registry.items():
        if issubclass(cls, DiscussionBoundBase) and cls != DiscussionBoundBase:
            mapper = class_mapper(cls)
            undefers = [undefer(attr.key) for attr in mapper.iterate_properties
                        if getattr(attr, 'deferred', False)]
            condition = cls.get_discussion_condition(discussion_id)
            session.query(with_polymorphic(cls, "*")).filter(condition).options(*undefers).all()


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
            if isinstance(subob, special_classes.keys()):
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
        class_info[mapper] = (direct_reln, copy_col_props, nullable_relns, non_nullable_reln)
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



def clone_discussion(from_session, discussion_id, to_session=None, new_slug=None):
    discussion = Discussion.get(id=discussion_id)
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
        if isinstance(ob, special_classes.keys()):
            if from_session == to_session:
                copy = ob
            else:
                copy = special_classes[ob.__class__](ob)
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
        if isinstance(ob, special_classes.keys()):
            if from_session == to_session:
                copy = ob
            else:
                copy = special_classes[ob.__class__](ob)
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
    recursive_clone(discussion, path)
    stage_2_rec_clone(discussion, path)
    to_session.flush()
