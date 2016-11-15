"""Cornice API for discussions"""
import json
import requests

from pyramid.httpexceptions import HTTPNotFound
from pyramid.response import Response
from pyramid.security import authenticated_userid, Everyone

from cornice import Service

from assembl.views.api import API_DISCUSSION_PREFIX

from assembl.models import Discussion

from assembl.lib import config

from ...auth import P_READ, P_ADMIN_DISC
from ...auth.util import get_permissions

import string
import random

discussion = Service(
    name='discussion',
    path=API_DISCUSSION_PREFIX,
    description="Manipulate a single Discussion object",
    renderer='json',
)

discussion_bind_piwik = Service(name='discussion_bind_piwik', path=API_DISCUSSION_PREFIX + '/bind_piwik',
    description="Bind a Discussion to a Piwik instance, by creating a Piwik user and website, and associating this website id to the Discussion",
    renderer='json')


@discussion.get(permission=P_READ)
def get_discussion(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)
    view_def = request.GET.get('view') or 'default'
    user_id = authenticated_userid(request) or Everyone
    permissions = get_permissions(user_id, discussion_id)

    if not discussion:
        raise HTTPNotFound(
            "Discussion with id '%s' not found." % discussion_id)

    return discussion.generic_json(view_def, user_id, permissions)


# This should be a PUT, but the backbone save method is confused by
# discussion URLs.
@discussion.put(permission=P_ADMIN_DISC)
def post_discussion(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get_instance(discussion_id)

    if not discussion:
        raise HTTPNotFound(
            "Discussion with id '%s' not found." % discussion_id)

    discussion_data = json.loads(request.body)

    discussion.topic = discussion_data.get('topic', discussion.slug)
    discussion.slug = discussion_data.get('slug', discussion.slug)
    discussion.objectives = discussion_data.get(
        'objectives', discussion.objectives)

    return {'ok': True}

@discussion_bind_piwik.get(permission=P_ADMIN_DISC)
def bind_piwik(request):
    user_email = request.GET.get('user_email') or None
    piwik_url = config.get('web_analytics_piwik_url')
    piwik_api_token = config.get('web_analytics_piwik_api_token')

    if not (user_email and piwik_url and piwik_api_token):
        return Response(
            status=500,
            body="missing configuration variables: need user_email, piwik_url and piwik_api_token")

    piwik_api_params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }

    try:
        # check wether a Piwik user with a `user_email` login exists
        user_already_exists = piwik_UsersManager_userExists(piwik_url, piwik_api_token, user_email)
        user_created = False
        user_password = ""
        if not user_already_exists:
            # create a Piwik user with `user_email` login
            user_password = string_generator(size=10)
            user_created = piwik_UsersManager_addUser(piwik_url, piwik_api_token, user_email, user_password, user_email)
            if not user_created:
                raise requests.ConnectionError()

        # ### begin TODO ###
        # # check wether a Piwik site with this URL already exists
        # site_url = None # TODO: discussion.url
        # site_already_exists = False # TODO: piwik_SitesManager_getSitesIdFromSiteUrl(url)
        # site_ids = None # TODO: piwik_SitesManager_getSitesIdFromSiteUrl(url)
        # site_id = None
        # if len(site_ids) == 1:
        #     site_id = site_ids[0]
        #     site_already_exists = True
        # elif len(site_ids) == 0:
        #     site_already_exists = False
        # else:
        #     return Response(
        #         status=503,
        #         body="several Piwik websites already exist with this URL")

        # if not site_already_exists:
        #     # create a Piwik website
        #     site_created = True # TODO: piwik_SitesManager_addSite (siteName, urls, ecommerce = '', siteSearch = '', searchKeywordParameters = '', searchCategoryParameters = '', excludedIps = '', excludedQueryParameters = '', timezone = '', currency = '', group = '', startDate = '', excludedUserAgents = '', keepURLFragments = '', type = '', settings = '', excludeUnknownUrls = '')
        #     if site_created:
        #         site_id = None # TODO. Is it a result from piwik_SitesManager_addSite() or should we call piwik_SitesManager_getSitesIdFromSiteUrl() again?
        #     else:
        #         return Response(
        #             status=503,
        #             body="could not create Piwik site")
        # if site_id:
        #     # give "view" permission to Piwik user on Piwik site
        #     permission_given = True # TODO: UsersManager.setUserAccess (userLogin, access, idSites)
        #     if not permission_given:
        #         return Response(
        #             status=503,
        #             body="could not give view permission to Piwik user on Piwik site")
        #     # set discussion's piwik id_site property
        #     # discussion.piwik_id_site = site_id
        # ### end TODO ###

        res = {
            "user_already_exists": user_already_exists,
            "user_created": user_created
        }
        if user_created:
            res["user_password"] = user_password
        return res
    except requests.ConnectionError:
        return Response(
            status=503,
            body="call to Piwik returned an error")
    
def piwik_UsersManager_userExists(piwik_url, piwik_api_token, userLogin):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "UsersManager.userExists"
    params["userLogin"] = userLogin # piwik has two different fields for login and email, but a user can have the same value as login and email
    result = requests.get(piwik_url, params=params, timeout=15)
    if result.status_code != 200:
        raise requests.ConnectionError()

    content = result.json()
    if not content:
        raise requests.ConnectionError()

    user_already_exists = ("value" in content and content["value"] == "true")
    return user_already_exists

def piwik_UsersManager_addUser(piwik_url, piwik_api_token, userLogin, password, email, alias=''):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "UsersManager.addUser"
    params["userLogin"] = userLogin # piwik has two different fields for login and email, but a user can have the same value as login and email
    params["password"] = password
    params["email"] = email
    if ( alias ):
        params["alias"] = alias
    result = requests.get(piwik_url, params=params, timeout=15)
    if result.status_code != 200:
        raise requests.ConnectionError()

    content = result.json()
    if not content:
        raise requests.ConnectionError()

    user_added = ("result" in content and content["result"] == "success")
    return user_added

def string_generator(size=10, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))
