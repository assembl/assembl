from collections import defaultdict
from itertools import groupby, ifilter, chain

from jsonpath_ng.ext import parse

from .auth import IdentityProvider
from .social_auth import SocialAuthAccount


def validate_json_paths(path_dict):
    for k in path_dict.keys():
        parse(k)
    return path_dict


def load_social_columns_info(discussion, locale=None):
    info = discussion.preferences['extra_csv_data']
    assert isinstance(info, dict)
    columns = []
    locale = locale or discussion.main_locale
    try:
        for path, names in info.items():
            path = parse(path)
            name = names.get(locale, None) or next(names.itervalues())
            columns.append((name, path))
        columns.sort()
    except Exception:
        return []
    return columns


def get_social_columns_from_json(json_data, columns_info):
    result = [path.find(json_data) for (name, path) in columns_info]
    return [v[0].value.encode('utf-8') if v else '' for v in result]


def get_social_columns_from_json_list(json_data_list, columns_info):
    if len(json_data_list) == 0:
        return ("",) * len(columns_info)
    elif len(json_data_list) == 1:
        return get_social_columns_from_json(json_data_list[0], columns_info)
    columns = [get_social_columns_from_json(json_data, columns_info)
               for json_data in json_data_list]
    # take first non-empty element from each.
    return [next(chain(ifilter(None, x), ('',))) for x in zip(*columns)]


def get_social_columns_from_user(user, columns_info, provider_id=None):
    json_list = [(account.provider_id, account.extra_data)
                 for account in user.social_accounts]
    if provider_id:
        json_list = [data for (id, data) in json_list if id == provider_id]
    else:
        json_list.sort()  # arbitrary but deterministic order
        json_list = [data for (id, data) in json_list]
    return get_social_columns_from_json_list(json_list, columns_info)


def get_provider_id_for_discussion(discussion):
    profile_name = discussion.preferences['authorization_server_backend']
    if profile_name:
        profile_id = discussion.db.query(IdentityProvider.id).filter_by(provider_type=profile_name).first()
        if profile_id:
            return profile_id[0]


def get_social_columns_for_user_query(
        user_query, discussion, columns_info, locale=None, profile_name=0):
    if profile_name is 0:
        profile_name = discussion.preferences['authorization_server_backend']
    columns_info = columns_info or load_social_columns_info(discussion, locale)
    q = discussion.db.query(
        SocialAuthAccount.profile_id,
        SocialAuthAccount.extra_data,
        SocialAuthAccount.provider_id
    ).filter(
        SocialAuthAccount.profile_id.in_(user_query.subquery())
    ).order_by(
        SocialAuthAccount.profile_id,
        SocialAuthAccount.provider_id)
    if profile_name:
        q = q.join(IdentityProvider).filter(
            IdentityProvider.provider_type == profile_name)
    results = defaultdict(lambda: ('',) * len(columns_info))
    for (profile_id, data) in groupby(q, lambda x: x[0]):
        results[profile_id] = get_social_columns_from_json_list(
            [d[1] for d in data], columns_info)
    return results
