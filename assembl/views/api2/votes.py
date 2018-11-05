from cStringIO import StringIO
import csv
from collections import defaultdict
import operator

from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPBadRequest, HTTPUnauthorized)
from pyramid.response import Response
from pyramid.settings import asbool
from simplejson import dumps
from sqlalchemy.sql import func

from ..traversal import (CollectionContext, InstanceContext)
from assembl.auth import (
    P_READ, CrudPermissions, P_ADMIN_DISC, P_VOTE, P_DISC_STATS)
from assembl.auth.util import get_permissions
from assembl.models import (
    Idea, AbstractIdeaVote, User, AbstractVoteSpecification, VotingWidget,
    NumberGaugeVoteSpecification, TokenVoteSpecification, LanguagePreferenceCollection)
from assembl.lib.sqla import get_named_class
from . import (FORM_HEADER, JSON_HEADER, check_permissions)
from assembl.views.api2.discussion import csv_response, CSV_MIMETYPE

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


def range_float(minimum, maximum, nb_ticks):
    step = (maximum - minimum) / (nb_ticks - 1)
    i = minimum
    yield i
    while i < maximum:
        i += step
        yield i


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
                            ).join(AbstractVoteSpecification
                                   ).filter(AbstractVoteSpecification.widget_id == widget.id
                                            ).distinct().all()
    rowtitles = [(idea.safe_title(user_prefs, request.localizer), idea.id) for idea in ideas]
    rowtitles.sort()
    specs = widget.vote_specifications
    # specs and their templates
    specids_by_template_specid = defaultdict(list)
    spec_by_idea_id_and_template_specid = {}
    for spec in specs:
        specids_by_template_specid[spec.vote_spec_template_id or spec.id].append(spec.id)
        spec_by_idea_id_and_template_specid[(spec.criterion_idea_id, (spec.vote_spec_template_id or spec.id))] = spec
    # then get the vote specs templates only
    template_specs = [(spec.title.best_lang(user_prefs).value if spec.title else str(spec.id), spec)
                      for spec in widget.specification_templates]
    template_specs.sort()
    coltitles = ["Proposition", "Nombre de participants sur la proposition"]

    # number of participants for a proposal (distinct voter_id from all specs related to the proposal)
    num_participants_by_idea_id = {}
    for idea in ideas:
        vote_specifications = idea.criterion_for
        query = vote_specifications[0].get_voter_ids_query()
        for vote_spec in vote_specifications[1:]:
            query = query.union(vote_spec.get_voter_ids_query())
        num_participants_by_idea_id[idea.id] = query.count()

    # construct a query with each votespec creating columns for:
    # either each token count (for token votes) OR
    # sum of vote values, and count of votes otherwise.
    # Ideas are rows (and Idea.id is column 0)
    for title, template_spec in template_specs:
        if isinstance(template_spec, TokenVoteSpecification):
            for tokencat in template_spec.token_categories:
                coltitles.append(tokencat.name.best_lang(user_prefs).value.encode('utf-8'))
        else:
            coltitles.append(u'{title} - moyenne'.format(title=title).encode('utf-8'))
            if isinstance(template_spec, NumberGaugeVoteSpecification):
                for choice_value in range_float(template_spec.minimum, template_spec.maximum, template_spec.nb_ticks):
                    coltitles.append(u'{value} {unit}'.format(value=choice_value, unit=template_spec.unit).encode('utf-8'))
            else:
                for choice in template_spec.get_choices():
                    coltitles.append(choice.label.best_lang(user_prefs).value.encode('utf-8'))
        coltitles.append('Total votes')

    output = StringIO()
    # include BOM for Excel to open the file in UTF-8 properly
    output.write(u'\ufeff'.encode('utf-8'))
    csvw = csv.writer(output)
    csvw.writerow(coltitles)
    from assembl.graphql.vote_session import get_avg_choice
    for title, idea_id in rowtitles:
        row = [title.encode('utf-8'), num_participants_by_idea_id[idea_id]]
        for t, template_spec in template_specs:
            spec = spec_by_idea_id_and_template_specid.get((idea_id, template_spec.id), None)
            if isinstance(template_spec, TokenVoteSpecification):
                for token_category in template_spec.token_categories:
                    if spec is None:
                        row.append('-')
                    else:
                        query = spec.db.query(
                            func.sum(getattr(spec.get_vote_class(), "vote_value"))).filter_by(
                            vote_spec_id=spec.id,
                            tombstone_date=None,
                            token_category_id=token_category.id)
                        # when there is no votes, query.first() equals (None,)
                        # in this case set num_token to 0
                        num_token = query.first()[0]
                        row.append(num_token or "-")
            else:  # this is a number or text gauge
                if spec is None:
                    row.append('-')
                    if isinstance(template_spec, NumberGaugeVoteSpecification):
                        for choice_value in range_float(template_spec.minimum, template_spec.maximum, template_spec.nb_ticks):
                            row.append('-')
                    else:
                        for choice in template_spec.get_choices():
                            row.append('-')
                elif isinstance(template_spec, NumberGaugeVoteSpecification):
                    vote_cls = spec.get_vote_class()
                    voting_avg = spec.db.query(func.avg(getattr(vote_cls, 'vote_value'))).filter_by(
                        vote_spec_id=spec.id,
                        tombstone_date=None,
                        idea_id=spec.criterion_idea_id).first()
                    # when there is no votes, query.first() equals (None,)
                    avg = voting_avg[0] or '-'
                    row.append(avg)

                    q_histogram = spec.db.query(getattr(vote_cls, 'vote_value'), func.count(getattr(vote_cls, 'voter_id'))).filter_by(
                        vote_spec_id=spec.id,
                        tombstone_date=None,
                        idea_id=spec.criterion_idea_id).group_by(getattr(vote_cls, 'vote_value'))
                    histogram = dict(q_histogram.all())
                    for choice_value in range_float(template_spec.minimum, template_spec.maximum, template_spec.nb_ticks):
                        row.append(histogram.get(choice_value, 0))
                else:
                    vote_cls = spec.get_vote_class()
                    avg_choice = get_avg_choice(spec)
                    if not avg_choice:
                        label_avg = '-'
                    else:
                        label_avg = avg_choice.label.best_lang(user_prefs).value.encode('utf-8')
                    row.append(label_avg)

                    q_histogram = spec.db.query(getattr(vote_cls, 'vote_value'), func.count(getattr(vote_cls, 'voter_id'))).filter_by(
                        vote_spec_id=spec.id,
                        tombstone_date=None,
                        idea_id=spec.criterion_idea_id).group_by(getattr(vote_cls, 'vote_value'))
                    histogram = dict(q_histogram.all())
                    for choice in template_spec.get_choices():
                        row.append(histogram.get(choice.value, 0))

            if spec is None:
                row.append('-')
            else:
                num_votes = spec.db.query(
                    getattr(spec.get_vote_class(), "voter_id")).filter_by(
                    vote_spec_id=spec.id,
                    tombstone_date=None).count()
                row.append(num_votes)
        csvw.writerow(row)
    output.seek(0)
    return Response(body_file=output, content_type='text/csv', content_disposition='attachment; filename="vote_results.csv"')


@view_config(context=InstanceContext, name="extract_csv_voters",
             ctx_instance_class=VotingWidget, request_method='GET',
             permission=P_DISC_STATS)
def extract_voters(request):
    extract_votes = []
    ctx = request.context
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized
    widget = ctx._instance
    user_id = request.authenticated_userid
    if widget.activity_state != "ended":
        permissions = get_permissions(user_id, ctx.get_discussion_id())
        if P_ADMIN_DISC not in permissions:
            raise HTTPUnauthorized()
    user_prefs = LanguagePreferenceCollection.getCurrent()
    fieldnames = ["Nom du contributeur", "Adresse mail du contributeur", "Date/heure du vote", "Proposition"]
    votes = widget.db.query(AbstractIdeaVote
        ).filter(AbstractVoteSpecification.widget_id==widget.id
        ).filter(AbstractIdeaVote.tombstone_date == None
        ).order_by(AbstractIdeaVote.vote_spec_id.desc()
        ).all()
    for count, vote in enumerate(votes):
        voter = vote.voter
        contributor = voter.display_name() or u""
        contributor_mail = voter.get_preferred_email() or u""
        vote_date = vote.vote_date or u""
        proposition = Idea.get(vote.idea_id).title.best_lang(user_prefs).value or u""
        vote_value = vote.vote_value

        if votes[count].vote_spec_id != votes[count-1].vote_spec_id and fieldnames[-1] != "  ":
            fieldnames.append("  ")

        extract_info = {
            "Nom du contributeur": contributor.encode('utf-8'),
            "Adresse mail du contributeur": contributor_mail.encode('utf-8'),
            "Date/heure du vote": str(vote_date),
            "Proposition": proposition.encode('utf-8'),
        }

        if vote.type == u'token_idea_vote':
            token_category = vote.token_category.name.best_lang(user_prefs).value or u""
            if token_category not in fieldnames:
                fieldnames.append(token_category.encode('utf-8'))
            extract_info.update({token_category: str(vote_value)})
            extract_votes.append(extract_info)

        if vote.type == u'gauge_idea_vote':
            spec = vote.vote_spec
            if isinstance(spec, NumberGaugeVoteSpecification):
                for choice_value in range_float(spec.minimum, spec.maximum, spec.nb_ticks):
                    option = u"{} {}".format(choice_value, spec.unit).encode('utf-8')
                    if option not in fieldnames:
                        fieldnames.append(option)
                    extract_info.update({option: "1" if vote_value == choice_value else "0"})
            else:
                for choice in spec.get_choices():
                    option = choice.label.best_lang(user_prefs).value.encode('utf-8')
                    if option not in fieldnames:
                        fieldnames.append(option)
                    extract_info.update({option: "1" if vote_value == choice.value else "0"})

            extract_votes.append(extract_info)
    extract_votes.sort(key=operator.itemgetter('Nom du contributeur'))
    return csv_response(extract_votes, CSV_MIMETYPE, fieldnames, content_disposition='attachment; filename="detailed_vote_results.csv"')
