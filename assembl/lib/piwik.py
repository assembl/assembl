import requests
from pyramid.settings import asbool

def piwik_UsersManager_userExists(piwik_url, piwik_api_token, userLogin):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "UsersManager.userExists"
    params["userLogin"] = userLogin # Piwik has two different fields for login and email, but a user can have the same value as login and email
    result = requests.get(piwik_url, params=params, timeout=15)
    if result.status_code != 200:
        raise Exception("Matomo request status code returned is different from 200")

    content = result.json()
    if not content:
        raise Exception("Matomo request has empty json body.")

    user_already_exists = asbool(content.get("value", False))
    return user_already_exists

def piwik_UsersManager_getUserByEmail(piwik_url, piwik_api_token, userEmail):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "UsersManager.getUserByEmail"
    params["userEmail"] = userEmail # Piwik has two different fields for login and email, but a user can have the same value as login and email
    result = requests.get(piwik_url, params=params, timeout=15)
    if result.status_code != 200:
        raise Exception("Matomo request status code returned is different from 200")

    content = result.json() # returns something like [{"login":"aaa","email":"aaa@aaa.com"}] or {"result":"error","message":"L'utilisateur 'aaa@aaa.com' est inexistant."}
    if not content:
        raise Exception("Matomo request has empty json body.")

    if "result" in content and content["result"] == "error":
        return False
    elif not isinstance(content, list):
        raise Exception("Matomo request json body is not a list")
    else:
        return content


def piwik_UsersManager_addUser(piwik_url, piwik_api_token, userLogin, password, email, alias=''):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "UsersManager.addUser"
    params["userLogin"] = userLogin # Piwik has two different fields for login and email, but a user can have the same value as login and email
    params["password"] = password
    params["email"] = email
    if alias:
        params["alias"] = alias
    result = requests.get(piwik_url, params=params, timeout=15)
    if result.status_code != 200:
        raise Exception("Matomo request status code returned is different from 200")

    content = result.json()
    if not content:
        raise Exception("Matomo request has empty json body.")

    user_added = ("result" in content and content["result"] == "success")
    return user_added


def piwik_SitesManager_getSitesIdFromSiteUrl(piwik_url, piwik_api_token, url):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "SitesManager.getSitesIdFromSiteUrl"
    params["url"] = url
    result = requests.get(piwik_url, params=params, timeout=15)

    if result.status_code != 200:
        raise Exception("Matomo request status code returned is different from 200")
    content = result.json() # Content should be either an empty array, or an array like [{"idsite":"44"}]
    if not isinstance(content, list):
        raise Exception("Matomo request json body is not a list")

    return content


def piwik_SitesManager_addSite(piwik_url, piwik_api_token, siteName, urls, ecommerce = 1, siteSearch = False, searchKeywordParameters = '', searchCategoryParameters = '', excludedIps = '', excludedQueryParameters = '', timezone = '', currency = '', group = '', startDate = '', excludedUserAgents = '', keepURLFragments = '', param_type = '', settings = '', excludeUnknownUrls = ''):
    """Returns the Piwik id_site of the created website
    Warning: A new Piwik site is created everytime this method is called, even if another Piwik website already exists with the same name and URLs"""
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "SitesManager.addSite"
    params["siteName"] = siteName
    params["urls"] = urls
    if ecommerce:
        params["ecommerce"] = ecommerce
    if siteSearch:
        params["siteSearch"] = siteSearch
    if searchKeywordParameters:
        params["searchKeywordParameters"] = searchKeywordParameters
    if searchCategoryParameters:
        params["searchCategoryParameters"] = searchCategoryParameters
    if excludedIps:
        params["excludedIps"] = excludedIps
    if excludedQueryParameters:
        params["excludedQueryParameters"] = excludedQueryParameters
    if timezone:
        params["timezone"] = timezone
    if currency:
        params["currency"] = currency
    if group:
        params["group"] = group
    if startDate:
        params["startDate"] = startDate
    if excludedUserAgents:
        params["excludedUserAgents"] = excludedUserAgents
    if keepURLFragments:
        params["keepURLFragments"] = keepURLFragments
    if param_type:
        params["type"] = param_type
    if settings:
        params["settings"] = settings
    if excludeUnknownUrls:
        params["excludeUnknownUrls"] = excludeUnknownUrls

    result = requests.get(piwik_url, params=params, timeout=15)

    if result.status_code != 200:
        raise Exception("Matomo request status code returned is different from 200")

    content = result.json() # Content should be something like {"value": 47}

    if not content:
        raise Exception("Matomo request has empty json body.")

    return content.get('value', False)


def piwik_UsersManager_setUserAccess(piwik_url, piwik_api_token, userLogin, access, idSites):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "UsersManager.setUserAccess"
    params["userLogin"] = userLogin
    params["access"] = access
    params["idSites"] = idSites
    result = requests.get(piwik_url, params=params, timeout=15)

    if result.status_code != 200:
        raise Exception("Matomo request status code returned is different from 200")
    content = result.json() # Content should be either an empty array, or an array like [{"idsite":"44"}]

    if not content:
        raise Exception("Matomo request has empty json body.")

    user_access_is_set = content.get("result", "error") == "success"
    return user_access_is_set


def piwik_UsersManager_hasSuperUserAccess(piwik_url, piwik_api_token, userLogin):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "UsersManager.hasSuperUserAccess"
    params["userLogin"] = userLogin

    result = requests.get(piwik_url, params=params, timeout=15)

    if result.status_code != 200:
        raise Exception("Matomo request status code returned is different from 200")
    content = result.json() # Content should be like {"value": true}

    if not content:
        raise Exception("Matomo request has empty json body.")

    return asbool(content.get("value", False))


def piwik_VisitsSummary_getSumVisitsLength(piwik_url, piwik_api_token, idSite, period, date):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "VisitsSummary.getSumVisitsLength"
    params["idSite"] = idSite
    params["period"] = period
    params["date"] = date

    result = requests.get(piwik_url, params=params, timeout=15)

    if result.status_code != 200:
        raise Exception("Matomo request status code returned is different from 200")
    content = result.json() # content should be like {"value": 15}

    if not content:
        raise Exception("Matomo request has empty json body.")

    if "result" in content and content["result"] == "error":
        raise Exception("Matomo responded with an error")

    if not "value" in content:
        raise Exception("Matomo request json body doesn't have a value key")
    return content['value']


def piwik_Actions_get(piwik_url, piwik_api_token, idSite, period, date):
    params = {
        "module": "API",
        "format": "JSON",
        "token_auth": piwik_api_token
    }
    params["method"] = "Actions.get"
    params["idSite"] = idSite
    params["period"] = period
    params["date"] = date

    result = requests.get(piwik_url, params=params, timeout=15)

    if result.status_code != 200:
        raise Exception("Matomo request status code returned is different from 200")
    content = result.json() # content should be like {"nb_pageviews": 15, "nb_uniq_pageviews": 10} and other fields

    if not content:
        raise Exception("Matomo request has empty json body.")

    if not "nb_pageviews" in content:
        raise Exception("Matomo request json body doesn't have a nb_pageviews key")

    return content
