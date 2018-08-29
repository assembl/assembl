# -*- coding: utf-8 -*-
import csv
import tempfile
from cStringIO import StringIO
from os import urandom
from os.path import join, dirname
from collections import defaultdict
from datetime import timedelta, datetime
import isodate
from assembl.lib.clean_input import sanitize_text

from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    cast,
    func,
    distinct,
    Table,
    MetaData,
    and_,
    or_,
    case,
    desc,
    Float,
)
from sqlalchemy.orm import with_polymorphic, subqueryload
from sqlalchemy.orm.util import aliased
from sqlalchemy.sql.expression import literal
from cornice import Service
import transaction

import simplejson as json
from pyramid.response import FileIter, Response
from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPOk, HTTPBadRequest, HTTPUnauthorized, HTTPNotAcceptable, HTTPFound,
    HTTPServerError, HTTPConflict)
from pyramid.security import Everyone
from pyramid.renderers import JSONP_VALID_CALLBACK
from pyramid.settings import asbool
from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message
import requests

from assembl.lib.clean_input import sanitize_text
from assembl.lib.config import get_config
from assembl.lib.migration import create_default_discussion_data
from assembl.lib.parsedatetime import parse_datetime
from assembl.lib.sqla import ObjectNotUniqueError
from assembl.lib.json import DateJSONEncoder
from assembl.lib.utils import get_global_base_url
from assembl.auth import (
    P_READ, P_READ_PUBLIC_CIF, P_ADMIN_DISC, P_DISC_STATS, P_SYSADMIN,
    R_ADMINISTRATOR)
from assembl.auth.password import verify_data_token, data_token, Validity
from assembl.auth.util import get_permissions, discussions_with_access
from assembl.graphql.langstring import resolve_langstring
from assembl.models import (Discussion, Permission)
from assembl.utils import format_date, get_published_posts, get_ideas
from assembl.models.social_data_extraction import (
    get_social_columns_from_user, load_social_columns_info, get_provider_id_for_discussion)
from ..traversal import InstanceContext, ClassContext
from . import (JSON_HEADER, FORM_HEADER, CreationResponse)
from ..api.discussion import etalab_discussions, API_ETALAB_DISCUSSIONS_PREFIX
from assembl.models import LanguagePreferenceCollection
from assembl.models.idea_content_link import ExtractStates
from assembl.models.timeline import Phases, get_phase_by_identifier

no_thematic_associated = "no thematic associated"


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Discussion, permission=P_READ,
             accept="application/json", name="settings",
             renderer='json')
def discussion_settings_get(request):
    return request.context._instance.settings_json


@view_config(context=InstanceContext, request_method='PATCH',
             ctx_instance_class=Discussion, permission=P_ADMIN_DISC,
             header=JSON_HEADER, name="settings")
@view_config(context=InstanceContext, request_method='PUT',
             ctx_instance_class=Discussion, permission=P_ADMIN_DISC,
             header=JSON_HEADER, name="settings")
def discussion_settings_put(request):
    request.context._instance.settings_json = request.json_body
    return HTTPOk()


def handle_jsonp(callback_fn, json):
    # TODO: Use an augmented JSONP renderer with ld content-type
    if not JSONP_VALID_CALLBACK.match(callback_fn):
        raise HTTPBadRequest("invalid callback name")
    return "/**/{0}({1});".format(callback_fn.encode('ascii'), json)


JSON_MIMETYPE = 'application/json'
CSV_MIMETYPE = 'text/csv'
XSL_MIMETYPE = 'application/vnd.ms-excel'
XSLX_MIMETYPE = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

stats_formats_mimetypes = {
    'json': JSON_MIMETYPE,
    'csv': CSV_MIMETYPE,
    'xlsx': XSLX_MIMETYPE,
    'xls': XSL_MIMETYPE,
}

# ordered by preference
default_stats_formats = [XSLX_MIMETYPE, JSON_MIMETYPE, CSV_MIMETYPE]


def get_format(request, stats_formats=default_stats_formats):
    format = request.GET.get('format', None)
    if format:
        format = stats_formats_mimetypes.get(format, None)
        if not format:
            raise HTTPBadRequest("format: use one of " + ", ".join(
                [k for (k, v) in stats_formats_mimetypes.iteritems()
                 if v in stats_formats]))
    else:
        format = request.accept.best_match(stats_formats)
        if not format:
            raise HTTPNotAcceptable("Use one of " + ", ".join(stats_formats))
    return format


def get_time_series_timing(request, force_bounds=False):
    start = request.GET.get("start", None)
    end = request.GET.get("end", None)
    interval = request.GET.get("interval", None)
    try:
        if start:
            start = parse_datetime(start)
            if force_bounds and start:
                discussion = request.context._instance
                discussion_lower_bound = discussion.creation_date
                if start < discussion_lower_bound:
                    start = discussion_lower_bound
        else:
            discussion = request.context._instance
            start = discussion.creation_date
            # TODO: Round down at day/week/month according to interval
        if end:
            end = parse_datetime(end)
            if force_bounds and end:
                if end < start:
                    end = start
                discussion_upper_bound = datetime.now()
                if end > discussion_upper_bound:
                    end = discussion_upper_bound
        else:
            end = datetime.now()
        if interval:
            interval = isodate.parse_duration(interval)
        else:
            interval = end - start + timedelta(seconds=1)
    except isodate.ISO8601Error as e:
        raise HTTPBadRequest(e)
    return (start, end, interval)


@view_config(context=InstanceContext, name="time_series_analytics",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_DISC_STATS)
def get_time_series_analytics(request):
    start, end, interval = get_time_series_timing(request)
    discussion = request.context._instance
    user_id = request.authenticated_userid or Everyone
    format = get_format(request)
    results = []

    with transaction.manager:
        bind = discussion.db.connection()
        metadata = MetaData(discussion.db.get_bind())  # make sure we are using the same connexion

        intervals_table = Table('temp_table_intervals_' + str(user_id), metadata,
                                Column('interval_id', Integer, primary_key=True),
                                Column('interval_start', DateTime, nullable=False),
                                Column('interval_end', DateTime, nullable=False),
                                prefixes=['TEMPORARY']
                                )
        intervals_table.drop(bind=bind, checkfirst=True)
        intervals_table.create(bind=bind)
        interval_start = start
        intervals = []
        while interval_start < end:
            interval_end = min(interval_start + interval, end)
            intervals.append({'interval_start': interval_start, 'interval_end': interval_end})
            interval_start = interval_start + interval
        # pprint.pprint(intervals)
        discussion.db.execute(intervals_table.insert(), intervals)

        from assembl.models import (
            Post, AgentProfile, AgentStatusInDiscussion, ViewPost, Idea,
            AbstractIdeaVote, Action, ActionOnPost, ActionOnIdea, Content)

        # The posters
        post_subquery = discussion.db.query(intervals_table.c.interval_id,
                                            func.count(distinct(Post.id)).label('count_posts'),
                                            func.count(distinct(Post.creator_id)).label('count_post_authors'),
                                            # func.DB.DBA.BAG_AGG(Post.creator_id).label('post_authors'),
                                            # func.DB.DBA.BAG_AGG(Post.id).label('post_ids'),
                                            )
        post_subquery = post_subquery.outerjoin(Post, and_(
            Post.creation_date >= intervals_table.c.interval_start,
            Post.creation_date < intervals_table.c.interval_end,
            Post.discussion_id == discussion.id))
        post_subquery = post_subquery.group_by(intervals_table.c.interval_id)
        post_subquery = post_subquery.subquery()

        # The cumulative posters
        cumulative_posts_aliased = aliased(Post)
        cumulative_posts_subquery = discussion.db.query(intervals_table.c.interval_id,
                                                        func.count(distinct(cumulative_posts_aliased.id)).label('count_cumulative_posts'),
                                                        func.count(distinct(cumulative_posts_aliased.creator_id)).label('count_cumulative_post_authors')
                                                        # func.DB.DBA.BAG_AGG(cumulative_posts_aliased.id).label('cumulative_post_ids')
                                                        )
        cumulative_posts_subquery = cumulative_posts_subquery.outerjoin(cumulative_posts_aliased, and_(
            cumulative_posts_aliased.creation_date < intervals_table.c.interval_end,
            cumulative_posts_aliased.discussion_id == discussion.id))
        cumulative_posts_subquery = cumulative_posts_subquery.group_by(intervals_table.c.interval_id)
        cumulative_posts_subquery = cumulative_posts_subquery.subquery()

        # The top posters
        top_post_subquery = discussion.db.query(intervals_table.c.interval_id,
                                                func.count(distinct(Post.id)).label('count_top_posts'),
                                                func.count(distinct(Post.creator_id)).label('count_top_post_authors'),
                                                # func.DB.DBA.BAG_AGG(Post.creator_id).label('post_authors'),
                                                # func.DB.DBA.BAG_AGG(Post.id).label('post_ids'),
                                                )
        top_post_subquery = top_post_subquery.outerjoin(Post, and_(
            Post.creation_date >= intervals_table.c.interval_start,
            Post.creation_date < intervals_table.c.interval_end,
            Post.parent_id == None,
            Post.discussion_id == discussion.id))
        top_post_subquery = top_post_subquery.group_by(intervals_table.c.interval_id)
        top_post_subquery = top_post_subquery.subquery()

        # The cumulative posters
        cumulative_top_posts_aliased = aliased(Post)
        cumulative_top_posts_subquery = discussion.db.query(intervals_table.c.interval_id,
                                                            func.count(distinct(cumulative_top_posts_aliased.id)).label('count_cumulative_top_posts'),
                                                            func.count(distinct(cumulative_top_posts_aliased.creator_id)
                                                                       ).label('count_cumulative_top_post_authors')
                                                            # func.DB.DBA.BAG_AGG(cumulative_top_posts_aliased.id).label('cumulative_post_ids')
                                                            )
        cumulative_top_posts_subquery = cumulative_top_posts_subquery.outerjoin(cumulative_top_posts_aliased, and_(
            cumulative_top_posts_aliased.creation_date < intervals_table.c.interval_end,
            cumulative_top_posts_aliased.parent_id == None,
            cumulative_top_posts_aliased.discussion_id == discussion.id))
        cumulative_top_posts_subquery = cumulative_top_posts_subquery.group_by(intervals_table.c.interval_id)
        cumulative_top_posts_subquery = cumulative_top_posts_subquery.subquery()

        # The post viewers
        postViewers = aliased(ViewPost)
        viewedPosts = aliased(Post)
        post_viewers_subquery = discussion.db.query(intervals_table.c.interval_id,
                                                    func.count(distinct(postViewers.actor_id)).label('UNRELIABLE_count_post_viewers')
                                                    )
        post_viewers_subquery = post_viewers_subquery.outerjoin(postViewers, and_(
            postViewers.creation_date >= intervals_table.c.interval_start,
            postViewers.creation_date < intervals_table.c.interval_end)
        ).outerjoin(viewedPosts, and_(
            postViewers.post_id == viewedPosts.id,
            viewedPosts.discussion_id == discussion.id))
        post_viewers_subquery = post_viewers_subquery.group_by(intervals_table.c.interval_id)
        post_viewers_subquery = post_viewers_subquery.subquery()

        # The cumulative visitors
        cumulativeVisitorAgent = aliased(AgentStatusInDiscussion)
        cumulative_visitors_query = discussion.db.query(intervals_table.c.interval_id,
                                                        func.count(distinct(cumulativeVisitorAgent.id)).label('count_cumulative_logged_in_visitors'),
                                                        # func.DB.DBA.BAG_AGG(cumulativeVisitorAgent.id).label('first_time_visitors')
                                                        )
        cumulative_visitors_query = cumulative_visitors_query.outerjoin(cumulativeVisitorAgent, and_(
            cumulativeVisitorAgent.first_visit < intervals_table.c.interval_end,
            cumulativeVisitorAgent.discussion_id == discussion.id))
        cumulative_visitors_query = cumulative_visitors_query.group_by(intervals_table.c.interval_id)
        cumulative_visitors_subquery = cumulative_visitors_query.subquery()
        # query = cumulative_visitors_query

        # The members (can go up and down...)  Assumes that first_subscribed is available
        memberAgentStatus = aliased(AgentStatusInDiscussion)
        members_subquery = discussion.db.query(intervals_table.c.interval_id,
                                               func.count(memberAgentStatus.id).label('count_approximate_members')
                                               )
        members_subquery = members_subquery.outerjoin(memberAgentStatus, ((memberAgentStatus.last_unsubscribed >= intervals_table.c.interval_end) | (memberAgentStatus.last_unsubscribed.is_(
            None))) & ((memberAgentStatus.first_subscribed < intervals_table.c.interval_end) | (memberAgentStatus.first_subscribed.is_(None))) & (memberAgentStatus.discussion_id == discussion.id))
        members_subquery = members_subquery.group_by(intervals_table.c.interval_id)
        members_subquery = members_subquery.subquery()

        subscribersAgentStatus = aliased(AgentStatusInDiscussion)
        subscribers_query = discussion.db.query(intervals_table.c.interval_id,
                                                func.sum(
                                                    case([
                                                        (subscribersAgentStatus.last_visit == None, 0),
                                                        (and_(subscribersAgentStatus.last_visit < intervals_table.c.interval_end,
                                                              subscribersAgentStatus.last_visit >= intervals_table.c.interval_start), 1)
                                                    ], else_=0)
                                                ).label('retention_count_last_visit_in_period'),
                                                func.sum(
                                                    case([
                                                        (subscribersAgentStatus.first_visit == None, 0),
                                                        (and_(subscribersAgentStatus.first_visit < intervals_table.c.interval_end,
                                                              subscribersAgentStatus.first_visit >= intervals_table.c.interval_start), 1)
                                                    ], else_=0)
                                                ).label('recruitment_count_first_visit_in_period'),
                                                func.sum(
                                                    case([
                                                        (subscribersAgentStatus.first_subscribed == None, 0),
                                                        (and_(subscribersAgentStatus.first_subscribed < intervals_table.c.interval_end,
                                                              subscribersAgentStatus.first_subscribed >= intervals_table.c.interval_start), 1)
                                                    ], else_=0)
                                                ).label('recruitment_count_first_subscribed_in_period'),
                                                func.sum(
                                                    case([
                                                        (subscribersAgentStatus.last_unsubscribed == None, 0),
                                                        (and_(subscribersAgentStatus.last_unsubscribed < intervals_table.c.interval_end,
                                                              subscribersAgentStatus.last_unsubscribed >= intervals_table.c.interval_start), 1)
                                                    ], else_=0)
                                                ).label('retention_count_last_unsubscribed_in_period'),
                                                )
        subscribers_query = subscribers_query.outerjoin(subscribersAgentStatus, subscribersAgentStatus.discussion_id == discussion.id)
        subscribers_query = subscribers_query.group_by(intervals_table.c.interval_id)
        subscribers_subquery = subscribers_query.subquery()
        #query = subscribers_query

        # The votes
        votes_aliased = aliased(AbstractIdeaVote)
        votes_subquery = discussion.db.query(intervals_table.c.interval_id,
                                             func.count(distinct(votes_aliased.id)).label('count_votes'),
                                             func.count(distinct(votes_aliased.voter_id)).label('count_voters'),
                                             )
        votes_subquery = votes_subquery.outerjoin(Idea, Idea.discussion_id == discussion.id)
        votes_subquery = votes_subquery.outerjoin(votes_aliased, and_(
            votes_aliased.vote_date >= intervals_table.c.interval_start,
            votes_aliased.vote_date < intervals_table.c.interval_end,
            votes_aliased.idea_id == Idea.id))
        votes_subquery = votes_subquery.group_by(intervals_table.c.interval_id)
        votes_subquery = votes_subquery.subquery()

        # The cumulative posters
        cumulative_votes_aliased = aliased(AbstractIdeaVote)
        cumulative_votes_subquery = discussion.db.query(intervals_table.c.interval_id,
                                                        func.count(cumulative_votes_aliased.id).label('count_cumulative_votes'),
                                                        func.count(distinct(cumulative_votes_aliased.voter_id)).label('count_cumulative_voters')
                                                        )
        cumulative_votes_subquery = cumulative_votes_subquery.outerjoin(Idea, Idea.discussion_id == discussion.id)
        cumulative_votes_subquery = cumulative_votes_subquery.outerjoin(cumulative_votes_aliased, and_(
            cumulative_votes_aliased.vote_date < intervals_table.c.interval_end,
            cumulative_votes_aliased.idea_id == Idea.id))
        cumulative_votes_subquery = cumulative_votes_subquery.group_by(intervals_table.c.interval_id)
        cumulative_votes_subquery = cumulative_votes_subquery.subquery()

        content = with_polymorphic(
            Content, [], Content.__table__,
            aliased=False, flat=True)

        # The actions
        actions_on_post = discussion.db.query(
            intervals_table.c.interval_id.label('interval_id'), ActionOnPost.actor_id.label('actor_id'))
        actions_on_post = actions_on_post.outerjoin(content, content.discussion_id == discussion.id)
        actions_on_post = actions_on_post.outerjoin(ActionOnPost, and_(
            ActionOnPost.post_id == content.id,
            or_(and_(
                ActionOnPost.creation_date >= intervals_table.c.interval_start,
                ActionOnPost.creation_date < intervals_table.c.interval_end),
                and_(
                    ActionOnPost.tombstone_date >= intervals_table.c.interval_start,
                    ActionOnPost.tombstone_date < intervals_table.c.interval_end))))

        actions_on_idea = discussion.db.query(
            intervals_table.c.interval_id.label('interval_id'), ActionOnIdea.actor_id.label('actor_id'))
        actions_on_idea = actions_on_idea.outerjoin(Idea, Idea.discussion_id == discussion.id)
        actions_on_idea = actions_on_idea.outerjoin(ActionOnIdea, and_(
            ActionOnIdea.idea_id == Idea.id,
            or_(and_(
                ActionOnIdea.creation_date >= intervals_table.c.interval_start,
                ActionOnIdea.creation_date < intervals_table.c.interval_end),
                and_(
                    ActionOnIdea.tombstone_date >= intervals_table.c.interval_start,
                    ActionOnIdea.tombstone_date < intervals_table.c.interval_end))))

        posts = discussion.db.query(
            intervals_table.c.interval_id.label('interval_id'),
            Post.creator_id.label('actor_id'))
        posts = posts.outerjoin(Post, and_(
            Post.discussion_id == discussion.id,
            Post.creation_date >= intervals_table.c.interval_start,
            Post.creation_date < intervals_table.c.interval_end))

        actions_union_subquery = actions_on_post.union(actions_on_idea, posts).subquery()
        actions_subquery = discussion.db.query(intervals_table.c.interval_id,
                                               func.count(distinct(actions_union_subquery.c.actor_id)).label('count_actors')
                                               ).outerjoin(actions_union_subquery, actions_union_subquery.c.interval_id == intervals_table.c.interval_id
                                                           ).group_by(intervals_table.c.interval_id).subquery()

        # The actions
        cumulative_actions_on_post = discussion.db.query(
            intervals_table.c.interval_id.label('interval_id'), ActionOnPost.actor_id.label('actor_id'))
        cumulative_actions_on_post = cumulative_actions_on_post.outerjoin(content, content.discussion_id == discussion.id)
        cumulative_actions_on_post = cumulative_actions_on_post.outerjoin(ActionOnPost, and_(
            ActionOnPost.post_id == content.id,
            or_(ActionOnPost.creation_date < intervals_table.c.interval_end,
                ActionOnPost.tombstone_date < intervals_table.c.interval_end)))

        cumulative_actions_on_idea = discussion.db.query(
            intervals_table.c.interval_id.label('interval_id'), ActionOnIdea.actor_id.label('actor_id'))
        cumulative_actions_on_idea = cumulative_actions_on_idea.outerjoin(Idea, Idea.discussion_id == discussion.id)
        cumulative_actions_on_idea = cumulative_actions_on_idea.outerjoin(ActionOnIdea, and_(
            ActionOnIdea.idea_id == Idea.id,
            or_(ActionOnIdea.creation_date < intervals_table.c.interval_end,
                ActionOnIdea.tombstone_date < intervals_table.c.interval_end)))

        posts = discussion.db.query(
            intervals_table.c.interval_id.label('interval_id'),
            Post.creator_id.label('actor_id'))
        posts = posts.outerjoin(Post, and_(
            Post.discussion_id == discussion.id,
            Post.creation_date < intervals_table.c.interval_end))

        cumulative_actions_union_subquery = cumulative_actions_on_post.union(cumulative_actions_on_idea, posts).subquery()
        cumulative_actions_subquery = discussion.db.query(intervals_table.c.interval_id,
                                                          func.count(distinct(cumulative_actions_union_subquery.c.actor_id)).label('count_cumulative_actors')
                                                          ).outerjoin(cumulative_actions_union_subquery, cumulative_actions_union_subquery.c.interval_id == intervals_table.c.interval_id
                                                                      ).group_by(intervals_table.c.interval_id).subquery()

        combined_query = discussion.db.query(intervals_table,
                                             post_subquery,
                                             cumulative_posts_subquery,
                                             top_post_subquery,
                                             cumulative_top_posts_subquery,
                                             post_viewers_subquery,
                                             cumulative_visitors_subquery,
                                             votes_subquery,
                                             cumulative_votes_subquery,
                                             members_subquery,
                                             actions_subquery,
                                             cumulative_actions_subquery,
                                             case([
                                                 (cumulative_posts_subquery.c.count_cumulative_post_authors == 0, None),
                                                 (cumulative_posts_subquery.c.count_cumulative_post_authors != 0, (cast(post_subquery.c.count_post_authors,
                                                                                                                        Float) / cast(cumulative_posts_subquery.c.count_cumulative_post_authors, Float)))
                                             ]).label('fraction_cumulative_authors_who_posted_in_period'),
                                             case([
                                                 (cumulative_visitors_subquery.c.count_cumulative_logged_in_visitors == 0, None),
                                                 (cumulative_visitors_subquery.c.count_cumulative_logged_in_visitors != 0, (cast(
                                                     post_subquery.c.count_post_authors, Float) / cast(cumulative_visitors_subquery.c.count_cumulative_logged_in_visitors, Float)))
                                             ]).label('fraction_cumulative_logged_in_visitors_who_posted_in_period'),
                                             subscribers_subquery,
                                             )
        combined_query = combined_query.join(post_subquery, post_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(cumulative_posts_subquery, cumulative_posts_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(top_post_subquery, top_post_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(cumulative_top_posts_subquery, cumulative_top_posts_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(post_viewers_subquery, post_viewers_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(cumulative_visitors_subquery, cumulative_visitors_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(members_subquery, members_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(subscribers_subquery, subscribers_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(votes_subquery, votes_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(cumulative_votes_subquery, cumulative_votes_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(actions_subquery, actions_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(cumulative_actions_subquery, cumulative_actions_subquery.c.interval_id == intervals_table.c.interval_id)

        query = combined_query
        query = query.order_by(intervals_table.c.interval_id)
        results = query.all()

        intervals_table.drop(bind=bind)

    if format == JSON_MIMETYPE:
            # json default
        return Response(json.dumps(results, cls=DateJSONEncoder),
                        content_type='application/json')

    fieldnames = [
        "interval_id",
        "interval_start",
        "interval_end",
        "count_posts",
        "count_cumulative_posts",
        "count_top_posts",
        "count_cumulative_top_posts",
        "count_post_authors",
        "count_cumulative_post_authors",
        "fraction_cumulative_authors_who_posted_in_period",

        "count_votes",
        "count_cumulative_votes",
        "count_voters",
        "count_cumulative_voters",
        "count_actors",
        "count_cumulative_actors",

        "count_approximate_members",
        "count_first_time_logged_in_visitors",
        "count_cumulative_logged_in_visitors",
        "fraction_cumulative_logged_in_visitors_who_posted_in_period",
        "recruitment_count_first_visit_in_period",
        "recruitment_count_first_subscribed_in_period",
        "retention_count_last_visit_in_period",
        "retention_count_last_unsubscribed_in_period",
        "UNRELIABLE_count_post_viewers",
    ]
    # otherwise assume csv
    return csv_response([r._asdict() for r in results], format, fieldnames)


@view_config(context=InstanceContext, name="extract_csv_taxonomy",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_DISC_STATS)
def extract_taxonomy_csv(request):
    import assembl.models as m
    discussion = request.context._instance
    db = discussion.db
    extracts = db.query(m.Extract).filter(m.Extract.discussion_id == discussion.id)
    extract_list = []
    user_prefs = LanguagePreferenceCollection.getCurrent()
    fieldnames = ["Thematic", "Message", "Content harvested",  "Content locale", "Original message", "Original locale", "Qualify by nature", "Qualify by action",
                  "Owner of the message", "Published on", "Harvester", "Harvested on", "Nugget", "State"]
    for extract in extracts:
        if extract.idea_id:
            thematic = db.query(m.Idea).get(extract.idea_id)
            if thematic:
                if thematic.title:
                    thematic = thematic.title.best_lang(user_prefs).value
                else:
                    thematic = no_thematic_associated
            else:
                thematic = no_thematic_associated
        else:
            thematic = no_thematic_associated
        if extract.locale_id:
            extract_locale = extract.locale.code
        else:
            extract_locale = "no extract locale"
        query = db.query(m.Post).filter(m.Post.id == extract.content_id).first()
        if query:
            if query.body:
                original_message = query.body.first_original().value
                original_locale = query.body.first_original().locale.code
                message = query.body.best_lang(user_prefs).value
            else:
                message = "no message"
        else:
            message = "no message"
        if not message:
            message = "no message"

        if thematic == no_thematic_associated:
            idea_ids = m.Idea.get_idea_ids_showing_post(query.id)
            for thematic_id in reversed(idea_ids):
                thematic_title = db.query(m.Idea).filter(m.Idea.id == thematic_id).first().title
                if thematic_title:
                    thematic = thematic_title.best_lang(user_prefs).value
                    break
        if extract.body:
            content_harvested = extract.body
        else:
            content_harvested = "no content harvested"
        if extract.extract_nature:
            qualify_by_nature = extract.extract_nature.name
        else:
            qualify_by_nature = " "
        if extract.extract_action:
            qualify_by_action = extract.extract_action.name
        else:
            qualify_by_action = " "
        owner_of_the_message = db.query(m.User).filter(m.User.id == query.creator_id).first().name
        published_on = unicode(query.creation_date.replace(microsecond=0))
        harvester = db.query(m.User).filter(m.User.id == extract.owner_id).first().name
        harvested_on = unicode(extract.creation_date.replace(microsecond=0))
        nugget = "Yes" if extract.important else "No"
        state = getattr(extract, 'extract_state', ExtractStates.PUBLISHED.value)
        extract_info = {
            "Thematic": thematic.encode('utf-8'),
            "Message": sanitize_text(message).encode('utf-8'),
            "Content harvested": content_harvested.encode('utf-8'),
            "Content locale": extract_locale.encode('utf-8'),
            "Original message": sanitize_text(original_message).encode('utf-8'),
            "Original locale": original_locale.encode('utf-8'),
            "Qualify by nature": qualify_by_nature.encode('utf-8'),
            "Qualify by action": qualify_by_action.encode('utf-8'),
            "Owner of the message": owner_of_the_message.encode('utf-8'),
            "Published on": published_on.encode('utf-8'),
            "Harvester": harvester.encode('utf-8'),
            "Harvested on": harvested_on.encode('utf-8'),
            "Nugget": nugget.encode('utf-8'),
            "State": state.encode('utf-8')
        }
        extract_list.append(extract_info)

    return csv_response(extract_list, CSV_MIMETYPE, fieldnames, content_disposition='attachment; filename="extract_taxonomies.csv"')


def csv_response(results, format, fieldnames=None, content_disposition=None):
    output = StringIO()
    # include BOM for Excel to open the file in UTF-8 properly
    output.write(u'\ufeff'.encode('utf-8'))

    if format == CSV_MIMETYPE:
        from csv import writer
        csv = writer(output, dialect='excel', delimiter=';')
        writerow = csv.writerow
        empty = ''
    elif format == XSLX_MIMETYPE:
        from zipfile import ZipFile, ZIP_DEFLATED
        from openpyxl.workbook import Workbook
        workbook = Workbook(True)
        archive = ZipFile(output, 'w', ZIP_DEFLATED, allowZip64=True)
        worksheet = workbook.create_sheet()
        writerow = worksheet.append
        empty = None

    if fieldnames:
        # TODO: i18n
        writerow([' '.join(fn.split('_')).title() for fn in fieldnames])
        for r in results:
            writerow([r.get(f, empty) for f in fieldnames])
    else:
        for r in results:
            writerow(r)

    if format == XSLX_MIMETYPE:
        from openpyxl.writer.excel import ExcelWriter
        writer = ExcelWriter(workbook, archive)
        writer.save('')

    output.seek(0)
    return Response(body_file=output, content_type=format, content_disposition=content_disposition)


@view_config(context=InstanceContext, name="contribution_count",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_DISC_STATS)
def get_contribution_count(request):
    start, end, interval = get_time_series_timing(request)
    format = get_format(request)
    discussion = request.context._instance
    results = []
    if interval < (end - start):
        while start < end:
            this_end = min(start + interval, end)
            results.append(dict(
                start=start, end=this_end,
                count=discussion.count_contributions_per_agent(
                    start, this_end)))
            start = this_end
    else:
        r = dict(count=discussion.count_contributions_per_agent(start, end))
        if not start:
            from assembl.models import Post
            (start,) = discussion.db.query(
                func.min(Post.creation_date)).filter_by(
                discussion_id=discussion.id).first()
        r["start"] = start
        if not end:
            end = datetime.now()
        r["end"] = end
        results.append(r)
    if format == JSON_MIMETYPE:
        # json default
        for v in results:
            v['count'] = {agent.display_name(): count
                          for (agent, count) in v['count']}
        return Response(json.dumps(results, cls=DateJSONEncoder),
                        content_type='application/json')

    total_count = defaultdict(int)
    agents = {}
    for v in results:
        as_dict = {}
        for (agent, count) in v['count']:
            total_count[agent.id] += count
            as_dict[agent.id] = count
            agents[agent.id] = agent
        v['count'] = as_dict
    count_list = total_count.items()
    count_list.sort(key=lambda (a, c): c, reverse=True)
    rows = []
    rows.append(['Start'] + [
        x['start'] for x in results] + ['Total'])
    rows.append(['End'] + [
        x['end'] for x in results] + [''])
    for agent_id, total_count in count_list:
        agent = agents[agent_id]
        agent_name = (
            agent.display_name() or agent.real_name() or
            agent.get_preferred_email())
        rows.append([agent_name.encode('utf-8')] + [
            x['count'].get(agent_id, '') for x in results] + [total_count])
    return csv_response(rows, format)


@view_config(context=InstanceContext, name="visit_count",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_DISC_STATS)
def get_visit_count(request):
    start, end, interval = get_time_series_timing(request)
    format = get_format(request)
    discussion = request.context._instance
    results = []
    if interval < (end - start):
        while start < end:
            this_end = min(start + interval, end)
            results.append(dict(
                start=start, end=this_end,
                readers=discussion.count_post_viewers(
                    start, this_end),
                first_visitors=discussion.count_new_visitors(
                    start, this_end)))
            start = this_end
    else:
        r = dict(
            readers=discussion.count_post_viewers(start, end),
            first_visitors=discussion.count_new_visitors(start, end))
        if not start:
            from assembl.models import AgentStatusInDiscussion
            (start,) = discussion.db.query(
                func.min(AgentStatusInDiscussion.first_visit)).filter_by(
                discussion_id=discussion.id).first()
        r["start"] = start
        if not end:
            end = datetime.now()
        r["end"] = end
        results.append(r)
    if format == JSON_MIMETYPE:
        # json default
        return Response(json.dumps(results, cls=DateJSONEncoder),
                        content_type='application/json')
    # otherwise assume csv
    fieldnames = ['start', 'end', 'first_visitors', 'readers']
    return csv_response(results, format, fieldnames)


@view_config(context=InstanceContext, name="visitors",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_DISC_STATS)
def get_visitors(request):
    discussion = request.context._instance
    user_prefs = LanguagePreferenceCollection.getCurrent()
    fieldnames = ["time", "name", "email"]
    extra_columns_info = (None if 'no_extra_columns' in request.GET else
                          load_social_columns_info(discussion, "en"))
    db = discussion.db
    from assembl import models as m
    from graphene.relay import Node
    # Adding configurable fields titles to the csv
    configurable_fields = db.query(m.AbstractConfigurableField).filter(m.AbstractConfigurableField.discussion_id == discussion.id).filter(
        m.AbstractConfigurableField.identifier == m.ConfigurableFieldIdentifiersEnum.CUSTOM.value).all()
    for configurable_field in configurable_fields:
        fieldnames.append((configurable_field.title.best_lang(user_prefs).value).encode("utf-8"))

    select_field_options = db.query(m.SelectFieldOption).all()
    select_field_options_dict = {sfd.id: sfd.label.best_lang(user_prefs).value for sfd in select_field_options}
    if extra_columns_info:
        # insert after email
        fieldnames.extend([name.encode('utf-8') for (name, path) in extra_columns_info])
        column_info_per_user = {}
        provider_id = get_provider_id_for_discussion(discussion)

    use_first = asbool(request.GET.get("first", False))
    attribute = "first_visit" if use_first else "last_visit"
    visitors = []
    for st in discussion.agent_status_in_discussion:
        if not getattr(st, attribute, None):
            continue
        profile_fields = db.query(m.AbstractConfigurableField, m.ProfileField).filter(m.ProfileField.discussion_id == discussion.id).join(m.ProfileField.configurable_field).filter(
            m.ProfileField.agent_profile_id == st.agent_profile.id).filter(m.AbstractConfigurableField.identifier == m.ConfigurableFieldIdentifiersEnum.CUSTOM.value).filter(m.ProfileField.configurable_field_id == m.AbstractConfigurableField.id).all()

        data = {"time": getattr(st, attribute),
                "name": (st.agent_profile.name or '').encode("utf-8"),
                "email": (st.agent_profile.get_preferred_email() or '').encode("utf-8")}

        for profile_field in profile_fields:
            if profile_field[1].value_data["value"] != None and profile_field[0].title != None:
                if type(profile_field[1].value_data["value"]) == list:
                    profile_field_value_id = profile_field[1].value_data["value"][0]
                    profile_field_value_id = int(Node.from_global_id(profile_field_value_id)[1])
                    profile_field_value = select_field_options_dict.get(profile_field_value_id)
                    if profile_field_value:
                        data.update({(profile_field[0].title.best_lang(user_prefs).value).encode(
                            "utf-8"): profile_field_value.encode("utf-8")})
                else:
                    data.update({(profile_field[0].title.best_lang(user_prefs).value).encode("utf-8"): (profile_field[1].value_data["value"]).encode("utf-8")})

        if extra_columns_info:
            extra_info = get_social_columns_from_user(
                st.agent_profile, extra_columns_info, provider_id)
            for num, (name, path) in enumerate(extra_columns_info):
                data[name] = extra_info[num]
        visitors.append(data)

    visitors.sort(key=lambda x: x['time'], reverse=True)
    return csv_response(visitors, CSV_MIMETYPE, fieldnames)


@view_config(context=InstanceContext, name="activity_alerts",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_DISC_STATS)
def get_activity_alerts(request):
    discussion = request.context._instance
    user_id = request.authenticated_userid or Everyone
    result = get_analytics_alerts(
        discussion, user_id,
        ["lurking_user", "inactive_user", "user_gone_inactive"],
        True)
    return Response(body=result, content_type='application/json')


@view_config(context=InstanceContext, name="interest_alerts",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_DISC_STATS)
def get_interest_alerts(request):
    discussion = request.context._instance
    user_id = request.authenticated_userid or Everyone
    result = get_analytics_alerts(
        discussion, user_id,
        ["interesting_to_me"],
        True)
    return Response(body=result, content_type='application/json')


@view_config(context=InstanceContext, name="test_results",
             ctx_instance_class=Discussion, request_method='POST',
             header=FORM_HEADER, permission=P_READ)
def test_results(request):
    mailer = get_mailer(request)
    config = get_config()
    message = Message(
        subject="test_results",
        sender=config.get('assembl.admin_email'),
        recipients=["maparent@acm.org"],
        body=json.dumps(request.POST.dict_of_lists()))
    mailer.send(message)
    return Response(body="Thank you!", content_type="text/text")


@view_config(context=InstanceContext, name="test_sentry",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_READ)
def test_sentry(request):
    raise RuntimeError("Let's test sentry")


@etalab_discussions.post(permission=P_SYSADMIN)
@view_config(context=ClassContext, ctx_class=Discussion,
             request_method='POST', header=JSON_HEADER, permission=P_SYSADMIN)
def post_discussion(request):
    from assembl.models import EmailAccount, User, LocalUserRole, Role, AbstractAgentAccount
    ctx = request.context
    json = request.json_body
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, None)
    is_etalab_request = (request.matched_route and request.matched_route.name == 'etalab_discussions')
    if is_etalab_request:
        # The Etalab specification says that the API call representing the instance creation request must contain the following fields:
        # - requestIdentifier
        # - name: the title of the discussion (discussion.topic)
        # - slug
        # - adminName
        # - adminEmail
        default_view = 'etalab'
        # Fake an APIv2 context
        from ..traversal import Api2Context
        ctx = Api2Context(ctx)
        ctx = ClassContext(ctx, Discussion)
        json['topic'] = json.get('name', json.get('slug', ''))
    else:
        default_view = 'default'
    cls = ctx.get_class(json.get('@type', None))
    typename = cls.external_typename()
    # special case: find the user first.
    creator_email = json.get("adminEmail", None)
    db = Discussion.default_db
    if creator_email:
        account = db.query(AbstractAgentAccount).filter_by(
            email=creator_email, verified=True).first()
        if account:
            user = account.profile
        else:
            user = User(name=json.get("adminName", None), verified=True)
            account = EmailAccount(profile=user, email=creator_email, verified=True)
            db.add(user)
            db.flush()
        json['creator'] = user.uri()
    else:
        user = None
    try:
        instances = ctx.create_object(typename, json, user_id)
        discussion = instances[0]
        # Hackish. Discussion API? Generic post-init method?
        discussion.preferences.name = (
            'discussion_' + json.get('slug', str(discussion.id)))
        create_default_discussion_data(discussion)
        if user is not None:
            role = db.query(Role).filter_by(name=R_ADMINISTRATOR).first()
            local_role = LocalUserRole(discussion=discussion, user=user, role=role)
            instances.append(local_role)
        discussion.invoke_callbacks_after_creation()
    except ObjectNotUniqueError as e:
        raise HTTPConflict(e)
    except Exception as e:
        raise HTTPServerError(e)
    if instances:
        first = instances[0]
        db = first.db
        for instance in instances:
            db.add(instance)
        db.flush()
        view = request.GET.get('view', None) or default_view
        uri = "/".join((API_ETALAB_DISCUSSIONS_PREFIX, str(first.id))) if is_etalab_request else None
        return CreationResponse(first, user_id, permissions, view, uri=uri)


class defaultdict_of_dict(defaultdict):
    """A defaultdict of dicts."""

    def __init__(self):
        super(defaultdict_of_dict, self).__init__(dict)


@view_config(context=InstanceContext, name="visits_time_series_analytics",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_READ, renderer='json')  # TODO: What permission should this require? Do all debate initiators want this data to be accessible?
def get_visits_time_series_analytics(request):
    """
    Fetches visits analytics from bound piwik site.
    Optional parameters `start` and `end` are dates like "2017-11-21" (default dates are from discussion creation date to today as default).
    """

    start = request.GET.get("start", None)
    end = request.GET.get("end", None)
    discussion = request.context._instance
    try:
        data = discussion.get_visits_time_series_analytics(start, end)
        return data
    except ValueError as e:
        raise HTTPBadRequest(explanation=e)


@view_config(context=InstanceContext, name="participant_time_series_analytics",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_DISC_STATS)
def get_participant_time_series_analytics(request):
    start, end, interval = get_time_series_timing(request)
    data_descriptors = request.GET.getall("data")
    with_email = request.GET.get("email", None)
    discussion = request.context._instance
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, discussion.id)
    if with_email is None:
        with_email = P_ADMIN_DISC in permissions
    else:
        with_email = asbool(with_email)
        if with_email and P_ADMIN_DISC not in permissions:
            raise HTTPUnauthorized("Cannot obtain email information")
    format = get_format(request)
    sort_key = request.GET.get('sort', 'domain' if with_email else 'name')
    results = []
    from assembl.models import (
        Post, AgentProfile, AgentStatusInDiscussion, ViewPost, Idea,
        AbstractIdeaVote, Action, ActionOnPost, ActionOnIdea, Content,
        PublicationStates, AbstractAgentAccount, LikeSentimentOfPost,
        DisagreeSentimentOfPost, DontUnderstandSentimentOfPost,
        MoreInfoSentimentOfPost)

    default_data_descriptors = [
        "posts",
        "cumulative_posts",
        "top_posts",
        "cumulative_top_posts",
        "replies_received",
        "cumulative_replies_received",
        "active",
    ]
    sentiments = [
        ('liked', 'liking', LikeSentimentOfPost),
        ('disagreed', 'disagreeing', DisagreeSentimentOfPost),
        ('misunderstood', 'misunderstanding', DontUnderstandSentimentOfPost),
        ('info_requested', 'info_requesting', MoreInfoSentimentOfPost),
    ]
    for sentiment_in, sentiment_out, sentiment_class in sentiments:
        default_data_descriptors.extend([
            sentiment_in, 'cumulative_' + sentiment_in,
            sentiment_out, 'cumulative_' + sentiment_out])
    data_descriptors = data_descriptors or default_data_descriptors
    # Impose data_descriptors order
    data_descriptors = [s for s in default_data_descriptors if s in data_descriptors]
    if not data_descriptors:
        raise HTTPBadRequest("No valid data descriptor given")
    if sort_key and sort_key not in ('name', 'domain') and sort_key not in default_data_descriptors:
        raise HTTPBadRequest("Invalid sort column")
    if sort_key == 'domain' and P_ADMIN_DISC not in permissions:
        raise HTTPUnauthorized("Cannot obtain email information")

    with transaction.manager:
        bind = discussion.db.connection()
        metadata = MetaData(discussion.db.get_bind())  # make sure we are using the same connexion

        intervals_table = Table('temp_table_intervals_' + str(user_id), metadata,
                                Column('interval_id', Integer, primary_key=True),
                                Column('interval_start', DateTime, nullable=False),
                                Column('interval_end', DateTime, nullable=False),
                                prefixes=['TEMPORARY']
                                )
        # In case there is a leftover from a previous crash
        intervals_table.drop(bind=bind, checkfirst=True)
        intervals_table.create(bind=bind)
        interval_start = start
        intervals = []
        while interval_start < end:
            interval_end = min(interval_start + interval, end)
            intervals.append({'interval_start': interval_start, 'interval_end': interval_end})
            interval_start = interval_start + interval
        # pprint.pprint(intervals)
        discussion.db.execute(intervals_table.insert(), intervals)

        content = with_polymorphic(
            Content, [], Content.__table__,
            aliased=False, flat=True)
        # post = with_polymorphic(Post, [])

        query_components = []

        if 'posts' in data_descriptors:
            # The posters
            post_query = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id_q'),
                AgentProfile.id.label('participant_id'),
                AgentProfile.name.label('participant'),
                literal('posts').label('key'),
                func.count(distinct(Post.id)).label('value'),
            )
            post_query = post_query.join(Post, and_(
                Post.creation_date >= intervals_table.c.interval_start,
                Post.creation_date < intervals_table.c.interval_end,
                Post.discussion_id == discussion.id))
            post_query = post_query.join(AgentProfile, Post.creator_id == AgentProfile.id)
            post_query = post_query.group_by(intervals_table.c.interval_id, AgentProfile.id)
            query_components.append(post_query)

        if 'cumulative_posts' in data_descriptors:
            # Cumulative posters
            cumulative_post_query = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id_q'),
                AgentProfile.id.label('participant_id'),
                AgentProfile.name.label('participant'),
                literal('cumulative_posts').label('key'),
                func.count(distinct(Post.id)).label('value'),
            )
            cumulative_post_query = cumulative_post_query.join(Post, and_(
                Post.creation_date < intervals_table.c.interval_end,
                Post.publication_state == PublicationStates.PUBLISHED,
                Post.discussion_id == discussion.id))
            cumulative_post_query = cumulative_post_query.join(AgentProfile, Post.creator_id == AgentProfile.id)
            cumulative_post_query = cumulative_post_query.group_by(intervals_table.c.interval_id, AgentProfile.id)
            query_components.append(cumulative_post_query)

        if 'top_posts' in data_descriptors:
            # The posters
            top_post_query = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id_q'),
                AgentProfile.id.label('participant_id'),
                AgentProfile.name.label('participant'),
                literal('top_posts').label('key'),
                func.count(distinct(Post.id)).label('value'),
            )
            top_post_query = top_post_query.join(Post, and_(
                Post.creation_date >= intervals_table.c.interval_start,
                Post.creation_date < intervals_table.c.interval_end,
                Post.parent_id == None,
                Post.discussion_id == discussion.id))
            top_post_query = top_post_query.join(
                AgentProfile, Post.creator_id == AgentProfile.id)
            top_post_query = top_post_query.group_by(
                intervals_table.c.interval_id, AgentProfile.id)
            query_components.append(top_post_query)

        if 'cumulative_top_posts' in data_descriptors:
            # Cumulative posters
            cumulative_top_post_query = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id_q'),
                AgentProfile.id.label('participant_id'),
                AgentProfile.name.label('participant'),
                literal('cumulative_top_posts').label('key'),
                func.count(distinct(Post.id)).label('value'),
            )
            cumulative_top_post_query = cumulative_top_post_query.join(Post, and_(
                Post.creation_date < intervals_table.c.interval_end,
                Post.publication_state == PublicationStates.PUBLISHED,
                Post.parent_id == None,
                Post.discussion_id == discussion.id))
            cumulative_top_post_query = cumulative_top_post_query.join(
                AgentProfile, Post.creator_id == AgentProfile.id)
            cumulative_top_post_query = cumulative_top_post_query.group_by(
                intervals_table.c.interval_id, AgentProfile.id)
            query_components.append(cumulative_top_post_query)

        for sentiment_in, sentiment_out, sentiment_class in sentiments:
            c_sentiment_in = 'cumulative_' + sentiment_in
            c_sentiment_out = 'cumulative_' + sentiment_out
            if sentiment_out in data_descriptors:
                # The likes made
                query = discussion.db.query(
                    intervals_table.c.interval_id.label('interval_id_q'),
                    AgentProfile.id.label('participant_id'),
                    AgentProfile.name.label('participant'),
                    literal(sentiment_out).label('key'),
                    func.count(distinct(sentiment_class.id)).label('value'),
                )
                query = query.join(Post, Post.discussion_id == discussion.id)
                query = query.join(sentiment_class, and_(
                    sentiment_class.creation_date >= intervals_table.c.interval_start,
                    sentiment_class.creation_date < intervals_table.c.interval_end,
                    sentiment_class.post_id == Post.id))
                query = query.join(AgentProfile, sentiment_class.actor_id == AgentProfile.id)
                query = query.group_by(intervals_table.c.interval_id, AgentProfile.id)
                query_components.append(query)

            if c_sentiment_out in data_descriptors:
                # The cumulative active likes made
                query = discussion.db.query(
                    intervals_table.c.interval_id.label('interval_id_q'),
                    AgentProfile.id.label('participant_id'),
                    AgentProfile.name.label('participant'),
                    literal(c_sentiment_out).label('key'),
                    func.count(distinct(sentiment_class.id)).label('value'),
                )
                query = query.join(Post, Post.discussion_id == discussion.id)
                query = query.join(sentiment_class, and_(
                    sentiment_class.tombstone_date == None,
                    sentiment_class.creation_date < intervals_table.c.interval_end,
                    sentiment_class.post_id == Post.id))
                query = query.join(AgentProfile, sentiment_class.actor_id == AgentProfile.id)
                query = query.group_by(intervals_table.c.interval_id, AgentProfile.id)
                query_components.append(query)

            if sentiment_in in data_descriptors:
                # The likes received
                query = discussion.db.query(
                    intervals_table.c.interval_id.label('interval_id_q'),
                    AgentProfile.id.label('participant_id'),
                    AgentProfile.name.label('participant'),
                    literal(sentiment_in).label('key'),
                    func.count(distinct(sentiment_class.id)).label('value'),
                )
                query = query.join(Post, Post.discussion_id == discussion.id)
                query = query.join(sentiment_class, and_(
                    sentiment_class.creation_date >= intervals_table.c.interval_start,
                    sentiment_class.creation_date < intervals_table.c.interval_end,
                    sentiment_class.post_id == Post.id))
                query = query.join(AgentProfile, Post.creator_id == AgentProfile.id)
                query = query.group_by(intervals_table.c.interval_id, AgentProfile.id)
                query_components.append(query)

            if c_sentiment_in in data_descriptors:
                # The cumulative active likes received
                query = discussion.db.query(
                    intervals_table.c.interval_id.label('interval_id_q'),
                    AgentProfile.id.label('participant_id'),
                    AgentProfile.name.label('participant'),
                    literal(c_sentiment_in).label('key'),
                    func.count(distinct(sentiment_class.id)).label('value'),
                )
                query = query.outerjoin(Post, Post.discussion_id == discussion.id)
                query = query.outerjoin(sentiment_class, and_(
                    sentiment_class.tombstone_date == None,
                    sentiment_class.creation_date < intervals_table.c.interval_end,
                    sentiment_class.post_id == Post.id))
                query = query.outerjoin(AgentProfile, Post.creator_id == AgentProfile.id)
                query = query.group_by(intervals_table.c.interval_id, AgentProfile.id)
                query_components.append(query)

        if 'replies_received' in data_descriptors:
            # The posters
            reply_post = aliased(Post)
            original_post = aliased(Post)
            reply_post_query = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id_q'),
                AgentProfile.id.label('participant_id'),
                AgentProfile.name.label('participant'),
                literal('replies_received').label('key'),
                func.count(distinct(reply_post.id)).label('value'),
            ).join(reply_post, and_(
                reply_post.creation_date >= intervals_table.c.interval_start,
                reply_post.creation_date < intervals_table.c.interval_end,
                reply_post.discussion_id == discussion.id)
            ).join(original_post, original_post.id == reply_post.parent_id
                   ).join(AgentProfile, original_post.creator_id == AgentProfile.id
                          ).group_by(intervals_table.c.interval_id, AgentProfile.id)
            query_components.append(reply_post_query)

        if 'cumulative_replies_received' in data_descriptors:
            # The posters
            reply_post = aliased(Post)
            original_post = aliased(Post)
            cumulative_reply_post_query = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id_q'),
                AgentProfile.id.label('participant_id'),
                AgentProfile.name.label('participant'),
                literal('cumulative_replies_received').label('key'),
                func.count(distinct(reply_post.id)).label('value'),
            ).join(reply_post, and_(
                reply_post.creation_date < intervals_table.c.interval_end,
                reply_post.publication_state == PublicationStates.PUBLISHED,
                reply_post.discussion_id == discussion.id)
            ).join(original_post, and_(
                original_post.id == reply_post.parent_id,
                original_post.publication_state == PublicationStates.PUBLISHED)
            ).join(AgentProfile, original_post.creator_id == AgentProfile.id
                   ).group_by(intervals_table.c.interval_id, AgentProfile.id)
            query_components.append(cumulative_reply_post_query)

        if "active" in data_descriptors:
            actions_on_post = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id'),
                ActionOnPost.actor_id.label('actor_id'),
                ActionOnPost.id.label('id'))
            actions_on_post = actions_on_post.join(content, content.discussion_id == discussion.id)
            actions_on_post = actions_on_post.join(ActionOnPost, and_(
                ActionOnPost.post_id == content.id,
                or_(and_(
                    ActionOnPost.creation_date >= intervals_table.c.interval_start,
                    ActionOnPost.creation_date < intervals_table.c.interval_end),
                    and_(
                        ActionOnPost.tombstone_date >= intervals_table.c.interval_start,
                        ActionOnPost.tombstone_date < intervals_table.c.interval_end))))

            actions_on_idea = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id'),
                ActionOnIdea.actor_id.label('actor_id'),
                ActionOnIdea.id.label('id'))
            actions_on_idea = actions_on_idea.join(Idea, Idea.discussion_id == discussion.id)
            actions_on_idea = actions_on_idea.join(ActionOnIdea, and_(
                ActionOnIdea.idea_id == Idea.id,
                or_(and_(
                    ActionOnIdea.creation_date >= intervals_table.c.interval_start,
                    ActionOnIdea.creation_date < intervals_table.c.interval_end),
                    and_(
                        ActionOnIdea.tombstone_date >= intervals_table.c.interval_start,
                        ActionOnIdea.tombstone_date < intervals_table.c.interval_end))))

            posts = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id'),
                Post.creator_id.label('actor_id'),
                Post.id.label('id'))
            posts = posts.join(Post, and_(
                Post.discussion_id == discussion.id,
                Post.creation_date >= intervals_table.c.interval_start,
                Post.creation_date < intervals_table.c.interval_end))

            actions_union_subquery = actions_on_post.union(actions_on_idea, posts).subquery()
            active_query = discussion.db.query(
                intervals_table.c.interval_id.label('interval_id_q'),
                AgentProfile.id.label('participant_id'),
                AgentProfile.name.label('participant'),
                literal('active').label('key'),
                cast(func.count(actions_union_subquery.c.id) > 0, Integer).label('value')
            ).join(actions_union_subquery, actions_union_subquery.c.interval_id == intervals_table.c.interval_id
                   ).join(AgentProfile, actions_union_subquery.c.actor_id == AgentProfile.id
                          ).group_by(intervals_table.c.interval_id, AgentProfile.id)
            query_components.append(active_query)

        combined_subquery = query_components.pop(0)
        if query_components:
            combined_subquery = combined_subquery.union(*query_components)
        combined_subquery = combined_subquery.subquery('combined')
        query = discussion.db.query(intervals_table, combined_subquery).outerjoin(
            combined_subquery, combined_subquery.c.interval_id_q == intervals_table.c.interval_id
        ).order_by(intervals_table.c.interval_id)
        results = query.all()
        intervals_table.drop(bind=bind)
        # pprint.pprint(results)
        # end of transaction

    if with_email:
        participant_ids = {row._asdict()['participant_id'] for row in results}
        # this is somewhat arbitrary...
        participant_emails = dict(
            discussion.db.query(AbstractAgentAccount.profile_id, AbstractAgentAccount.email
                                ).filter(AbstractAgentAccount.profile_id.in_(participant_ids),
                                         AbstractAgentAccount.verified == True,
                                         AbstractAgentAccount.email != None
                                         ).order_by(AbstractAgentAccount.preferred))

    if format == JSON_MIMETYPE:
        from assembl.lib.json import DateJSONEncoder
        combined = []
        interval_id = None
        interval_data = None
        interval_elements = ('interval_id', 'interval_start', 'interval_end')
        # We have fragmented interval+participant+key=>value.
        # Structure we're going for: List of intervals,
        # each data interval has list of combined participant info,
        # each in key=>value format.
        for element in results:
            element = element._asdict()
            if element['interval_id'] != interval_id:
                interval_data = {
                    k: element[k] for k in interval_elements
                }
                interval_data['data'] = interval_datalist = defaultdict(dict)
                combined.append(interval_data)
                interval_id = element['interval_id']
            participant_id = element['participant_id']
            if participant_id is not None:
                if element['value'] != 0:
                    data = interval_datalist[participant_id]
                    data[element['key']] = element['value']
                    data['participant'] = element['participant']
                    data['participant_id'] = participant_id
                    if with_email:
                        data['email'] = participant_emails.get(participant_id, '')
        for interval_data in combined:
            interval_data['data'] = interval_data['data'].values()
        return Response(json.dumps(combined, cls=DateJSONEncoder),
                        content_type=format)

    by_participant = defaultdict(defaultdict_of_dict)
    interval_ids = set()
    interval_starts = {}
    interval_ends = {}
    participant_names = {}
    email_column = int(with_email)

    for element in results:
        element = element._asdict()
        interval_id = element['interval_id']
        interval_ids.add(interval_id)
        interval_starts[interval_id] = element['interval_start']
        interval_ends[interval_id] = element['interval_end']
        pid = element['participant_id']
        value = element['value']
        if pid is not None and value != 0:
            participant_names[pid] = element['participant']
            key = element['key']
            by_participant[pid][interval_id][key] = value
    interval_ids = list(interval_ids)
    interval_ids.sort()
    num_cols = 2 + email_column + len(interval_ids) * len(data_descriptors)
    interval_starts = [interval_starts[id] for id in interval_ids]
    interval_ends = [interval_ends[id] for id in interval_ids]
    rows = []
    row = ['Participant id', 'Participant']
    if with_email:
        row.append('Email')
    for data_descriptor in data_descriptors:
        # TODO: i18n
        data_descriptor = ' '.join(data_descriptor.split('_')).title()
        row += [data_descriptor] * len(interval_ids)
    rows.append(row)
    empty_start = [''] * (1 + email_column)
    rows.append(empty_start + ['Interval id'] + interval_ids * len(data_descriptors))
    rows.append(empty_start + ['Interval start'] + interval_starts * len(data_descriptors))
    rows.append(empty_start + ['Interval end'] + interval_ends * len(data_descriptors))
    if sort_key == 'name':
        sorted_participants = [(name, id) for (id, name) in participant_names.iteritems()]
    elif sort_key == 'domain':
        sorted_participants = [(
            participant_emails.get(id, '').split('@')[-1],
            name, id) for (id, name) in participant_names.iteritems()]
    else:
        sorted_participants = [
            (-by_participant[id].get(interval_ids[-1], {}).get(sort_key, 0), id)
            for id in participant_names.iterkeys()]
    sorted_participants.sort()
    sorted_participants = [x[-1] for x in sorted_participants]
    for participant_id in sorted_participants:
        interval_data = by_participant[participant_id]
        row = [participant_id, participant_names[participant_id].encode('utf-8')]
        if with_email:
            email = participant_emails.get(participant_id, '') or ''
            row.append(email.encode('utf-8'))
        for data_descriptor in data_descriptors:
            row_part = [''] * len(interval_ids)
            for interval_id, data in interval_data.iteritems():
                row_part[interval_id - 1] = data.get(data_descriptor, '')
            row += row_part
        rows.append(row)

    return csv_response(rows, format)


def convert_to_utf8(rowdict):
    row = {}
    for key, value in rowdict.items():
        row[key.encode('utf-8')] = value.encode('utf-8') if isinstance(value, unicode) else value

    return row


def get_idea_parent_ids(idea):
    # Filter the RootIdea, as it's never reported in the exports
    return ", ".join([str(i.id) for i in idea.get_parents() if i.sqla_type != u'root_idea'])


def get_entries_locale_original(lang_string):
    if lang_string is None:
        return {
            "entry": '',
            "original": '',
            "locale": ''
        }
    entries = lang_string.best_entries_in_request_with_originals()
    if len(entries) == 1:
        best = entries[0]
        original = entries[0]
    if len(entries) > 1:
        best = entries[0]
        original = entries[-1]
    locale = best.locale.code
    return {
        "entry": best.value,
        "original": original.value,
        "locale": locale
    }


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Discussion, permission=P_ADMIN_DISC,
             name="phase1_csv_export")
def phase1_csv_export(request):
    """CSV export for phase 1."""
    from assembl.models import Locale, Idea
    from assembl.models.auth import LanguagePreferenceCollection
    has_lang = 'lang' in request.GET
    has_anon = asbool(request.GET.get('anon', False))
    if has_lang:
        language = request.GET['lang']
        exists = Locale.get_id_of(language, create=False)
        if not exists:
            language = u'fr'
    else:
        language = u'fr'

    # This is required so that the langstring methods can operate using correct globals
    # on the request object
    LanguagePreferenceCollection.setCurrentFromLocale(language, req=request)

    discussion = request.context._instance
    discussion_id = discussion.id
    Idea.prepare_counters(discussion_id, True)
    THEMATIC_NAME = u"Nom de la thématique"
    QUESTION_ID = u"Numéro de la question"
    QUESTION_TITLE = u"Intitulé de la question"
    POST_BODY = u"Réponse"
    POST_ID = u"Numéro du post"
    POST_LOCALE = u"Locale du post"
    POST_LIKE_COUNT = u"Nombre de \"J'aime\""
    POST_DISAGREE_COUNT = u"Nombre de \"En désaccord\""
    POST_CREATOR_NAME = u"Nom du contributeur"
    POST_CREATOR_EMAIL = u"Adresse mail du contributeur"
    POST_CREATION_DATE = u"Date/heure du post"
    SENTIMENT_ACTOR_NAME = u"Nom du votant"
    SENTIMENT_ACTOR_EMAIL = u"Adresse mail du votant"
    SENTIMENT_CREATION_DATE = u"Date/heure du vote"
    POST_BODY_ORIGINAL = u"Original"
    fieldnames = [
        THEMATIC_NAME.encode('utf-8'),
        QUESTION_ID.encode('utf-8'),
        QUESTION_TITLE.encode('utf-8'),
        POST_BODY.encode('utf-8'),
        POST_ID.encode('utf-8'),
        POST_LOCALE.encode('utf-8'),
        POST_LIKE_COUNT.encode('utf-8'),
        POST_DISAGREE_COUNT.encode('utf-8'),
        POST_CREATOR_NAME.encode('utf-8'),
        POST_CREATOR_EMAIL.encode('utf-8'),
        POST_CREATION_DATE.encode('utf-8'),
        SENTIMENT_ACTOR_NAME.encode('utf-8'),
        SENTIMENT_ACTOR_EMAIL.encode('utf-8'),
        SENTIMENT_CREATION_DATE.encode('utf-8'),
        POST_BODY_ORIGINAL.encode('utf-8')
    ]

    extra_columns_info = (None if 'no_extra_columns' in request.GET else
                          load_social_columns_info(discussion, language))
    if extra_columns_info:
        # insert after email
        fieldnames[8:8] = [name.encode('utf-8') for (name, path) in extra_columns_info]
        column_info_per_user = {}
        provider_id = get_provider_id_for_discussion(discussion)

    output = tempfile.NamedTemporaryFile('w+b', delete=True)
    # include BOM for Excel to open the file in UTF-8 properly
    output.write(u'\ufeff'.encode('utf-8'))
    writer = csv.DictWriter(
        output, dialect='excel', delimiter=';', fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
    writer.writeheader()
    survey_phase = get_phase_by_identifier(discussion, Phases.survey.value)
    thematics = get_ideas(survey_phase)
    for thematic in thematics:
        row = {}
        row[THEMATIC_NAME] = get_entries_locale_original(thematic.title).get('entry')
        for question in thematic.get_children():
            row[QUESTION_ID] = question.id
            row[QUESTION_TITLE] = get_entries_locale_original(question.title).get('entry')
            posts = get_published_posts(question)
            for post in posts:
                post_entries = get_entries_locale_original(post.body)
                row[POST_BODY] = sanitize_text(post_entries.get('entry'))
                row[POST_ID] = post.id
                row[POST_LOCALE] = post_entries.get('locale')
                row[POST_BODY_ORIGINAL] = sanitize_text(post_entries.get('original'))
                if not has_anon:
                    row[POST_CREATOR_NAME] = post.creator.real_name()
                else:
                    row[POST_CREATOR_NAME] = post.creator.anonymous_name()
                row[POST_CREATOR_EMAIL] = post.creator.get_preferred_email(anonymous=has_anon)
                row[POST_CREATION_DATE] = format_date(post.creation_date)
                row[POST_LIKE_COUNT] = post.like_count
                row[POST_DISAGREE_COUNT] = post.disagree_count
                if extra_columns_info:
                    if post.creator_id not in column_info_per_user:
                        column_info_per_user[post.creator_id] = get_social_columns_from_user(
                            post.creator, extra_columns_info, provider_id)
                    extra_info = column_info_per_user[post.creator_id]
                    for num, (name, path) in enumerate(extra_columns_info):
                        row[name] = extra_info[num]
                if not post.sentiments:
                    row[SENTIMENT_ACTOR_NAME] = u''
                    row[SENTIMENT_ACTOR_EMAIL] = u''
                    row[SENTIMENT_CREATION_DATE] = u''
                    writer.writerow(convert_to_utf8(row))

                for sentiment in post.sentiments:
                    if not has_anon:
                        row[SENTIMENT_ACTOR_NAME] = sentiment.actor.real_name()
                    else:
                        row[SENTIMENT_ACTOR_NAME] = sentiment.actor.anonymous_name()
                    row[SENTIMENT_ACTOR_EMAIL] = sentiment.actor.get_preferred_email(anonymous=has_anon)
                    row[SENTIMENT_CREATION_DATE] = format_date(sentiment.creation_date)
                    writer.writerow(convert_to_utf8(row))

    output.seek(0)
    response = request.response
    filename = 'phase1_export'
    response.content_type = 'application/vnd.ms-excel'
    response.content_disposition = 'attachment; filename="{}.csv"'.format(
        filename)
    response.app_iter = FileIter(output)
    return response


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Discussion, permission=P_ADMIN_DISC,
             name="phase2_csv_export")
def phase2_csv_export(request):
    """CSV export for phase 2."""
    from assembl.models import Locale, Idea
    has_anon = asbool(request.GET.get('anon', False))
    has_lang = 'lang' in request.GET
    if has_lang:
        language = request.GET['lang']
        exists = Locale.get_id_of(language, create=False)
        if not exists:
            language = u'fr'
    else:
        language = u'fr'

    # This is required so that the langstring methods can operate using correct globals
    # on the request object
    LanguagePreferenceCollection.setCurrentFromLocale(language, req=request)

    discussion = request.context._instance
    discussion_id = discussion.id
    Idea.prepare_counters(discussion_id, True)

    IDEA_ID = u"Numéro de l'idée"
    IDEA_PARENT_ID = u"Les numéros des parent d'idée"
    IDEA_NAME = u"Nom de l'idée"
    POST_SUBJECT = u"Sujet"
    POST_BODY = u"Post"
    POST_ID = u"Numéro du post"
    POST_LOCALE = u"Locale du post"
    POST_LIKE_COUNT = u"Nombre de \"J'aime\""
    POST_DISAGREE_COUNT = u"Nombre de \"En désaccord\""
    POST_CREATOR_NAME = u"Nom du contributeur"
    POST_CREATOR_EMAIL = u"Adresse mail du contributeur"
    POST_CREATION_DATE = u"Date/heure du post"
    SENTIMENT_ACTOR_NAME = u"Nom du votant"
    SENTIMENT_ACTOR_EMAIL = u"Adresse mail du votant"
    SENTIMENT_CREATION_DATE = u"Date/heure du vote"
    POST_BODY_ORIGINAL = u"Original"
    fieldnames = [
        IDEA_ID.encode('utf-8'),
        IDEA_PARENT_ID.encode('utf-8'),
        IDEA_NAME.encode('utf-8'),
        POST_SUBJECT.encode('utf-8'),
        POST_BODY.encode('utf-8'),
        POST_ID.encode('utf-8'),
        POST_LOCALE.encode('utf-8'),
        POST_LIKE_COUNT.encode('utf-8'),
        POST_DISAGREE_COUNT.encode('utf-8'),
        POST_CREATOR_NAME.encode('utf-8'),
        POST_CREATOR_EMAIL.encode('utf-8'),
        POST_CREATION_DATE.encode('utf-8'),
        SENTIMENT_ACTOR_NAME.encode('utf-8'),
        SENTIMENT_ACTOR_EMAIL.encode('utf-8'),
        SENTIMENT_CREATION_DATE.encode('utf-8'),
        POST_BODY_ORIGINAL.encode('utf-8')
    ]
    extra_columns_info = (None if 'no_extra_columns' in request.GET else
                          load_social_columns_info(discussion, language))

    if extra_columns_info:
        # insert after email
        fieldnames[8:8] = [name.encode('utf-8') for (name, path) in extra_columns_info]
        column_info_per_user = {}
        provider_id = get_provider_id_for_discussion(discussion)

    output = tempfile.NamedTemporaryFile('w+b', delete=True)
    # include BOM for Excel to open the file in UTF-8 properly
    output.write(u'\ufeff'.encode('utf-8'))
    writer = csv.DictWriter(
        output, dialect='excel', delimiter=';', fieldnames=fieldnames, quoting=csv.QUOTE_ALL)
    writer.writeheader()
    thread_phase = get_phase_by_identifier(discussion, Phases.thread.value)
    ideas = get_ideas(thread_phase)
    for idea in ideas:
        row = {}
        row[IDEA_ID] = idea.id
        row[IDEA_PARENT_ID] = get_idea_parent_ids(idea)
        row[IDEA_NAME] = get_entries_locale_original(idea.title).get('entry')
        posts = get_published_posts(idea)
        for post in posts:
            subject = get_entries_locale_original(post.subject)
            body = get_entries_locale_original(post.body)

            row[POST_SUBJECT] = subject.get('entry')
            row[POST_BODY] = sanitize_text(body.get('entry'))
            row[POST_BODY_ORIGINAL] = sanitize_text(body.get('original'))
            row[POST_ID] = post.id
            row[POST_LOCALE] = body.get('locale') or subject.get('locale') or None
            if not has_anon:
                row[POST_CREATOR_NAME] = post.creator.real_name()
            else:
                row[POST_CREATOR_NAME] = post.creator.anonymous_name()
            row[POST_CREATOR_EMAIL] = post.creator.get_preferred_email(anonymous=has_anon)
            row[POST_CREATION_DATE] = format_date(post.creation_date)
            row[POST_LIKE_COUNT] = post.like_count
            row[POST_DISAGREE_COUNT] = post.disagree_count
            if extra_columns_info:
                if post.creator_id not in column_info_per_user:
                    column_info_per_user[post.creator_id] = get_social_columns_from_user(
                        post.creator, extra_columns_info, provider_id)
                extra_info = column_info_per_user[post.creator_id]
                for num, (name, path) in enumerate(extra_columns_info):
                    row[name] = extra_info[num]
            if not post.sentiments:
                row[SENTIMENT_ACTOR_NAME] = u''
                row[SENTIMENT_ACTOR_EMAIL] = u''
                row[SENTIMENT_CREATION_DATE] = u''
                writer.writerow(convert_to_utf8(row))

            for sentiment in post.sentiments:
                if not has_anon:
                    row[SENTIMENT_ACTOR_NAME] = sentiment.actor.real_name()
                else:
                    row[SENTIMENT_ACTOR_NAME] = sentiment.actor.anonymous_name()
                row[SENTIMENT_ACTOR_EMAIL] = sentiment.actor.get_preferred_email(anonymous=has_anon)
                row[SENTIMENT_CREATION_DATE] = format_date(
                    sentiment.creation_date)
                writer.writerow(convert_to_utf8(row))

    output.seek(0)
    response = request.response
    filename = 'phase2_export'
    response.content_type = 'application/vnd.ms-excel'
    response.content_disposition = 'attachment; filename="{}.csv"'.format(
        filename)
    response.app_iter = FileIter(output)
    return response


@view_config(context=InstanceContext, name="update_notification_subscriptions",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_ADMIN_DISC, renderer='json')
def update_notification_subscriptions(request):
    discussion = request.context._instance
    participants = discussion.all_participants
    for user in participants:
        user.get_notification_subscriptions(discussion.id)
    return {'status': 'Notification subscriptions have been updated.'}


discussions_slugs = Service(
    name='discussions_slugs',
    path='/discussions_slugs',
    description="List of existing Discussion slugs",
    renderer='json'
)


@discussions_slugs.get()
def get_discussions_slugs(request):
    user_id = request.authenticated_userid or Everyone
    discussions = discussions_with_access(user_id)
    return {'discussions': [{'id': discussion.id, 'slug': discussion.slug} for discussion in discussions]}


def includeme(config):
    # Make sure that the cornice view is registered
    pass
