from datetime import datetime
from cStringIO import StringIO
import csv

from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPBadRequest, HTTPUnauthorized, HTTPNotFound)
from pyramid.response import Response
from pyramid.settings import asbool
from simplejson import dumps
from sqlalchemy.sql import func
from sqlalchemy.orm import aliased

from ..traversal import (CollectionContext, InstanceContext)
from assembl.auth import (
    P_READ, Everyone, CrudPermissions, P_ADMIN_DISC, P_VOTE, P_DISC_STATS)
from assembl.auth.util import get_permissions
from assembl.models import (
    Idea, AbstractIdeaVote, User, AbstractVoteSpecification, VotingWidget,
    TokenVoteSpecification, LanguagePreferenceCollection)
from assembl.lib.sqla import get_named_class
from . import (FORM_HEADER, JSON_HEADER, check_permissions)


# Votes are private
@view_config(context=CollectionContext, renderer='json',
             request_method='GET', permission=P_READ,
             ctx_collection_class=AbstractIdeaVote)
def votes_collection_view(request):
    ctx = request.context
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized
    view = request.GET.get('view', None) or ctx.get_default_view() or 'id_only'
    tombstones = asbool(request.GET.get('tombstones', False))
    q = ctx.create_query(view == 'id_only', tombstones).join(
        User, AbstractIdeaVote.voter).filter(User.id == user_id)
    if view == 'id_only':
        return [ctx.collection_class.uri_generic(x) for (x,) in q.all()]
    else:
        return [i.generic_json(view, user_id) for i in q.all()]


@view_config(context=CollectionContext, request_method='POST',
             header=JSON_HEADER, permission=P_VOTE,
             ctx_collection_class=AbstractIdeaVote)
def votes_collection_add_json(request):
    ctx = request.context
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    spec = ctx.get_instance_of_class(AbstractVoteSpecification)
    if spec:
        required = spec.get_vote_class()
    else:
        required = ctx.collection_class
    widget = ctx.get_instance_of_class(VotingWidget)
    if not widget and spec:
        widget = spec.widget
    if not widget:
        raise HTTPBadRequest("Please provide a reference to a widget")
    if widget.activity_state != 'active':
        raise HTTPUnauthorized("Not in voting period")
    typename = request.json_body.get('@type', None)
    if typename:
        cls = get_named_class(typename)
        if not issubclass(cls, required):
            raise HTTPBadRequest("@type is %s, should be in %s" % (
                typename, spec.get_vote_class().__name__))
    else:
        typename = required.external_typename()
    json = request.json_body
    json['voter'] = User.uri_generic(user_id)
    if "@type" not in json:
        json["@type"] = typename
    else:
        pass  # TODO: Check subclass
    try:
        instances = ctx.create_object(typename, json, user_id)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        db.flush()
        # validate after flush so we can check validity with DB constraints
        if not first.is_valid():
            raise HTTPBadRequest("Invalid vote")
        view = request.GET.get('view', None) or 'default'
        return Response(
            dumps(first.generic_json(view, user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)


@view_config(context=CollectionContext, request_method='POST',
             permission=P_VOTE, header=FORM_HEADER,
             ctx_collection_class=AbstractIdeaVote)
def votes_collection_add(request):
    ctx = request.context
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized
    permissions = get_permissions(
        user_id, ctx.get_discussion_id())
    check_permissions(ctx, user_id, permissions, CrudPermissions.CREATE)
    widget = ctx.get_instance_of_class(VotingWidget)
    if widget.activity_state != 'active':
        raise HTTPUnauthorized("Not in voting period")
    args = dict(request.params)
    spec = ctx.get_instance_of_class(AbstractVoteSpecification)
    if spec:
        required = spec.get_vote_class()
    else:
        required = ctx.collection_class
    if 'type' in args:
        typename = args['type']
        del args['type']
        cls = get_named_class(typename)
        if not issubclass(cls, required):
            raise HTTPBadRequest("@type is %s, should be in %s" % (
                typename, spec.get_vote_class().__name__))
    else:
        typename = required.external_typename()
    args['voter_id'] = user_id
    try:
        instances = ctx.create_object(typename, None, user_id, **args)
    except Exception as e:
        raise HTTPBadRequest(e)
    if instances:
        first = instances[0]
        if not first.is_valid():
            raise HTTPBadRequest("Invalid vote")
        db = first.db
        for instance in instances:
            db.add(instance)
        print "before flush"
        db.flush()
        print "after flush"
        return Response(
            dumps(first.generic_json('default', user_id, permissions)),
            location=first.uri_generic(first.id),
            status_code=201)
    raise HTTPBadRequest()


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=AbstractVoteSpecification,
             name="vote_results", renderer="json",
             permission=P_READ)
def vote_results(request):
    ctx = request.context
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized
    histogram = request.GET.get('histogram', None)
    if histogram:
        try:
            histogram = int(histogram)
        except ValueError as e:
            raise HTTPBadRequest(e)
        if histogram > 25:
            raise HTTPBadRequest(
                "Please select at most 25 bins in the histogram.")
    widget = ctx._instance.widget
    if widget.activity_state != "ended":
        permissions = get_permissions(user_id, ctx.get_discussion_id())
        if P_ADMIN_DISC not in permissions:
            raise HTTPUnauthorized()
    return ctx._instance.voting_results(histogram)

@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=AbstractVoteSpecification,
             name="vote_results_csv", permission=P_DISC_STATS)
def vote_results_csv(request):
    ctx = request.context
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized
    histogram = request.GET.get('histogram', None)
    if histogram:
        try:
            histogram = int(histogram)
        except ValueError as e:
            raise HTTPBadRequest(e)
        if histogram > 25:
            raise HTTPBadRequest(
                "Please select at most 25 bins in the histogram.")
    widget = ctx._instance.widget
    if widget.activity_state != "ended":
        permissions = get_permissions(user_id, ctx.get_discussion_id())
        if P_ADMIN_DISC not in permissions:
            raise HTTPUnauthorized()
    output = StringIO()
    ctx._instance.csv_results(output, histogram)
    output.seek(0)
    return Response(body_file=output, content_type='text/csv')


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=VotingWidget,
             name="vote_results_csv", permission=P_DISC_STATS)
def global_vote_results_csv(request):
    ctx = request.context
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized
    widget = ctx._instance
    if widget.activity_state != "ended":
        permissions = get_permissions(user_id, ctx.get_discussion_id())
        if P_ADMIN_DISC not in permissions:
            raise HTTPUnauthorized()
    user_prefs = LanguagePreferenceCollection.getCurrent()
    # first fetch the ideas voted on
    ideas = widget.db.query(Idea
        ).join(AbstractIdeaVote, AbstractIdeaVote.idea_id==Idea.id
        ).join(AbstractVoteSpecification
        ).filter(AbstractVoteSpecification.widget_id==widget.id
        ).distinct().all()
    idea_ids = [i.id for i in ideas]
    titles = [(idea.safe_title(user_prefs, request.localizer), idea.id) for idea in ideas]
    titles.sort()
    q = widget.db.query(Idea.id).filter(Idea.id.in_(idea_ids))
    # then get the vote specs
    specs = [(spec.title.best_lang(user_prefs).value if spec.title else str(spec.id), spec)
             for spec in widget.vote_specifications]
    specs.sort()
    # construct a query with each votespec creating two columns:
    # sum of vote values, and count of votes.
    # Ideas are rows (and Idea.id is column 0)
    for (t, spec) in specs:
        a = aliased(spec.get_vote_class(), name="votes_%d"%spec.id)
        q = q.outerjoin(a, (a.idea_id==Idea.id) & (a.vote_spec_id==spec.id))
        q = q.add_columns(func.sum(a.vote_value).label('vsum_%d' % spec.id),
                          func.count(a.id).label('vcount_%d' % spec.id))
    q = q.group_by(Idea.id)
    r = q.all()
    r = {x[0]: x for x in r}
    output = StringIO()
    csvw = csv.writer(output)
    csvw.writerow([""]+[t.encode('utf-8') for (t, spec) in specs])
    for title, idea_id in titles:
        row = [title.encode('utf-8')]
        sourcerow = r[idea_id][1:]
        for i, (t, spec) in enumerate(specs):
            num = sourcerow[1+i*2]
            if num:
                if isinstance(spec, TokenVoteSpecification):
                    # we want total number of tokens
                    num = 1
                # otherwise we want average vote value
                row.append(sourcerow[i*2]/num)
            else:
                row.append("")
        csvw.writerow(row)
    output.seek(0)
    return Response(body_file=output, content_type='text/csv')
