import re
import base64
from cStringIO import StringIO
from os import urandom
from os.path import join, dirname
from collections import defaultdict
import random
from datetime import timedelta

from sqlalchemy import (
    Column,
    Integer,
    UnicodeText,
    DateTime,
    Text,
    String,
    Boolean,
    event,
    ForeignKey,
    func,
    distinct
)


import simplejson as json
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPOk, HTTPBadRequest, HTTPUnauthorized, HTTPNotAcceptable, HTTPFound)
from pyramid_dogpile_cache import get_region
from pyramid.security import authenticated_userid, Everyone
from pyramid.renderers import JSONP_VALID_CALLBACK
from pyramid.settings import asbool
from pyramid_mailer import get_mailer
from pyramid_mailer.message import Message
import requests

from assembl.lib.config import get_config
from assembl.lib.parsedatetime import parse_datetime
from assembl.auth import (
    P_READ, P_READ_PUBLIC_CIF, P_ADMIN_DISC, P_SYSADMIN)
from assembl.auth.password import verify_data_token, data_token, Validity
from assembl.auth.util import get_permissions
from assembl.models import (Discussion, Permission)
from ..traversal import InstanceContext
from . import (JSON_HEADER, FORM_HEADER)
from sqlalchemy.orm.util import aliased


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

dogpile_fname = join(
    dirname(dirname(dirname(dirname(__file__)))),
    get_config().get('dogpile_cache.arguments.filename'))

discussion_jsonld_cache = get_region(
    'discussion_jsonld', **{"arguments.filename": dogpile_fname})
userprivate_jsonld_cache = get_region(
    'userprivate_jsonld', **{"arguments.filename": dogpile_fname})


@discussion_jsonld_cache.cache_on_arguments()
def discussion_jsonld(discussion_id):
    from assembl.semantic.virtuoso_mapping import AssemblQuadStorageManager
    aqsm = AssemblQuadStorageManager()
    return aqsm.as_jsonld(discussion_id)


@userprivate_jsonld_cache.cache_on_arguments()
def userprivate_jsonld(discussion_id):
    from assembl.semantic.virtuoso_mapping import AssemblQuadStorageManager
    aqsm = AssemblQuadStorageManager()
    cg = aqsm.participants_private_as_graph(discussion_id)
    return aqsm.graph_as_jsonld(cg)


def read_user_token(request):
    salt = None
    user_id = authenticated_userid(request) or Everyone
    discussion_id = request.context.get_discussion_id()
    permissions = get_permissions(user_id, discussion_id)
    if P_READ in permissions:
        permissions.append(P_READ_PUBLIC_CIF)

    if 'token' in request.GET:
        token = request.GET['token'].encode('ascii')
        data, valid = verify_data_token(token, max_age=timedelta(hours=1))
        if valid != Validity.VALID:
            raise HTTPBadRequest("Invalid token")
        try:
            data, salt = data.split('.', 1)
            salt = base64.urlsafe_b64decode(salt)
            data = [int(i) for i in data.split(',')]
            t_user_id, t_discussion_id = data[:2]
            req_permissions = data[2:]
            if len(req_permissions):
                req_permissions = [x for (x,) in Permission.default_db.query(
                    Permission.name).filter(
                    Permission.id.in_(req_permissions)).all()]
        except (ValueError, IndexError):
            raise HTTPBadRequest("Invalid token")
        if discussion_id is not None and t_discussion_id != discussion_id:
            raise HTTPUnauthorized("Token for another discussion")
        if user_id == Everyone:
            permissions = get_permissions(t_user_id, discussion_id)
            if P_READ in permissions:
                permissions.append(P_READ_PUBLIC_CIF)
        elif t_user_id != user_id:
            raise HTTPUnauthorized("Token for another user")
        user_id = t_user_id
        permissions = set(permissions).intersection(set(req_permissions))
    return user_id, permissions, salt


def handle_jsonp(callback_fn, json):
    # TODO: Use an augmented JSONP renderer with ld content-type
    if not JSONP_VALID_CALLBACK.match(callback_fn):
        raise HTTPBadRequest("invalid callback name")
    return "/**/{0}({1});".format(callback_fn.encode('ascii'), json)


def permission_token(
        user_id, discussion_id, req_permissions, random_str=None):
    random_str = random_str or urandom(8)
    if isinstance(req_permissions, list):
        req_permissions = set(req_permissions)
    else:
        req_permissions = set((req_permissions,))
    permissions = get_permissions(user_id, discussion_id)
    if not req_permissions:
        req_permissions = permissions
    elif P_SYSADMIN not in permissions:
        req_permissions = req_permissions.intersection(set(permissions))
    req_permissions = list(req_permissions)
    user_id = 0 if user_id == Everyone else user_id
    data = [str(user_id), str(discussion_id)]
    data.extend([str(x) for (x,) in Permission.default_db.query(
            Permission.id).filter(Permission.name.in_(req_permissions)).all()])
    data = ','.join(data) + '.' + base64.urlsafe_b64encode(random_str)
    return data_token(data)


@view_config(context=InstanceContext, name="perm_token",
             ctx_instance_class=Discussion, request_method='GET',
             accept="application/ld+json", renderer="json")
def get_token(request):
    user_id = authenticated_userid(request)
    if not user_id:
        raise HTTPUnauthorized()
    discussion_id = request.context.get_discussion_id()
    permission_sets = request.GET.getall('permissions')
    if permission_sets:
        permission_sets = [s.split(',') for s in permission_sets]
        for permissions in permission_sets:
            if P_READ in permissions:
                permissions.append(P_READ_PUBLIC_CIF)
        permission_sets = [sorted(set(permissions))
                           for permissions in permission_sets]
    else:
        permission_sets = [[P_READ, P_READ_PUBLIC_CIF]]
    random_str = urandom(8)
    data = {','.join(permissions): permission_token(
        user_id, discussion_id, permissions, random_str)
        for permissions in permission_sets}
    user_ids = request.GET.getall("user_id")
    if user_ids:
        from assembl.semantic.virtuoso_mapping import (
            AssemblQuadStorageManager, AESObfuscator)
        obfuscator = AESObfuscator(random_str)
        user_ids = "\n".join(user_ids)
        data["user_ids"] = AssemblQuadStorageManager.obfuscate(
            user_ids, obfuscator.encrypt).split("\n")
    return data


@view_config(context=InstanceContext, name="jsonld",
             ctx_instance_class=Discussion, request_method='GET',
             accept="application/ld+json")
@view_config(context=InstanceContext,
             ctx_instance_class=Discussion, request_method='GET',
             accept="application/ld+json")
def discussion_instance_view_jsonld(request):
    discussion = request.context._instance
    user_id, permissions, salt = read_user_token(request)
    if not (P_READ in permissions or P_READ_PUBLIC_CIF in permissions):
        raise HTTPUnauthorized()
    if not salt and P_ADMIN_DISC not in permissions:
        salt = base64.urlsafe_b64encode(urandom(6))

    jdata = discussion_jsonld(discussion.id)
    if salt:
        from assembl.semantic.virtuoso_mapping import (
            AssemblQuadStorageManager, AESObfuscator)
        obfuscator = AESObfuscator(salt)
        jdata = AssemblQuadStorageManager.obfuscate(jdata, obfuscator.encrypt)
    # TODO: Add age
    if "callback" in request.GET:
        jdata = handle_jsonp(request.GET['callback'], jdata)
        content_type = "application/json-p"
    else:
        content_type = "application/ld+json"
    return Response(body=jdata, content_type=content_type)


@view_config(context=InstanceContext, name="private_jsonld",
             ctx_instance_class=Discussion, request_method='GET',
             accept="application/ld+json")
def user_private_view_jsonld(request):
    if request.scheme == "http" and asbool(request.registry.settings.get(
            'accept_secure_connection', False)):
        return HTTPFound("https://" + request.host + request.path_qs)
    discussion_id = request.context.get_discussion_id()
    user_id, permissions, salt = read_user_token(request)
    if P_READ not in permissions:
        raise HTTPUnauthorized()
    if not salt and P_ADMIN_DISC not in permissions:
        salt = base64.urlsafe_b64encode(urandom(6))

    jdata = userprivate_jsonld(discussion_id)
    if salt:
        from assembl.semantic.virtuoso_mapping import (
            AssemblQuadStorageManager, AESObfuscator)
        obfuscator = AESObfuscator(salt)
        jdata = AssemblQuadStorageManager.obfuscate(jdata, obfuscator.encrypt)
    if "callback" in request.GET:
        jdata = handle_jsonp(request.GET['callback'], jdata)
        content_type = "application/json-p"
    else:
        content_type = "application/ld+json"
    return Response(body=jdata, content_type=content_type)

@view_config(context=InstanceContext, name="time_series_analytics",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_ADMIN_DISC)
def get_time_series_analytics(request):
    import isodate
    from datetime import datetime
    start = request.GET.get("start", None)
    end = request.GET.get("end", None)
    interval = request.GET.get("interval", None)
    discussion = request.context._instance
    user_id = authenticated_userid(request) or Everyone
    try:
        if start:
            start = parse_datetime(start)
        if end:
            end = parse_datetime(end)
        if interval:
            interval = isodate.parse_duration(interval)
    except isodate.ISO8601Error as e:
        raise HTTPBadRequest(e)
    if interval and not start:
        raise HTTPBadRequest("You cannot define an interval and no start")
    if interval and not end:
        end = datetime.now()
    results = []

    from sqlalchemy import Table, MetaData, and_, case, cast, Float
    from sqlalchemy.exc import ProgrammingError
    import pprint
    import transaction
    with transaction.manager:
        metadata = MetaData(discussion.db.get_bind())

        intervals_table = Table('temp_table_intervals_' + str(user_id), metadata,
            Column('interval_id', Integer, primary_key=True),
            Column('interval_start', DateTime, nullable=False),
            Column('interval_end', DateTime, nullable=False),
            prefixes=None if discussion.using_virtuoso else ['TEMPORARY']
        )
        try:
            intervals_table.drop()  # In case there is a leftover from a previous crash
        except ProgrammingError:
            pass
        intervals_table.create()
        interval_start = start
        intervals = []
        if interval:
            while interval_start < end:
                interval_end = min(interval_start + interval, end)
                intervals.append({'interval_start': interval_start, 'interval_end': interval_end})
                interval_start = interval_start + interval
            #pprint.pprint(intervals)
            discussion.db.execute(intervals_table.insert(), intervals)
        else:
            raise Exception("WRITEME")

        from assembl.models import Post, AgentProfile, AgentStatusInDiscussion, ViewPost

        # The posters
        post_subquery = discussion.db.query(intervals_table.c.interval_id,
            func.count(distinct(Post.id)).label('count_posts'),
            func.count(distinct(Post.creator_id)).label('count_post_authors'),
            # func.DB.DBA.BAG_AGG(Post.creator_id).label('post_authors'),
            # func.DB.DBA.BAG_AGG(Post.id).label('post_ids'),
            )
        post_subquery = post_subquery.outerjoin(Post, and_(Post.creation_date >= intervals_table.c.interval_start, Post.creation_date < intervals_table.c.interval_end, Post.discussion_id == discussion.id))
        post_subquery = post_subquery.group_by(intervals_table.c.interval_id)
        post_subquery = post_subquery.subquery()

        # The cumulative posters
        cumulative_posts_aliased = aliased(Post)
        cumulative_posts_subquery = discussion.db.query(intervals_table.c.interval_id,
            func.count(distinct(cumulative_posts_aliased.id)).label('count_cumulative_posts'),
            func.count(distinct(cumulative_posts_aliased.creator_id)).label('count_cumulative_post_authors')
            # func.DB.DBA.BAG_AGG(cumulative_posts_aliased.id).label('cumulative_post_ids')
            )
        cumulative_posts_subquery = cumulative_posts_subquery.outerjoin(cumulative_posts_aliased, and_(cumulative_posts_aliased.creation_date < intervals_table.c.interval_end, cumulative_posts_aliased.discussion_id == discussion.id))
        cumulative_posts_subquery = cumulative_posts_subquery.group_by(intervals_table.c.interval_id)
        cumulative_posts_subquery = cumulative_posts_subquery.subquery()

        # The post viewers
        postViewers = aliased(ViewPost)
        viewedPosts = aliased(Post)
        post_viewers_subquery = discussion.db.query(intervals_table.c.interval_id,
            func.count(distinct(postViewers.actor_id)).label('UNRELIABLE_count_post_viewers')
            )
        post_viewers_subquery = post_viewers_subquery.outerjoin(postViewers, and_(postViewers.creation_date >= intervals_table.c.interval_start, postViewers.creation_date < intervals_table.c.interval_end)).\
                        join(viewedPosts, and_(postViewers.post_id == viewedPosts.id, viewedPosts.discussion_id == discussion.id))
        post_viewers_subquery = post_viewers_subquery.group_by(intervals_table.c.interval_id)
        post_viewers_subquery = post_viewers_subquery.subquery()

        # The visitors
        firstTimeVisitorAgent = aliased(AgentStatusInDiscussion)
        visitors_subquery = discussion.db.query(intervals_table.c.interval_id,
            func.count(firstTimeVisitorAgent.id).label('count_first_time_logged_in_visitors'),
            # func.DB.DBA.BAG_AGG(firstTimeVisitorAgent.id).label('first_time_visitors')
            )
        visitors_subquery = visitors_subquery.outerjoin(firstTimeVisitorAgent, and_(firstTimeVisitorAgent.first_visit >= intervals_table.c.interval_start, firstTimeVisitorAgent.first_visit < intervals_table.c.interval_end, firstTimeVisitorAgent.discussion_id == discussion.id))
        visitors_subquery = visitors_subquery.group_by(intervals_table.c.interval_id)
        visitors_subquery = visitors_subquery.subquery()

        # The cumulative visitors
        cumulativeVisitorAgent = aliased(AgentStatusInDiscussion)
        cumulative_visitors_query = discussion.db.query(intervals_table.c.interval_id,
            func.count(distinct(cumulativeVisitorAgent.id)).label('count_cumulative_logged_in_visitors'),
            # func.DB.DBA.BAG_AGG(cumulativeVisitorAgent.id).label('first_time_visitors')
            )
        cumulative_visitors_query = cumulative_visitors_query.outerjoin(cumulativeVisitorAgent, and_(cumulativeVisitorAgent.first_visit < intervals_table.c.interval_end, cumulativeVisitorAgent.discussion_id == discussion.id))
        cumulative_visitors_query = cumulative_visitors_query.group_by(intervals_table.c.interval_id)
        cumulative_visitors_subquery = cumulative_visitors_query.subquery()
        # query = cumulative_visitors_query

        # The members (can go up and down...)  Assumes that first_subscribed is available
        commented_out = """ first_subscribed isn't yet filled in by assembl
        memberAgentStatus = aliased(AgentStatusInDiscussion)
        members_subquery = discussion.db.query(intervals_table.c.interval_id,
            func.count(memberAgentStatus.id).label('count_approximate_members')
            )
        members_subquery = members_subquery.outerjoin(memberAgentStatus, ((memberAgentStatus.last_unsubscribed >= intervals_table.c.interval_end) | (memberAgentStatus.last_unsubscribed.is_(None))) & ((memberAgentStatus.first_subscribed < intervals_table.c.interval_end) | (memberAgentStatus.first_subscribed.is_(None))) & (memberAgentStatus.discussion_id==discussion.id))
        members_subquery = members_subquery.group_by(intervals_table.c.interval_id)
        query = members_subquery
        members_subquery = members_subquery.subquery()
        """

        subscribersAgentStatus = aliased(AgentStatusInDiscussion)
        subscribers_query = discussion.db.query(intervals_table.c.interval_id,
                                                func.sum(
                                                    case([
                                                          (subscribersAgentStatus.last_visit == None, 0),
                                                          (and_(subscribersAgentStatus.last_visit < intervals_table.c.interval_end, subscribersAgentStatus.last_visit >= intervals_table.c.interval_start), 1)
                                                          ], else_=0)
                                                         ).label('retention_count_last_visit_in_period'),
                                                func.sum(
                                                    case([
                                                          (subscribersAgentStatus.first_visit == None, 0),
                                                          (and_(subscribersAgentStatus.first_visit < intervals_table.c.interval_end, subscribersAgentStatus.first_visit >= intervals_table.c.interval_start), 1)
                                                          ], else_=0)
                                                         ).label('recruitment_count_first_visit_in_period'),
                                                func.sum(
                                                    case([
                                                          (subscribersAgentStatus.first_subscribed == None, 0),
                                                          (and_(subscribersAgentStatus.first_subscribed < intervals_table.c.interval_end, subscribersAgentStatus.first_subscribed >= intervals_table.c.interval_start), 1)
                                                          ], else_=0)
                                                         ).label('UNRELIABLE_recruitment_count_first_subscribed_in_period'),
                                                func.sum(
                                                    case([
                                                          (subscribersAgentStatus.last_unsubscribed == None, 0),
                                                          (and_(subscribersAgentStatus.last_unsubscribed < intervals_table.c.interval_end, subscribersAgentStatus.last_unsubscribed >= intervals_table.c.interval_start), 1)
                                                          ], else_=0)
                                                         ).label('UNRELIABLE_retention_count_first_subscribed_in_period'),
                                            )
        subscribers_query = subscribers_query.outerjoin(subscribersAgentStatus, subscribersAgentStatus.discussion_id==discussion.id)
        subscribers_query = subscribers_query.group_by(intervals_table.c.interval_id)
        subscribers_subquery = subscribers_query.subquery()
        #query = subscribers_query

        combined_query = discussion.db.query(intervals_table,
                                             post_subquery,
                                             cumulative_posts_subquery,
                                             post_viewers_subquery,
                                             visitors_subquery,
                                             cumulative_visitors_subquery,
                                             case([
                                                   (cumulative_posts_subquery.c.count_cumulative_post_authors == 0, None),
                                                   (cumulative_posts_subquery.c.count_cumulative_post_authors != 0, (cast(post_subquery.c.count_post_authors, Float) / cast(cumulative_posts_subquery.c.count_cumulative_post_authors, Float)))
                                                   ]).label('fraction_cumulative_authors_who_posted_in_period'),
                                             case([
                                                   (cumulative_posts_subquery.c.count_cumulative_post_authors == 0, None),
                                                   (cumulative_posts_subquery.c.count_cumulative_post_authors != 0, (cast(post_subquery.c.count_post_authors, Float) / cast(cumulative_visitors_subquery.c.count_cumulative_logged_in_visitors, Float)))
                                                   ]).label('fraction_cumulative_logged_in_visitors_who_posted_in_period'),
                                             subscribers_subquery,
                                             )
        combined_query = combined_query.join(post_subquery, post_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(post_viewers_subquery, post_viewers_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(visitors_subquery, visitors_subquery.c.interval_id == intervals_table.c.interval_id)
        combined_query = combined_query.join(cumulative_visitors_subquery, cumulative_visitors_subquery.c.interval_id == intervals_table.c.interval_id)
        # combined_query = combined_query.join(members_subquery, members_subquery.c.interval_id==intervals_table.c.interval_id)
        combined_query = combined_query.join(subscribers_subquery, subscribers_subquery.c.interval_id==intervals_table.c.interval_id)
        combined_query = combined_query.join(cumulative_posts_subquery, cumulative_posts_subquery.c.interval_id == intervals_table.c.interval_id)

        query = combined_query
        query = query.order_by(intervals_table.c.interval_id)
        results = query.all()

        #pprint.pprint(results)

        if not (request.GET.get('format', None) == 'csv'
                or request.accept == 'text/csv'):
            # json default
            for v in results:
                # pprint.pprint(v)
                # v['count'] = {agent.display_name(): count
                #              for (agent, count) in v['count']}
                # v['unique_contributors_count'] = len(v['count'])
                pass
        transaction.commit()
        intervals_table.drop()
        from assembl.lib.json import DateJSONEncoder
        return Response(json.dumps(results, cls=DateJSONEncoder), content_type='application/json')


@view_config(context=InstanceContext, name="contribution_count",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_ADMIN_DISC)
def get_contribution_count(request):
    import isodate
    from datetime import datetime
    start = request.GET.get("start", None)
    end = request.GET.get("end", None)
    interval = request.GET.get("interval", None)
    discussion = request.context._instance
    try:
        if start:
            start = parse_datetime(start)
        if end:
            end = parse_datetime(end)
        if interval:
            interval = isodate.parse_duration(interval)
    except isodate.ISO8601Error as e:
        raise HTTPBadRequest(e)
    if interval and not start:
        raise HTTPBadRequest("You cannot define an interval and no start")
    if interval and not end:
        end = datetime.now()
    results = []
    if interval:
        while start < end:
            this_end = min(start+interval, end)
            results.append(dict(
                start=start.isoformat(), end=this_end.isoformat(),
                count=discussion.count_contributions_per_agent(
                    start, this_end)))
            start = this_end
    else:
        r = dict(count=discussion.count_contributions_per_agent(start, end))
        if not start:
            from assembl.models import Post
            from sqlalchemy import func
            (start,) = discussion.db.query(
                func.min(Post.creation_date)).filter_by(
                discussion_id=discussion.id).first()
        r["start"] = start.isoformat()
        if not end:
            end = datetime.now()
        r["end"] = end.isoformat()
        results.append(r)
    if not (request.GET.get('format', None) == 'csv'
            or request.accept == 'text/csv'):
        # json default
        for v in results:
            v['count'] = {agent.display_name(): count
                          for (agent, count) in v['count']}
        return Response(json.dumps(results), content_type='application/json')
    # otherwise assume csv
    from csv import writer
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
    output = StringIO()
    csv = writer(output)
    csv.writerow(['Start']+[
        x['start'] for x in results] + ['Total'])
    csv.writerow(['End']+[
        x['end'] for x in results] + [''])
    for agent_id, total_count in count_list:
        agent = agents[agent_id]
        agent_name = (
            agent.display_name() or agent.real_name() or
            agent.get_preferred_email())
        csv.writerow([agent_name.encode('utf-8')] + [
            x['count'].get(agent_id, '') for x in results] + [total_count])
    output.seek(0)
    return Response(body_file=output, content_type='text/csv')


@view_config(context=InstanceContext, name="visit_count",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_ADMIN_DISC)
def get_visit_count(request):
    import isodate
    from datetime import datetime
    start = request.GET.get("start", None)
    end = request.GET.get("end", None)
    interval = request.GET.get("interval", None)
    discussion = request.context._instance
    try:
        if start:
            start = parse_datetime(start)
        if end:
            end = parse_datetime(end)
        if interval:
            interval = isodate.parse_duration(interval)
    except isodate.ISO8601Error as e:
        raise HTTPBadRequest(e)
    if interval and not start:
        raise HTTPBadRequest("You cannot define an interval and no start")
    if interval and not end:
        end = datetime.now()
    results = []
    if interval:
        while start < end:
            this_end = min(start+interval, end)
            results.append(dict(
                start=start.isoformat(), end=this_end.isoformat(),
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
            from assembl.models import Post
            from sqlalchemy import func
            (start,) = discussion.db.query(
                func.min(Post.creation_date)).filter_by(
                discussion_id=discussion.id).first()
        r["start"] = start.isoformat()
        if not end:
            end = datetime.now()
        r["end"] = end.isoformat()
        results.append(r)
    if not (request.GET.get('format', None) == 'csv'
            or request.accept == 'text/csv'):
        # json default
        return Response(json.dumps(results), content_type='application/json')
    # otherwise assume csv
    from csv import DictWriter
    output = StringIO()
    csv = DictWriter(output, fieldnames=[
        'start', 'end', 'first_visitors', 'readers'])
    csv.writeheader()
    for r in results:
        csv.writerow(r)
    output.seek(0)
    return Response(body_file=output, content_type='text/csv')


@view_config(context=InstanceContext, name="visitors",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_ADMIN_DISC)
def get_visitors(request):
    discussion = request.context._instance
    visitors = [
        (st.last_visit, st.agent_profile.name,
            st.agent_profile.get_preferred_email())
        for st in discussion.agent_status_in_discussion if st.last_visit]
    visitors.sort()
    visitors.reverse()
    body = "\n".join(("%s: %s <%s>" % (x[0].isoformat(), x[1], x[2])
                      for x in visitors))
    return Response(body=body, content_type='text/text')


pygraphviz_formats = {
    'text/vnd.graphviz': 'dot',
    'image/gif': 'gif',
    'application/vnd.hp-hpgl': 'hpgl',
    'image/jpeg': 'jpeg',
    'application/vnd.mif': 'mif',
    'application/vnd.hp-pcl': 'pcl',
    'application/pdf': 'pdf',
    'image/x-pict': 'pic',
    'image/png': 'png',
    'application/postscript': 'ps',
    'image/svg+xml': 'svg',
    'model/vrml': 'vrml',
}


@view_config(context=InstanceContext, name="mindmap",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_READ)
def as_mind_map(request):
    for mimetype in request.GET.getall('mimetype'):
        mimetype = mimetype.encode('utf-8')
        if mimetype in pygraphviz_formats:
            break
    else:
        mimetype = request.accept.best_match(pygraphviz_formats.keys())
        if not mimetype:
            raise HTTPNotAcceptable("Not known to pygraphviz: "+mimetype)
    discussion = request.context._instance
    G = discussion.as_mind_map()
    G.layout(prog='twopi')
    io = StringIO()
    G.draw(io, format=pygraphviz_formats[mimetype])
    io.seek(0)
    return Response(body_file=io, content_type=mimetype)


def get_analytics_alerts(discussion, user_id, types, all_users=False):
    from assembl.semantic.virtuoso_mapping import (
        AssemblQuadStorageManager, AESObfuscator)
    settings = get_config()
    metrics_server_endpoint = settings.get(
        'metrics_server_endpoint',
        'https://discussions.bluenove.com/analytics/accept')
    verify_metrics = False  # weird SNI bug on some platforms
    protocol = 'https' if asbool(settings.get(
        'accept_secure_connection', False)) else 'http'
    host = settings.get('public_hostname')
    if settings.get('public_port', 80) != 80:
        # TODO: public_secure_port?
        host += ':'+str(settings.get('public_port'))
    seed = urandom(8)
    obfuscator = AESObfuscator(seed)
    token = permission_token(user_id, discussion.id, [P_READ_PUBLIC_CIF], seed)
    metrics_requests = [{
        "metric": "alerts",
        "types": types}]
    if user_id != Everyone and not all_users:
        obfuscated_userid = "local:AgentProfile/" + obfuscator.encrypt(
            str(user_id))
        metrics_requests[0]['users'] = [obfuscated_userid]
    mapurl = '%s://%s/data/Discussion/%d/jsonld?token=%s' % (
        protocol,
        host,
        discussion.id,
        token
        )
    alerts = requests.post(metrics_server_endpoint, data=dict(
        mapurl=mapurl, requests=json.dumps(metrics_requests), recency=60),
        verify=verify_metrics)
    result = AssemblQuadStorageManager.deobfuscate(
        alerts.text, obfuscator.decrypt)
    # AgentAccount is a pseudo for AgentProfile
    result = re.sub(r'local:AgentAccount\\/', r'local:AgentProfile\\/', result)
    return result


@view_config(context=InstanceContext, name="activity_alerts",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_ADMIN_DISC)
def get_activity_alerts(request):
    discussion = request.context._instance
    user_id = authenticated_userid(request) or Everyone
    result = get_analytics_alerts(
        discussion, user_id,
        ["lurking_user", "inactive_user", "user_gone_inactive"],
        True)
    return Response(body=result, content_type='application/json')


@view_config(context=InstanceContext, name="interest_alerts",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_ADMIN_DISC)
def get_interest_alerts(request):
    discussion = request.context._instance
    user_id = authenticated_userid(request) or Everyone
    result = get_analytics_alerts(
        discussion, user_id,
        ["interesting_to_me"],
        True)
    return Response(body=result, content_type='application/json')


@view_config(context=InstanceContext, name="clusters",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_ADMIN_DISC)
def show_cluster(request):
    discussion = request.context._instance
    output = StringIO()
    from assembl.nlp.clusters import SKLearnClusteringSemanticAnalysis
    analysis = SKLearnClusteringSemanticAnalysis(discussion)
    analysis.as_html(output)
    output.seek(0)
    return Response(body_file=output, content_type='text/html')


@view_config(context=InstanceContext, name="optics",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_READ)
def show_optics_cluster(request):
    discussion = request.context._instance
    eps = float(request.GET.get("eps", "0.02"))
    min_samples = int(request.GET.get("min_samples", "3"))
    test_code = request.GET.get("test_code", None)
    suggestions = request.GET.get("suggestions", True)
    discussion = request.context._instance
    output = StringIO()
    user_id = authenticated_userid(request) or Everyone
    from assembl.nlp.clusters import (
        OpticsSemanticsAnalysis, OpticsSemanticsAnalysisWithSuggestions)
    if asbool(suggestions):
        analysis = OpticsSemanticsAnalysisWithSuggestions(
            discussion, min_samples=min_samples, eps=eps,
            user_id=user_id, test_code=test_code)
    else:
        analysis = OpticsSemanticsAnalysis(
            discussion, min_samples=min_samples, eps=eps,
            user_id=user_id, test_code=test_code)
    from pyramid_jinja2 import IJinja2Environment
    jinja_env = request.registry.queryUtility(
        IJinja2Environment, name='.jinja2')
    analysis.as_html(output, jinja_env)
    output.seek(0)
    return Response(body_file=output, content_type='text/html')


@view_config(context=InstanceContext, name="suggestions_test",
             ctx_instance_class=Discussion, request_method='GET',
             permission=P_READ)
def show_suggestions_test(request):
    discussion = request.context._instance
    user_id = authenticated_userid(request)
    if not user_id:
        from urllib import quote
        raise HTTPFound(location="/login?next="+quote(request.path))
    discussion = request.context._instance
    output = StringIO()
    from assembl.nlp.clusters import OpticsSemanticsAnalysisWithSuggestions
    analysis = OpticsSemanticsAnalysisWithSuggestions(
        discussion, user_id=user_id, min_samples=3, test_code=str(user_id))
    from pyramid_jinja2 import IJinja2Environment
    jinja_env = request.registry.queryUtility(
        IJinja2Environment, name='.jinja2')
    analysis.as_html(output, jinja_env)
    output.seek(0)
    return Response(body_file=output, content_type='text/html')


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
