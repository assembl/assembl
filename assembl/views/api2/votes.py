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
from assembl.utils import format_date
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


PROPOSITION = "Proposition"
PARTICIPANTS_COUNT = "Nombre de participants sur la proposition"
TOTAL_VOTES = "Total votes"


def get_token_category_fieldname(title, token_category, user_prefs):
    return '{} [{}]'.format(
        token_category.name.best_lang(user_prefs).value.encode('utf-8'),
        title.encode('utf-8'))


def get_choice_average_fieldname(title):
    return u'moyenne [{title}]'.format(title=title).encode('utf-8')


def get_number_choice_fieldname(choice_value, template_spec, title):
    return u'{value} {unit} [{title}]'.format(value=choice_value, unit=template_spec.unit, title=title).encode('utf-8')


def get_text_choice_fieldname(choice, title, user_prefs):
    return '{} [{}]'.format(choice.label.best_lang(user_prefs).value.encode('utf-8'), title.encode('utf-8'))


def get_total_votes_fieldname(title):
    return '{} [{}]'.format(TOTAL_VOTES, title.encode('utf-8'))


def get_spec_title(spec, user_prefs):
    return spec.title.best_lang(user_prefs).value if spec.title else unicode(spec.id)


def global_vote_results_csv(widget, request):
    from .discussion import get_time_series_timing
    start, end, interval = get_time_series_timing(request)
    user_prefs = LanguagePreferenceCollection.getCurrent()
    # first fetch the ideas voted on
    ideas = widget.db.query(Idea
        ).join(Idea.criterion_for
        ).filter(Idea.tombstone_date == None
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
    template_specs = [(get_spec_title(spec, user_prefs), spec) for spec in widget.specification_templates]
    template_specs.sort()
    fieldnames = [PROPOSITION, PARTICIPANTS_COUNT]

    # number of participants for a proposal (distinct voter_id from all specs related to the proposal)
    num_participants_by_idea_id = {}
    for idea in ideas:
        num_participants_by_idea_id[idea.id] = idea.get_voter_ids_query().count()

    # construct a query with each votespec creating columns for:
    # either each token count (for token votes) OR
    # sum of vote values, and count of votes otherwise.
    # Ideas are rows (and Idea.id is column 0)
    for title, template_spec in template_specs:
        if isinstance(template_spec, TokenVoteSpecification):
            for tokencat in template_spec.token_categories:
                fieldnames.append(get_token_category_fieldname(title, tokencat, user_prefs))
        else:
            fieldnames.append(get_choice_average_fieldname(title))
            if isinstance(template_spec, NumberGaugeVoteSpecification):
                for choice_value in range_float(template_spec.minimum, template_spec.maximum, template_spec.nb_ticks):
                    fieldnames.append(get_number_choice_fieldname(choice_value, template_spec, title))
            else:
                for choice in template_spec.get_choices():
                    fieldnames.append(get_text_choice_fieldname(choice, title, user_prefs))
        fieldnames.append(get_total_votes_fieldname(title))

    rows = []
    from assembl.graphql.vote_session import get_avg_choice
    for title, idea_id in rowtitles:
        row = {}
        row[PROPOSITION] = title.encode('utf-8')
        row[PARTICIPANTS_COUNT] = num_participants_by_idea_id[idea_id]
        for title, template_spec in template_specs:
            spec = spec_by_idea_id_and_template_specid.get((idea_id, template_spec.id), None)
            if isinstance(template_spec, TokenVoteSpecification):
                for token_category in template_spec.token_categories:
                    fieldname = get_token_category_fieldname(title, token_category, user_prefs)
                    if spec is None:
                        row[fieldname] = '-'
                    else:
                        vote_cls = spec.get_vote_class()
                        query = spec.db.query(
                            func.sum(vote_cls.vote_value)).filter_by(
                            vote_spec_id=spec.id,
                            tombstone_date=None,
                            token_category_id=token_category.id
                            ).filter(vote_cls.vote_date >= start).filter(vote_cls.vote_date <= end)
                        # when there is no votes, query.first() equals (None,)
                        # in this case set num_token to 0
                        num_token = query.first()[0]
                        row[fieldname] = num_token or '-'
            else:  # this is a number or text gauge
                if spec is None:
                    fieldname = get_choice_average_fieldname(title)
                    row[fieldname] = '-'
                    if isinstance(template_spec, NumberGaugeVoteSpecification):
                        for choice_value in range_float(template_spec.minimum, template_spec.maximum, template_spec.nb_ticks):
                            fieldname = get_number_choice_fieldname(choice_value, template_spec, title)
                            row[fieldname] = '-'
                    else:
                        for choice in template_spec.get_choices():
                            fieldname = get_text_choice_fieldname(choice, title, user_prefs)
                            row[fieldname] = '-'
                elif isinstance(template_spec, NumberGaugeVoteSpecification):
                    vote_cls = spec.get_vote_class()
                    voting_avg = spec.db.query(func.avg(vote_cls.vote_value)).filter_by(
                        vote_spec_id=spec.id,
                        tombstone_date=None,
                        idea_id=spec.criterion_idea_id
                        ).filter(vote_cls.vote_date >= start).filter(vote_cls.vote_date <= end
                        ).first()
                    # when there is no votes, query.first() equals (None,)
                    avg = voting_avg[0] or '-'
                    fieldname = get_choice_average_fieldname(title)
                    row[fieldname] = avg

                    q_histogram = spec.db.query(vote_cls.vote_value, func.count(vote_cls.voter_id)).filter_by(
                        vote_spec_id=spec.id,
                        tombstone_date=None,
                        idea_id=spec.criterion_idea_id).group_by(vote_cls.vote_value
                        ).filter(vote_cls.vote_date >= start).filter(vote_cls.vote_date <= end)
                    histogram = dict(q_histogram.all())
                    for choice_value in range_float(template_spec.minimum, template_spec.maximum, template_spec.nb_ticks):
                        fieldname = get_number_choice_fieldname(choice_value, template_spec, title)
                        row[fieldname] = histogram.get(choice_value, 0)
                else:
                    vote_cls = spec.get_vote_class()
                    avg_choice = get_avg_choice(spec)
                    if not avg_choice:
                        label_avg = '-'
                    else:
                        label_avg = avg_choice.label.best_lang(user_prefs).value.encode('utf-8')
                    fieldname = get_choice_average_fieldname(title)
                    row[fieldname] = label_avg

                    q_histogram = spec.db.query(vote_cls.vote_value, func.count(vote_cls.voter_id)).filter_by(
                        vote_spec_id=spec.id,
                        tombstone_date=None,
                        idea_id=spec.criterion_idea_id).group_by(vote_cls.vote_value
                        ).filter(vote_cls.vote_date >= start).filter(vote_cls.vote_date <= end)
                    histogram = dict(q_histogram.all())
                    for choice in template_spec.get_choices():
                        fieldname = get_text_choice_fieldname(choice, title, user_prefs)
                        row[fieldname] = histogram.get(choice.value, 0)

            if spec is None:
                row[get_total_votes_fieldname(title)] = '-'
            else:
                vote_cls = spec.get_vote_class()
                num_votes = spec.db.query(
                    vote_cls.voter_id).filter_by(
                    vote_spec_id=spec.id,
                    tombstone_date=None
                    ).filter(vote_cls.vote_date >= start).filter(vote_cls.vote_date <= end
                    ).count()
                row[get_total_votes_fieldname(title)] = num_votes
        rows.append(row)
    return fieldnames, rows


# url /data/Discussion/${debateId}/widgets/${voteSessionId}/vote_results_csv
@view_config(context=InstanceContext, request_method='GET',
              ctx_instance_class=VotingWidget,
              name="vote_results_csv", permission=P_DISC_STATS)
def global_vote_results_csv_view(request):
    ctx = request.context
    user_id = request.authenticated_userid
    if not user_id:
        raise HTTPUnauthorized
    widget = ctx._instance
    if widget.activity_state != "ended":
        permissions = get_permissions(user_id, ctx.get_discussion_id())
        if P_ADMIN_DISC not in permissions:
            raise HTTPUnauthorized()

    fieldnames, rows = global_vote_results_csv(widget, request)
    return csv_response(rows, CSV_MIMETYPE, fieldnames, content_disposition='attachment; filename="vote_results.csv"')


VOTER_MAIL = "Adresse mail du contributeur"
def extract_voters(widget, request):  # widget is the vote session
    has_anon = asbool(request.GET.get('anon', False))
    from .discussion import get_time_series_timing
    start, end, interval = get_time_series_timing(request)
    extract_votes = []
    user_prefs = LanguagePreferenceCollection.getCurrent()
    fieldnames = ["Nom du contributeur", "Nom d'utilisateur du contributeur", VOTER_MAIL, "Date du vote", "Proposition"]
    query = widget.db.query(AbstractIdeaVote
        ).join(AbstractIdeaVote.vote_spec
        ).join(AbstractIdeaVote.idea  # this includes Idea.tombstone_date == None to not count votes of tombstoned proposals
        ).filter(AbstractVoteSpecification.widget_id==widget.id
        ).filter(AbstractIdeaVote.tombstone_date==None
        ).filter(AbstractIdeaVote.vote_date >= start
        ).filter(AbstractIdeaVote.vote_date <= end
        ).order_by(AbstractIdeaVote.vote_spec_id.desc()
        )
    votes = query.all()
    voters_by_id = {}
    proposition_by_id = {}
    for count, vote in enumerate(votes):
        extract_info = {}
        voter_info = voters_by_id.get(vote.voter_id, None)
        if voter_info is None:
            voter = User.get(vote.voter_id)
            if not has_anon:
                contributor = voter.real_name() or u""
                contributor_username = voter.username_p or u""
                contributor_mail = voter.get_preferred_email() or u""
            else:
                contributor = voter.anonymous_name() or u""
                contributor_username = voter.anonymous_username() or u""
                contributor_mail = voter.get_preferred_email(anonymous=has_anon) or u""
            voter_info = {
                "Nom du contributeur": contributor.encode('utf-8'),
                "Nom d'utilisateur du contributeur": contributor_username.encode('utf-8'),
                VOTER_MAIL: contributor_mail.encode('utf-8'),
                "voter": voter # used in voters_csv_export to add sso info
            }
            voters_by_id[vote.voter_id] = voter_info

        extract_info.update(voter_info)
        vote_date = vote.vote_date or u""
        proposition = proposition_by_id.get(vote.idea_id, None)
        if proposition is None:
            proposition = Idea.get(vote.idea_id).title.best_lang(user_prefs).value or u""
            proposition = proposition.encode('utf-8')
            proposition_by_id[vote.idea_id] = proposition

        extract_info["Proposition"] = proposition
        vote_value = vote.vote_value
        extract_info["Date du vote"] = format_date(vote_date)

        spec = vote.vote_spec
        spec_title = get_spec_title(spec, user_prefs)
        if vote.type == u'token_idea_vote':
            fieldname = get_token_category_fieldname(spec_title, vote.token_category, user_prefs)
            if fieldname not in fieldnames:
                fieldnames.append(fieldname)
            extract_info.update({fieldname: str(vote_value)})
            extract_votes.append(extract_info)

        if vote.type == u'gauge_idea_vote':
            if isinstance(spec, NumberGaugeVoteSpecification):
                for choice_value in range_float(spec.minimum, spec.maximum, spec.nb_ticks):
                    option = get_number_choice_fieldname(choice_value, spec, spec_title)
                    if option not in fieldnames:
                        fieldnames.append(option)
                    extract_info.update({option: "1" if vote_value == choice_value else "0"})
            else:
                for choice in spec.get_choices():
                    option = get_text_choice_fieldname(choice, spec_title, user_prefs)
                    if option not in fieldnames:
                        fieldnames.append(option)
                    extract_info.update({option: "1" if vote_value == choice.value else "0"})

            extract_votes.append(extract_info)
    extract_votes.sort(key=operator.itemgetter('Nom du contributeur'))
    return fieldnames, extract_votes


# url /data/Discussion/${debateId}/widgets/${voteSessionId}/extract_csv_voters
@view_config(context=InstanceContext, name="extract_csv_voters",
             ctx_instance_class=VotingWidget, request_method='GET',
             permission=P_DISC_STATS)
def extract_voters_view(request):
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

    fieldnames, extract_votes = extract_voters(widget, request)
    return csv_response(extract_votes, CSV_MIMETYPE, fieldnames, content_disposition='attachment; filename="detailed_vote_results.csv"')
