import os
from functools import partial
import re
import base64
from cStringIO import StringIO
from os import urandom
from os.path import join, dirname
from itertools import chain
from collections import defaultdict
import random


import simplejson as json
from pyramid.response import Response
from pyramid.view import view_config
from pyramid.httpexceptions import (
    HTTPOk, HTTPBadRequest, HTTPUnauthorized, HTTPNotAcceptable, HTTPFound)
from pyramid_dogpile_cache import get_region
from pyramid.security import authenticated_userid, Everyone
from pyramid.renderers import JSONP_VALID_CALLBACK
from pyramid.settings import asbool
import requests

from assembl.lib.config import get_config
from assembl.lib.parsedatetime import parse_datetime
from assembl.auth import (
    P_READ, P_READ_PUBLIC_CIF, P_ADMIN_DISC, P_SYSADMIN, Everyone)
from assembl.auth.password import verify_data_token, data_token
from assembl.auth.util import get_permissions
from assembl.models import (Discussion, Permission, AgentProfile)
from ..traversal import InstanceContext
from . import JSON_HEADER


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
        data = verify_data_token(token)
        if data is None:
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
             accept="application/ld+json")
def get_token(request):
    user_id = authenticated_userid(request)
    if not user_id:
        raise HTTPUnauthorized()
    discussion_id = request.context.get_discussion_id()
    permissions = request.GET.getall('permission') or [
        P_READ, P_READ_PUBLIC_CIF]
    if P_READ in permissions:
        permissions.append(P_READ_PUBLIC_CIF)
    permissions = list(set(permissions))
    random_seed = request.GET.get('seed', None)
    # TODO: Rewrite that crap so randomness is internal,
    # give a pair of tokens.
    if random_seed:
        # We need some determinism
        random.seed(random_seed)
        random_str = ''.join([chr(random.randint(0, 256)) for i in range(8)])
        # Restore normal randomness
        random.seed(urandom(8))
    else:
        random_str = urandom(8)
    data = permission_token(
        user_id, discussion_id, permissions, random_str)
    return Response(body=data, content_type="text/text")


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
            (start,) = discussion.db.query(func.min(Post.creation_date)
                ).filter_by(discussion_id=discussion.id).first()
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
            (start,) = discussion.db.query(func.min(Post.creation_date)
                ).filter_by(discussion_id=discussion.id).first()
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
    io=StringIO()
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
    scrambler = None
    if test_code:
        from random import Random
        scrambler = Random()
        scrambler.seed(
            get_config().get('session.secret') + test_code + discussion.slug)
    discussion = request.context._instance
    output = StringIO()
    from assembl.nlp.clusters import OpticsSemanticsAnalysisWithSuggestions
    analysis = OpticsSemanticsAnalysisWithSuggestions(
        discussion, min_samples=min_samples, eps=eps, scrambler=scrambler)
    analysis.as_html(output)
    output.seek(0)
    return Response(body_file=output, content_type='text/html')
