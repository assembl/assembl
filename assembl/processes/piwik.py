
import string
import random

import requests
from zope import interface

from assembl.lib import config
from assembl.lib.discussion_creation import IDiscussionCreationCallback
from assembl.lib.piwik import (
    piwik_UsersManager_userExists,
    piwik_UsersManager_getUserByEmail,
    piwik_UsersManager_addUser,
    piwik_SitesManager_getSitesIdFromSiteUrl,
    piwik_SitesManager_addSite,
    piwik_UsersManager_setUserAccess,
    piwik_UsersManager_hasSuperUserAccess
)


class AutomaticPiwikBindingAtDiscussionCreation(object):
    """A :py:class:`IDiscussionCreationCallback` that creates a Piwik site and user at discussion creation"""
    interface.implements(IDiscussionCreationCallback)

    def discussionCreated(self, discussion):
        bind_piwik(discussion)


def bind_piwik(discussion, admin=None):
    admin = admin or discussion.creator
    assert admin, "There should be a discussion admin provided"

    user_email = admin.get_preferred_email()
    assert user_email, "the admin should have an email"
    piwik_url = config.get('web_analytics_piwik_url')
    piwik_api_token = config.get('web_analytics_piwik_api_token')

    missing_variables = []
    if not user_email:
        missing_variables.append("user_email")
    if not piwik_url:
        missing_variables.append("piwik_url")
    if not piwik_api_token:
        missing_variables.append("piwik_api_token")
    if len(missing_variables):
        raise RuntimeError("missing configuration variables: " + ", ".join(missing_variables))

    # TODO: Should this process first check that discussion.web_analytics_piwik_id_site is empty and do something different if it's not? (for example: return an error, so that we empeach discussion statistics to be scattered on different Piwik sites, which is difficult to merge)

    try:
        # Check wether a Piwik user with a `user_email` email exists
        try:
            user_already_exists = piwik_UsersManager_getUserByEmail(piwik_url, piwik_api_token, user_email)
        except requests.ConnectionError:
            raise RuntimeError("call to Piwik returned an error (piwik_UsersManager_getUserByEmail)")

        user_created = False
        user_password = ""
        user_login = user_email

        if not user_already_exists:
            # Create a Piwik user with `user_email` as login and as email
            user_password = string_generator(size=10)
            user_created = piwik_UsersManager_addUser(piwik_url, piwik_api_token, user_email, user_password, user_email)
            if not user_created:
                # Try to find if creation failed because of rare/edge case of a Piwik user already existing with the user_email as login but not as email
                print("##### user not created, trying to find why")
                user_with_email_as_login_exists = piwik_UsersManager_userExists(piwik_url, piwik_api_token, user_email)
                if user_with_email_as_login_exists:
                    # We will use this strange Piwik user
                    user_login = user_email
                    print("##### we are in the rare case of a Piwik user already existing with the user_email as login but not as email")
                else:
                    raise requests.ConnectionError()
        else:
            user_login = user_already_exists[0]["login"]

        # Check wether a Piwik site with this URL already exists
        discussion_urls = discussion.get_discussion_urls()
        site_url = discussion_urls[0]
        sites_ids_with_this_url = piwik_SitesManager_getSitesIdFromSiteUrl(piwik_url, piwik_api_token, site_url)
        site_id = None

        site_already_exists = len(sites_ids_with_this_url) > 0

        if len(sites_ids_with_this_url) == 1:
            site_id = sites_ids_with_this_url[0]["idsite"]
        elif len(sites_ids_with_this_url) == 0:
            pass # OK. No Piwik site exist yet with this URL, so we will create it.
        else:
            # Here, instead of returning an error, we could just use the first site returned. But we would have to make sure that there is no tracking problems afterwards. Having several id_site pointing to the same URLs is not a good situation I guess.
            raise RuntimeError("Several Piwik websites already exist with this URL. There should be only 0 or 1. Please log into Piwik as Super User and remove duplicate sites.")

        if not site_already_exists:
            # create a Piwik website
            site_name = discussion.slug
            # TODO: Some parameters here should probably be variables received from somewhere, because they could be different from one Assembl instance to another, or from one discussion to another, like timezone for example
            addsite_result = piwik_SitesManager_addSite(piwik_url, piwik_api_token, site_name, discussion_urls, timezone="Europe/Paris", currency="EUR")
            if addsite_result is not False and isinstance(addsite_result, int):
                site_id = addsite_result
            else:
                raise RuntimeError("could not create Piwik site")

        if site_id:
            # Give "view" permission to Piwik user on Piwik site
            permission_given = piwik_UsersManager_setUserAccess(piwik_url, piwik_api_token, user_login, "view", [site_id])
            if not permission_given:
                # Handle corner case of Piwik response being {"result":"error","message":"This user has Super User access and has already permission to access and modify all websites in Piwik. You may remove the Super User access from this user and try again."}
                user_has_super_user_access = piwik_UsersManager_hasSuperUserAccess(piwik_url, piwik_api_token, user_login)
                if user_has_super_user_access:
                    permission_given = True
                    print("##### This Piwik user exists and is Super User, so he has access to any Piwik site")
                else:
                    raise RuntimeError("Could not give view permission to Piwik user on Piwik site (and user does not seem to have Super User access)")
            # Set discussion's piwik id_site property
            discussion.web_analytics_piwik_id_site = site_id

        res = {
            "user_already_exists": user_already_exists,
            "user_created": user_created,
            "site_already_exists": site_already_exists,
            "result": "success"
        }
        if user_created:
            res["user_password"] = user_password
        if site_id:
            res["site_id"] = site_id
        return res
    except requests.ConnectionError as e:
        raise RuntimeError("call to Piwik returned an error")


def string_generator(size=10, chars=string.ascii_uppercase + string.ascii_lowercase + string.digits):
    return ''.join(random.choice(chars) for _ in range(size))
