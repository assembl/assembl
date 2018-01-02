"""Utilities for extracting posts and comments from Facebook, using the facebook API."""
from abc import abstractmethod
from collections import defaultdict
from datetime import datetime, timedelta
from urlparse import urlparse, parse_qs
import logging

import facebook
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    DateTime,
    Binary
)
import simplejson as json
# from dateutil.parser import parse as parse_datetime
from sqlalchemy.orm import (
    relationship,
    backref,
    deferred,
    undefer)
from .auth import IdentityProvider
from .social_auth import SocialAuthAccount

from ..auth import (CrudPermissions, P_EXPORT_EXTERNAL_SOURCE, P_SYSADMIN)
from ..lib.config import get_config
from ..lib.sqla import Base
from ..lib.sqla_types import URLString
from ..lib.parsedatetime import parse_datetime
from ..tasks.source_reader import PullSourceReader, ReaderStatus
from .langstrings import LangString
from .generic import PostSource, ContentSourceIDs
from .post import ImportedPost
from .attachment import Document, PostAttachment


log = logging.getLogger('assembl')

API_VERSION_USED = 2.2
DEFAULT_TIMEOUT = 30  # seconds
DOMAIN = 'facebook.com'


facebook_sdk_locales = defaultdict(set)

FacebookPostTypes = {
    'photo': 'photo',
    'album': 'album',
    'video': 'video',
    'status': 'status'
}


def fetch_facebook_sdk_locales():
    import requests as r
    from lxml import etree
    global facebook_sdk_locales
    xml_path = 'https://www.facebook.com/translations/FacebookLocales.xml'
    req = r.get(xml_path)
    if not req.ok:
        return
    xml = req.content
    root = etree.fromstring(xml)
    locales = root.xpath('//representation/text()')
    for locale in locales:
        lang, country = locale.split('_')
        facebook_sdk_locales[lang].add(country)


def run_setup():
    from requests.exceptions import ConnectionError
    if not facebook_sdk_locales.keys():
        try:
            fetch_facebook_sdk_locales()
        except ConnectionError:
            facebook_sdk_locales['en'].add('CA')


def language_sdk_existance(lang, default_locale_dict):
    def _check_fb_locale(lang, country=None):
        if not country:
            return lang in facebook_sdk_locales
        if lang in facebook_sdk_locales:
            countries = facebook_sdk_locales[lang]
            if country in countries:
                return True
        return False

    def _get_rand_country(lang, source):
        return random.sample(source[lang], 1)[0]

    # for example: default_locale_dict is a {'fr': set(['CA', 'FR'])}
    from ..lib.locale import use_underscore, get_country, get_language
    import random
    run_setup()
    lang = use_underscore(lang)
    country = None
    if '_' in lang:
        lang, country = get_language(lang), get_country(lang)
    if lang == 'ar':
        return True, 'ar_AR'
    elif lang == 'de':
        return True, 'de_DE'
    elif lang == 'es':
        if country and (country == 'ES' or country == 'CO'):
            return True, lang + '_' + country
        return True, 'es_LA'
    elif lang in facebook_sdk_locales:
        if not country:
            if lang == 'en':
                return True, 'en_US'

            if lang in default_locale_dict:
                tmp_country = _get_rand_country(lang, default_locale_dict)
                if tmp_country and _check_fb_locale(lang, tmp_country):
                    return True, lang + '_' + tmp_country

            # language exists, but no country
            rand_country = _get_rand_country(lang, facebook_sdk_locales)
            if rand_country:
                return True, lang + '_' + rand_country
            else:
                return True, lang

        fb_countries = facebook_sdk_locales[lang]
        if country in fb_countries:
            return True, lang + '_' + country
        if lang == 'en':
            return True, lang + '_US'
        else:
            rand_country = _get_rand_country(lang, facebook_sdk_locales)
            if rand_country:
                return True, lang + '_' + rand_country
            else:
                return True, lang

    # If all else fails, drop down to US English
    else:
        return False, 'en_US'


class FacebookAPI(object):
    """Proxy object to the unofficial facebook sdk"""

    def __init__(self, user_token=None):
        config = get_config()
        self._app_id = config.get('facebook.consumer_key')
        self._app_secret = config.get('facebook.consumer_secret')
        self._app_access_token = config.get('facebook.app_access_token')
        token = self._app_access_token if not user_token else user_token
        version = config.get('facebook.api_version', None) or API_VERSION_USED
        self._api = facebook.GraphAPI(token, DEFAULT_TIMEOUT, version)

    def api_caller(self):
        return self._api

    @property
    def app_id(self):
        return self._app_id

    @property
    def app_secret(self):
        return self._app_secret

    @property
    def app_access_token(self):
        return self._app_access_token

    def update_token(self, token):
        self._api.access_token(token, self._app_secret)

    def extend_token(self):
        res = self._api.extend_access_token(self._app_id, self._app_secret)
        return res.get('access_token', None), res.get('expires', None)

    def get_expiration_time(self, token):
        args = {
            'input_token': token,
            'access_token': self._app_access_token
        }
        try:
            tmp = self._api.request('debug_token', args)
            data = tmp.json.get('data')
            if not data:
                return None
            expires = data.get('expires_at', None)
            if not expires:
                return None
            return datetime.fromtimestamp(int(expires))

        except:
            return None


class FacebookParser(object):
    """The main object to interact with to get source endpoints
    The API proxy is injected no construction to have flexibility as
    to which API sdk to use"""

    def __init__(self, api):
        self.fb_api = api
        self.api = api.api_caller()
        self.user_flush_state = None

    # ============================GETTERS=================================== #

    # ----------------------------- feeds -------------------------------------
    def get_feed(self, object_id, **args):
        resp = self.api.get_connections(object_id, 'feed', **args)
        if 'error' in resp:
            log.warning('Getting facebook feed %s with args %s yielded \
                        an error: %s',
                        object_id, json.dumps(args), json.dumps(resp))
            return [], None
        return resp.get('data', []), resp.get('paging', {}).get('next', None)

    def _get_next_feed(self, object_id, page):
        # This is completely non-generic and ONLY works for groups and posts
        next_page = page
        while True:
            if not next_page:
                break
            qs = self._get_query_from_url(next_page)
            args = {
                'limit': qs['limit'][0],  # The default limit is 25
                'until': qs['until'][0],
                '__paging_token': qs['__paging_token'][0]
            }
            wall, page = self.get_feed(object_id, **args)
            next_page = page
            if not wall:
                break
            yield wall

    def get_feed_paginated(self, object_id):
        wall, page = self.get_feed(object_id)
        for post in wall:
            yield post
        if page:
            for wall_posts in self._get_next_feed(object_id, page):
                for post in iter(wall_posts):
                    yield post

    # ----------------------------- comments ----------------------------------
    def get_comments(self, object_id, **args):
        resp = self.api.get_connections(object_id, 'comments', **args)
        if resp and 'error' in resp:
            log.warning("Getting facebook comment %s with args %s yielded \
                        an error: %s",
                        object_id, json.dumps(args), json.dumps(resp))
            return [], None
        return resp.get('data', []), resp.get('paging', {}).get('next', None)

    def _get_next_comments(self, object_id, page):
        next_page = page
        while True:
            if not next_page:
                break
            qs = self._get_query_from_url(next_page)
            args = {
                'limit': qs['limit'][0],
                'after': qs['after'][0]
            }
            comments, page = self.get_comments(object_id, **args)
            next_page = page
            if not comments:
                break
            yield comments

    def get_comments_paginated(self, post):
        # A generator object
        if 'comments' not in post:
            return
        comments = post.get('comments')
        comments_data = comments.get('data')
        next_page = comments.get('paging', {}).get('next', None)
        for comment in comments_data:
            yield comment
        for comments in self._get_next_comments(post.get('id'), next_page):
            for comment in comments:
                yield comment

    def get_comments_on_comment_paginated(self, parent_comment):
        comments, next_page = self.get_comments(parent_comment.get('id'))
        for comment in comments:
            yield comment
        for comments in self._get_next_comments(parent_comment.get('id'), next_page):
            for comment in comments:
                yield comment

    # ----------------------------- posts -------------------------------------
    def get_single_post(self, object_id, **kwargs):
        resp = self.api.get_object(object_id, **kwargs)
        if 'error' in resp:
            log.warning("There was an error with fetching the single post " +
                        object_id + ", with error: " + json.dumps(resp))
        return None if 'error' in resp else resp

    def get_posts(self, object_id, **kwargs):
        resp = self.api.get_connections(object_id, 'posts', **kwargs)
        if resp and 'error' in resp:
            log.warning("Getting facebook posts from source %s with args %s \
                        yielded the error: %s",
                        object_id, json.dumps(kwargs), json.dumps(resp))
        return resp.get('data', []), resp.get('paging', {}).get('next', None)

    def _get_next_posts_page(self, object_id, page):
        next_page = page
        while True:
            if not next_page:
                break
            qs = self._get_query_from_url(next_page)
            args = {
                'limit': qs['limit'][0]
            }
            if 'after' in next_page:
                args['after'] = qs['after'][0]
            if 'until' in next_page:
                args['until'] = qs['until'][0]
            posts, page = self.get_posts(object_id, **args)
            next_page = page
            if not posts:
                break
            yield posts

    def get_posts_paginated(self, object_id):
        wall, page = self.get_posts(object_id)
        for post in wall:
            yield post
        if page:
            for page_post in self._get_next_posts_page(object_id, page):
                for post in page_post:
                    yield post
    # -------------------------------------------------------------------------

    def get_app_id(self):
        return self.fb_api.app_id

    def get_object_info(self, object_id):
        return self.api.get_object(object_id)

    # Define endpoint choice, 'feed', 'posts', etc
    def get_wall(self, object_id, **kwargs):
        if 'wall' in kwargs:
            endpoint = kwargs.pop('wall')
            resp = self.api.get_connections(object_id, endpoint, **kwargs)
            return resp.get('data', []), \
                resp.get('paging', {}).get('next', None)

    def _get_query_from_url(self, page):
        parse = urlparse(page)
        qs = parse_qs(parse.query)
        return qs

    def get_user_post_creator(self, post):
        # Return {'id': ..., 'name': ...}
        return post.get('from')

    def get_users_post_to(self, post):
        # Returns [{'id':...,'name':...}, {...}]
        # Clearly also includes the source_id as well
        return post.get('to', {}).get('data', [])

    def get_users_post_to_sans_self(self, post, self_id):
        # self_id is the group/page id that user has posted to
        users = self.get_users_post_to(post)
        return [x for x in users if x['id'] != self_id]

    def get_user_from_comment(self, comment):
        return comment.get('from')

    def _get_tagged_entities(self, source, entity_type):
        if 'message_tags' in source:
            # Messaage_tags can either be directly linked, or they can be
            # ordinal keys (dict of dict)
            # Check if no ordinality exists:
            if 'id' in source['message_tags'][0]:
                return [x for x in source['message_tags']
                        if x['type'] == entity_type]
            else:
                ordinal_dict = source['message_tags']
                return [y for y in ordinal_dict.itervalues()
                        if y['type'] == entity_type]
        else:
            return []

    def get_users_from_mention(self, comment):
        return self._get_tagged_entities(comment, 'user')

    def get_pages_from_mention(self, post):
        return self._get_tagged_entities(post, 'page')

    def get_user_object_creator(self, obj):
        # Great for adding the group/page/event creator to list of users
        return obj.get('owner', None)

    def get_user_profile_photo(self, user):
        # Will make another API call to fetch the user's public profile
        # picture, if present. If not, will return nothing.
        kwargs = {'redirect': 'false'}
        user_id = user.get('id')
        result = self.api.get_connections(user_id, 'picture', **kwargs)
        if not result.get('data', None):
            return None
        profile_info = result.get('data')
        if not profile_info.get('is_silhouette', False):
            return profile_info.get('url')
        return None

    # ----------------------------- attachments  ------------------------------

    def get_post_attachments(self, post_id):
        """
        Currently (10/15/2015) there is only 1 attachment allowed
        per facebook post. Therefore, pass the first available one
        """
        resp = self.api.get_connections(post_id, "attachments")
        data = resp.get('data', None)
        if data:
            return data[0]
        return None

    def get_comment_attachments(self, comment_id):
        "Will return an object dict"
        kwarg = {'fields': 'attachment'}
        resp = self.api.get_object(comment_id, **kwarg)
        return resp.get('attachment', None)

    def parse_attachment_url(self, url):
        try:
            qs = parse_qs(urlparse(url).query)
            return qs['u'][0]  # Will raise error if not present
        except:
            # In the case of url == None or
            # url coming from an emoticon, simply return
            # the url
            return url

    def parse_attachment(self, attachment):
        """Returns attachment in the format:

        {
            'url': x,
            'title': y,
            'description': z
        }
        """
        if not attachment:
            # Post has no attachment
            return None

        attach_type = attachment.get('type')
        if attach_type == 'photo' or attach_type == 'video':
            # Just return the full post address
            return {
                'url': attachment.get('url', None),
                'title': attachment.get('title', None),
                'description': attachment.get('description', None)
            }
        else:
            return {
                'url': self.parse_attachment_url(attachment.get('url', None)),
                'title': attachment.get('title', None),
                'description': attachment.get('description', None)
            }

    # ============================SETTERS=================================== #

    def _populate_attachment(self, content):
        args = {}
        if content.has_body():
            args['message'] = content.get_body()
        if content.has_attachment():
            args['link'] = content.get_attachment()
            if content.attachment_extras():
                args.update(content.get_attachment_extras())
        return args

    def push_profile_post(self, user, content):
        args = self._populate_attachment(content)
        user_id = user.id
        resp = self.api.put_object(user_id, 'feed', **args)
        return resp.get('id', None)

    def push_group_post(self, group_id, content):
        pass

    def push_page_post(self, content):
        pass


class FacebookGenericSource(PostSource):
    """
    A generic source
    """
    __tablename__ = 'facebook_source'

    id = Column(Integer, ForeignKey(
                'post_source.id',
                ondelete='CASCADE',
                onupdate='CASCADE'), primary_key=True)

    fb_source_id = Column(String(512), nullable=False)
    url_path = Column(URLString)
    creator_id = Column(Integer, ForeignKey(SocialAuthAccount.id,
                                            onupdate='CASCADE', ondelete='CASCADE'))
    creator = relationship(SocialAuthAccount,
                           backref=backref('sources',
                                           cascade="all, delete-orphan"))

    upper_bound = Column(DateTime)
    lower_bound = Column(DateTime)

    __mapper_args__ = {
        'polymorphic_identity': 'facebook_source'
    }

    @abstractmethod
    def fetch_content(self, lower_bound=None, upper_bound=None):
        """ The entry point of creating posts

        :param DateTime lower_bound: Read posts up to this back in time
        :param DateTime uppder_bound: Read future posts up to this time
        """
        self._setup_reading()

    def generate_message_id(self, source_post_id):
        return "%s_fbpost@facebook.com" % (
            self.flatten_source_post_id(source_post_id, 7),)

    def make_reader(self):
        api = FacebookAPI()
        return FacebookReader(self.id, api)

    @classmethod
    def create_from(cls, discussion, fb_id, creator, url, some_name,
                    lower=None, upper=None):
        created_date = datetime.utcnow()
        last_import = created_date
        return cls(name=some_name, creation_date=created_date,
                   discussion=discussion, fb_source_id=fb_id,
                   url_path=url, last_import=last_import,
                   creator=creator, lower_bound=lower,
                   upper_bound=upper)

    @property
    def upper_bound_timezone_checked(self):
        return self.upper_bound

    @upper_bound_timezone_checked.setter
    def upper_bound_timezone_checked(self, value):
        if value:
            self.upper_bound = parse_datetime(value)

    @property
    def lower_bound_timezone_checked(self):
        return self.lower_bound

    @lower_bound_timezone_checked.setter
    def lower_bound_timezone_checked(self, value):
        if value:
            self.lower_bound = parse_datetime(value)

    def get_creator_uri(self):
        if self.creator:
            return self.creator.uri()
        return None

    def _get_facebook_provider(self):
        if not self.provider:
            fb = self.db.query(IdentityProvider).\
                filter_by(name='facebook').first()
            self.provider = fb

    def _get_current_users(self):
        result = self.db.query(SocialAuthAccount).\
            filter_by(provider_domain=DOMAIN).all()
        return {x.userid: x for x in result}

    def _get_current_posts(self, load_json=False):
        if load_json:
            results = self.db.query(FacebookPost).\
                options(undefer('imported_blob'),
                        undefer('attachment_blob')).\
                filter_by(source=self).all()
            return {x.source_post_id: x for x in results}

        results = self.db.query(FacebookPost).filter_by(
            source=self).all()
        return {x.source_post_id: x for x in results}

    def _get_current_documents(self):
        results = self.db.query(Document).\
            filter_by(discussion=self.discussion).all()
        return {x.uri_id: x for x in results}

    def _get_current_attachments(self):
        results = self.db.query(PostAttachment).\
            filter_by(discussion=self.discussion).all()
        return results

    def _create_fb_user(self, user, db):
        if user['id'] not in db:
            # avatar_url = self.parser.get_user_profile_photo(user)
            userid = user.get('id')
            new_user = SocialAuthAccount(
                profile=user,
                identity_provider=self.provider,
                full_name=user.get("name"),
                userid=userid,
                provider_domain=self.parser.get_app_id(),
                picture_url='http://graph.facebook.com/%s/picture' % (userid,)
            )
            self.db.add(new_user)
            self.db.flush()
            db[user['id']] = new_user

    def _create_or_update_fb_user(self, user, db):
        user_id = user['id']
        if user_id in db:
            account = db.get(user_id)
            account.update_fields(user)
        else:
            self._create_fb_user(user, db)

    def _create_post(self, post, user, db):
        # Utility method that creates the post and populates the local
        # cache.
        # Returns True if succesfull. False if post is not created.
        post_id = post.get('id')
        if post_id in db:
            return True
        new_post = FacebookPost.create(self, post, user)
        if not new_post:
            return False
        self.db.add(new_post)
        self.db.flush()
        db[post_id] = new_post
        return True

    def _url_exists(self, url, ls):
        "Internal function for attachment management"
        for l in ls:
            if l.document.uri_id == url:
                return True
        return False

    def _manage_attachment(self, post, getter):
        post_id = post.get('id', None)

        try:
            raw_attach = getter(post_id)
            attachment = self.parser.parse_attachment(raw_attach)
            return raw_attach, attachment

        except:
            return None, None

    def _create_attachments(self, post, assembl_post,
                            get_attachment=None, attachment_blob=None):
        # get_attachment callback. The API call to get an attachment for a
        # comment is different than a post for Facebook; Can be deferred only
        # when doing a re-process and not hitting network.
        #
        # For re-process, must pass along an attachment_blob instead

        _now = datetime.utcnow()
        if get_attachment and not attachment_blob:
            raw_attach, attachment = self._manage_attachment(post,
                                                             get_attachment)
        else:
            if attachment_blob:
                raw_attach = attachment_blob.get('data', None)
                attachment = self.parser.parse_attachment(raw_attach)
            else:
                raise ValueError("There is no callback or attachment_blob in order\
                                 create a Facebook attachment")

        try:
            if not raw_attach or attachment.get('url') == None:  # noqa: E711
                return

            old_attachments_on_post = assembl_post.attachments

            with self.db.no_autoflush:
                doc = Document(
                    uri_id=attachment.get('url'),
                    creation_date=_now,
                    discussion=self.discussion,
                    title=attachment.get('title'),
                    description=attachment.get('description'),
                    thumbnail_url=attachment.get('thumbnail', None)
                ).get_unique_from_db()

            from assembl.lib.frontend_urls import ATTACHMENT_PURPOSES
            if not self._url_exists(attachment.get('url'),
                                    old_attachments_on_post):
                post_attachment = PostAttachment(
                    post=assembl_post,
                    discussion=self.discussion,
                    title=attachment.get('title'),
                    description=attachment.get('description'),
                    document=doc,
                    creator=self.creator.user,
                    attachmentPurpose=ATTACHMENT_PURPOSES.get('EMBED_ATTACHMENT')
                )

            if raw_attach and not attachment_blob:
                # Ensure that this is only done for regular/reimport, NOT
                # for a re-process operation.

                # this is an array. Wrap it in a data field, like how
                # facebook returned to you.
                data = {u'data': raw_attach}
                assembl_post.attachment_blob = json.dumps(data)
            self.db.add(post_attachment)
            self.db.flush()

        except:
            log.warning("Failed to get post attachment information from \
                        assembl_post id %d, corresponding to facebook post \
                        from facebook: %s", assembl_post.id, json.dumps(post))

    def clear_post_attachments(self, assembl_post):
        attachs = assembl_post.attachments
        for attach in attachs:
            self.db.delete(attach)

    def _create_or_update_attachment(self, post, assembl_post, reimport,
                                     getter):
        if reimport:
            # This makes the underlying assumption that a facebook
            # post only has ONE attachment
            self.clear_post_attachments(assembl_post)
            self._create_attachments(post, assembl_post, getter)

        else:
            self._create_attachments(post, assembl_post, getter)

    def _manage_user(self, creator, users_db, reimport):
        if reimport:
            self._create_or_update_fb_user(creator, users_db)
        else:
            self._create_fb_user(creator, users_db)

    def _create_or_update_post(self, post, creator, posts_db, reimport):
        from ..tasks.translate import translate_content
        post_id = post.get('id')
        assembl_post = posts_db.get(post_id, None)
        if assembl_post:
            if reimport:
                assembl_post.update_fields(post, creator)
                # An update was made
        else:
            assembl_post = self._create_post(post, creator, posts_db)
        # Note: I wish this machinery had been put in the SourceReader,
        # instead of in the Source... I could then call
        # SourceReader.handle_new_content() instead of copying it.
        translate_content(assembl_post)  # should delay
        return assembl_post

    def _manage_post(self, post, obj_id, posts_db, users_db,
                     upper, lower, reimport=False):
        """ Method that parses the json parsed facebook post and delegates
        the creation of an Assembl post

        :param post - The json parsed post data
        :param obj_id - The facebook ID of the creator of the content
        :param posts_db - The cache of all posts currently imported from
                            this source
        :param users_db - The cache of all SocialAuthAccounts in the database
        :param upper - DateTime object describing up to which datetime
                        new messages are accepted.
        :param lower - DateTime object describing up to which datetime
                        old messages are accepted.
        :param reimport - Boolean to describe if current action is to reimport

        """
        cont = True
        post_created_time = parse_datetime(post.get('created_time'))
        if not upper:
            upper = self.upper_bound
        if not lower:
            lower = self.lower_bound
        if upper:
            if post_created_time > upper:
                cont = False
        if lower:
            if post_created_time < lower:
                cont = False

        if cont:
            post_id = post.get('id')
            creator = self.parser.get_user_post_creator(post)
            self._manage_user(creator, users_db, reimport)

            # Get all of the tagged users instead?
            for user in self.parser.get_users_post_to_sans_self(post, obj_id):
                self._manage_user(user, users_db, reimport)

            creator_id = creator.get('id', None)
            creator_agent = users_db.get(creator_id)
            result = self._create_or_update_post(post, creator_agent,
                                                 posts_db, reimport)

            if not result:
                return

            assembl_post = posts_db.get(post_id)
            self._create_or_update_attachment(post, assembl_post, reimport,
                                              self.parser.get_post_attachments)
            # self._create_attachments(post, assembl_post, reimport,
            #                          self.parser.get_post_attachments)
            self.db.commit()
            # Refresh the instance
            self.db.query(self.__class__).populate_existing().get(self.id)
            return assembl_post, cont

        else:
            return None, cont

    def _manage_comment(self, comment, parent_post, posts_db, users_db,
                        reimport=False):
        user = self.parser.get_user_from_comment(comment)
        user_id = user.get('id')
        comment_id = comment.get('id')
        self._manage_user(user, users_db, reimport)
        # self._create_fb_user(user, users_db)
        for usr in self.parser.get_users_from_mention(comment):
            # self._create_fb_user(usr, users_db)
            self._manage_user(user, users_db, reimport)
        self.db.commit()
        # Refresh the instance
        self.db.query(self.__class__).populate_existing().get(self.id)
        self.db.query(parent_post.__class__).populate_existing(
            ).get(parent_post.id)

        cmt_creator_agent = users_db.get(user_id)
        # cmt_result = self._create_post(comment, cmt_creator_agent, posts_db)
        cmt_result = self._create_or_update_post(comment, cmt_creator_agent,
                                                 posts_db, reimport)

        if not cmt_result:
            return

        self.db.flush()
        comment_post = posts_db.get(comment_id)
        comment_post.set_parent(parent_post)
        # self._create_attachments(comment, comment_post,
        #                          self.parser.get_comment_attachments)
        self._create_or_update_attachment(comment, comment_post, reimport,
                                          self.parser.get_comment_attachments)
        self.db.commit()
        # Refresh the instance
        self.db.query(self.__class__).populate_existing().get(self.id)
        return comment_post

    def _manage_comment_subcomments(self, comment, parent_post,
                                    posts_db, users_db,
                                    sub_comments=False,
                                    reimport=False):
        comment_post = self._manage_comment(comment, parent_post,
                                            posts_db, users_db, reimport)
        if comment_post and sub_comments:
            for cmt in self.parser.get_comments_on_comment_paginated(comment):
                self._manage_comment(cmt, comment_post, posts_db, users_db,
                                     reimport=reimport)
                if self.read_status == ReaderStatus.SHUTDOWN:
                    break

    def feed(self, upper_bound=None, lower_bound=None, reimport=False):
        users_db = self._get_current_users()
        posts_db = self._get_current_posts()

        object_info = self.parser.get_object_info(self.fb_source_id)

        self._manage_user(
            self.parser.get_user_object_creator(object_info),
            users_db,
            reimport
        )

        for post in self.parser.get_feed_paginated(self.fb_source_id):
            assembl_post, cont = self._manage_post(post, self.fb_source_id,
                                                   posts_db, users_db,
                                                   upper_bound,
                                                   lower_bound,
                                                   reimport=reimport
                                                   )

            if not assembl_post:
                # If a bound is reached, there is no post created, so do
                # not continue any further
                if not cont:
                    break
                continue

            if self.read_status == ReaderStatus.SHUTDOWN:
                break
            for comment in self.parser.get_comments_paginated(post):
                self._manage_comment_subcomments(comment, assembl_post,
                                                 posts_db, users_db,
                                                 reimport=reimport,
                                                 sub_comments=True)
                if self.read_status == ReaderStatus.SHUTDOWN:
                    return

    def posts(self, upper=None, lower=None, reimport=False):
        users_db = self._get_current_users()
        posts_db = self._get_current_posts()

        for post in self.parser.get_posts_paginated(self.fb_source_id):
            assembl_post, cont = self._manage_post(post, self.fb_source_id,
                                                   posts_db, users_db,
                                                   upper, lower,
                                                   reimport=reimport)
            if not assembl_post:
                # If a bound is reached, there is no post created, so do
                # not continue any further
                if not cont:
                    break
                continue

            if self.read_status == ReaderStatus.SHUTDOWN:
                break
            for comment in self.parser.get_comments_paginated(post):
                self._manage_comment_subcomments(comment, assembl_post,
                                                 posts_db, users_db,
                                                 reimport=reimport,
                                                 sub_comments=True)
                if self.read_status == ReaderStatus.SHUTDOWN:
                    return

    def single_post(self, upper_bound=None, lower_bound=None,
                    reimport=False):
        # Only use if the content source is a single post
        users_db = self._get_current_users()
        posts_db = self._get_current_posts()

        # Get the post, then iterate through the comments of the post
        post = self.parser.get_single_post(self.fb_source_id)

        if not post:
            # Post was deleted, or some other error occured
            return

        entity_id = post.get('from', {}).get('id', None)
        assembl_post, cont = self._manage_post(post, entity_id,
                                               posts_db, users_db,
                                               upper_bound, lower_bound,
                                               reimport=reimport)

        if not cont:
            # If a bound has been reached, do not continue parsing the
            # comments
            return

        if assembl_post:
            for comment in self.parser.get_comments_paginated(post):
                self._manage_comment_subcomments(comment, assembl_post,
                                                 posts_db, users_db,
                                                 reimport=reimport,
                                                 sub_comments=True)
                if self.read_status == ReaderStatus.SHUTDOWN:
                    return

    def single_post_comments_only(self, parent_post, reimport=False):
        users_db = self._get_current_users()
        posts_db = self._get_current_posts()

        post = self.parser.get_single_post(self.fb_source_id)

        # The root post will not be a FacebookPost, but all of the comments
        # will be.

        for comment in self.parser.get_comments_paginated(post):
            self._manage_comment_subcomments(comment, parent_post,
                                             posts_db, users_db,
                                             reimport=reimport,
                                             sub_comments=True)
            if self.read_status == ReaderStatus.SHUTDOWN:
                return

    def reprocess(self):
        "Update all posts/users from this source without hitting the network"
        self._setup_reading()
        users_db = self._get_current_users()
        posts_db = self._get_current_posts(load_json=True)

        for post in posts_db.itervalues():
            data = json.loads(post.imported_blob)
            user_data = data.get('from')
            user = users_db[user_data.get('id')]

            post.update_from_imported_json()
            post.update_attachment()
            user.update_fields(user_data)

        self.db.commit()
        # Refresh the instance
        self.db.query(self.__class__).populate_existing().get(self.id)

    def content_sink(self):
        # Could use the backref? @TODO: Ask MAP about this
        csId = self.db.query(ContentSourceIDs).\
            filter_by(source_id=self.id,
                      message_id_in_source=self.fb_source_id).first()

        return (csId is not None), csId

    def user_access_token(self):
        """
        Firstly, checks to ensure that a creator exists, otherwise, the
        db query might return awkward results.
        Then checks for user token existence and not-expired
        """
        if not self.creator:
            return None

        tokens = self.db.query(FacebookAccessToken).\
            filter_by(fb_account_id=self.creator_id,
                      token_type='user').all()

        tokens = [a for a in tokens if not a.is_expired()]

        if len(tokens) > 0:
            return tokens[0]
        return None

    def _setup_reading(self):
        self.provider = None
        self._get_facebook_provider()
        token = self.user_access_token()
        if token:
            api = FacebookAPI(token.token)
        else:
            api = FacebookAPI()
        self.parser = FacebookParser(api)


class FacebookGroupSource(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_open_group_source'
    }

    def fetch_content(self, lower_bound=None, upper_bound=None,
                      reimport=False):
        self._setup_reading()
        lower_bound = lower_bound or self.lower_bound
        upper_bound = upper_bound or self.upper_bound
        self.feed(lower_bound=lower_bound, upper_bound=upper_bound,
                  reimport=reimport)


class FacebookGroupSourceFromUser(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_private_group_source'
    }

    def fetch_content(self, lower_bound=None, upper_bound=None,
                      reimport=False):
        self._setup_reading()
        lower_bound = lower_bound or self.lower_bound
        upper_bound = upper_bound or self.upper_bound
        self.feed(lower_bound=lower_bound, upper_bound=upper_bound,
                  reimport=reimport)


class FacebookPagePostsSource(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_page_posts_source'
    }

    def fetch_content(self, lower_bound=None, upper_bound=None,
                      reimport=False):
        self._setup_reading()
        lower_bound = lower_bound or self.lower_bound
        upper_bound = upper_bound or self.upper_bound
        self.posts(lower_bound=lower_bound, upper_bound=upper_bound,
                   reimport=reimport)


class FacebookPageFeedSource(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_page_feed_source'
    }

    def fetch_content(self, lower_bound=None, upper_bound=None,
                      reimport=False):
        self._setup_reading()
        lower_bound = lower_bound or self.lower_bound
        upper_bound = upper_bound or self.upper_bound
        self.feed(lower_bound=lower_bound, upper_bound=upper_bound,
                  reimport=reimport)


class FacebookSinglePostSource(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_singlepost_source'
    }

    def fetch_content(self, lower_bound=None, upper_bound=None,
                      reimport=False):
        # Limit should not apply here, unless the limit is in reference to
        # number of comments brought in
        is_sink, cs = self.content_sink()
        if is_sink:
            parent_post = cs.post
            self._setup_reading()
            self.single_post_comments_only(parent_post, reimport=reimport)
        else:
            self._setup_reading()
            self.single_post(reimport=reimport)


class FacebookAccessToken(Base):
    __tablename__ = 'facebook_access_token'

    id = Column(Integer, primary_key=True)
    fb_account_id = Column(Integer, ForeignKey(SocialAuthAccount.id,
                                               onupdate='CASCADE', ondelete='CASCADE'),
                           index=True)

    fb_account = relationship(SocialAuthAccount,
                              backref=backref('access_tokens',
                                              cascade='all, delete-orphan'))

    token = Column(String(512), unique=True)
    expiration = Column(DateTime)  # can be null is access_token is infinite
    # ['page', 'group', 'user', 'app'...]
    token_type = Column(String(50))
    # Object_name: The name of the group/page
    object_name = Column(String(512))
    object_fb_id = Column(String(512))

    @property
    def infinite_token(self):
        if not self.expiration:
            return True
        return False

    @property
    def expires(self):
        return self.expiration

    @expires.setter
    def expires(self, value):
        if isinstance(value, datetime):
            self.expiration = value
        else:
            pass

    @property
    def long_lived_access_token(self):
        return self.token

    @long_lived_access_token.setter
    def long_lived_access_token(self, short_token):
        # Make an API call to get the long term token
        # Also will need to update the expiration
        # field as well.

        api = FacebookAPI(short_token)

        def debug_token(token):
            try:
                resp = api.request('debug_token', {'input_token': token,
                                                   'access_token': api._app_access_token})
                return resp.get('data', None)
            except:
                return token

        try:
            long_token, expires_in_seconds = api.extend_token()
            if not expires_in_seconds:
                # FB API sometimes does NOT pass in the expires_in
                # field. Do a debug check of the token. Apparently,
                # if the expires_at = 0 in debug mode, it must mean
                # that the access token is infinite long?
                log.warning("Extended Facebook access_token %s to %s, but there was\
                            no expires_in field in the returned token" %
                            short_token, long_token)
                data = debug_token(short_token)
                if data and isinstance(data, dict):
                    log.warning("The debug Facebook access token is: %s" %
                                json.dumps(data))
                    expires_at = data.get('expires_at', None)
                    if not expires_at:
                        raise TypeError('Debug token did not expires_at field')
                    if expires_at is 0 or u'0':
                        # This access_token is basically never
                        # ending (we believe)
                        log.warning("Facebook debug token returned expires_at of\
                                    0. It is likely forever long")
                        self.expiration = None
                elif isinstance(data, basestring):
                    # Cannot get the expiration time of the time at all
                    self.expiration = datetime.min
            else:
                self.expiration = datetime.utcnow() + \
                    timedelta(seconds=int(expires_in_seconds))
            self.token = long_token

        except Exception as e:
            # In case of failure, keep the value as the short_token
            # And do not mutate the passed in expiration time
            self.token = short_token
            log.exception(e)

    def get_facebook_account_uri(self):
        return self.fb_account.uri()

    def is_expired(self):
        """
        An access token is considered never-expiring when the expiration
        is None.
        """
        if not self.expiration:
            return False
        now = datetime.utcnow()
        return now > self.expiration

    def is_owner(self, user_id):
        return self.user.profile_id == user_id

    def get_token_expiration(self):
        # Makes external call. This is not async.
        api = FacebookAPI()
        return api.get_expiration_time(self.token)

    def convert_expiration_to_iso(self):
        # return the expiration date in ISO 8601 form
        return self.expiration.isoformat()

    @classmethod
    def restrict_to_owners(cls, query, user_id):
        "filter query according to object owners"
        return query.join(cls.user).\
            filter(SocialAuthAccount.profile_id == user_id)

    crud_permissions = CrudPermissions(P_EXPORT_EXTERNAL_SOURCE, P_SYSADMIN,
                                       read_owned=P_EXPORT_EXTERNAL_SOURCE)


class FacebookPost(ImportedPost):
    """
    A facebook post, from any resource on the Open Graph API
    """
    __tablename__ = 'facebook_post'

    id = Column(Integer, ForeignKey(
                'imported_post.id',
                onupdate='CASCADE',
                ondelete='CASCADE'), primary_key=True)

    attachment_blob = deferred(Column(Binary), group='raw attachment')
    # attachment = Column(String(1024))
    # link_name = Column(CoerceUnicode(1024))
    # post_type = Column(String(20))

    __mapper_args__ = {
        'polymorphic_identity': 'facebook_post'
    }

    @classmethod
    def create(cls, source, post, user):
        import_date = datetime.utcnow()
        source_post_id = post.get('id')
        creation_date = parse_datetime(post.get('created_time'))
        discussion = source.discussion
        creator_agent = user.profile
        blob = json.dumps(post)
        body = post.get('message')
        subject = post.get('story', None)
        # TODO AY: Can we get the post language from facebook?

        return cls(
            # attachment=attachment,
            # link_name=link_name,
            body_mime_type='text/plain',
            import_date=import_date,
            source_post_id=source_post_id,
            source=source,
            creation_date=creation_date,
            discussion=discussion,
            creator=creator_agent,
            # post_type=post_type,
            imported_blob=blob,
            subject=LangString.create(subject),
            body=LangString.create(body)
        )

    def update_from_imported_json(self):
        data = json.loads(self.imported_blob)
        self.update_fields(data, None, reprocess=True)

    def update_fields(self, post, user, reprocess=False):
        _now = datetime.utcnow()
        fb_id = post.get('id')
        self.import_date = _now
        self.body = post.get('message')
        self.subject = post.get('story', None)
        self.source_post_id = fb_id
        self.creation_date = parse_datetime(post.get('created_time'))
        self.message_id = self.source.generate_message_id(fb_id)
        if not reprocess:
            self.creator = user.profile

    def update_attachment(self):
        if self.attachment_blob:
            attach = json.loads(self.attachment_blob)
            self.source.clear_post_attachments(self)
            post_json = self.imported_blob
            self.source._create_attachments(post_json, self,
                                            get_attachment=None,
                                            attachment_blob=attach)


class FacebookReader(PullSourceReader):
    min_time_between_reads = timedelta(minutes=15)
    time_between_reads = timedelta(minutes=45)

    def __init__(self, source_id, api):
        super(FacebookReader, self).__init__(source_id)
        self.api = api

    def do_read(self):
        upper = self.extra_args.get('upper_bound', None)
        lower = self.extra_args.get('lower_bound', None)
        reimport = self.reimporting
        reprocess = None
        if 'reprocess' in self.extra_args:
            reprocess = self.extra_args['reprocess']
        # Does not account for local time if Facebook ever sends non-UTC time
        import pytz
        if upper:
            upper = parse_datetime(upper)
            # cieling the datetime to maximum time of the day
            upper = datetime(year=upper.year, month=upper.month, day=upper.day,
                             hour=23, minute=59, second=59, tzinfo=pytz.UTC)
        if lower:
            lower = parse_datetime(lower)
            # floor the datetime to minimum time of the day
            lower = datetime(year=lower.year, month=lower.month, day=lower.day,
                             hour=23, minute=59, second=59, tzinfo=pytz.UTC)

        if not reprocess:
            self.source.fetch_content(upper_bound=upper, lower_bound=lower,
                                      reimport=reimport)
        else:
            self.source.reprocess()
