from abc import abstractmethod
from collections import defaultdict
from datetime import datetime
from urlparse import urlparse, parse_qs
import re

import facebook
from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    Boolean,
    DateTime
)
import simplejson as json
from dateutil.parser import parse as parse_datetime
from sqlalchemy.orm import relationship, backref
from virtuoso.alchemy import CoerceUnicode

from .auth import (
    AgentProfile,
    IdentityProvider,
    IdentityProviderAccount,
)

from ..auth import (CrudPermissions, P_EXPORT, P_SYSADMIN)
from ..lib.config import get_config
from ..lib.sqla import Base
from ..tasks.source_reader import PullSourceReader, ReaderStatus
from .generic import PostSource, ContentSourceIDs
from .post import ImportedPost


API_VERSION_USED = 2.2
DEFAULT_TIMEOUT = 30  # seconds
DOMAIN = 'facebook.com'


facebook_sdk_locales = defaultdict(set)

def fetch_facebook_sdk_locales():
    import requests as r
    from lxml import etree
    global facebook_sdk_locales
    xml_path = 'https://www.facebook.com/translations/FacebookLocales.xml'
    req = r.get(xml_path)
    xml = req.content
    root = etree.fromstring(xml)
    locales = root.xpath('//representation/text()')
    for locale in locales:
        lang, country = locale.split('_')
        facebook_sdk_locales[lang].add(country)


def run_setup():
    if not facebook_sdk_locales.keys():
        fetch_facebook_sdk_locales()

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
                if _check_fb_locale(lang, tmp_country):
                    return True, lang + '_' + tmp_country

            # language exists, but no country
            rand_country =  _get_rand_country(lang, facebook_sdk_locales)
            return True, lang + '_' + rand_country

        fb_countries = facebook_sdk_locales[lang]
        if country in fb_countries:
            return True, lang + '_' + country
        if lang == 'en':
            return True, lang + '_US'
        else:
            rand_country = _get_rand_country(lang, facebook_sdk_locales)
            return True, lang + '_' + rand_country

    # If all else fails, drop down to US English
    else:
        return False, 'en_US'


class FacebookAPI(object):
    # Proxy object to the unofficial facebook sdk
    def __init__(self, user_token=None):
        config = get_config()
        self._app_id = config['facebook.consumer_key']
        self._app_secret = config['facebook.consumer_secret']
        self._app_access_token = config['facebook.app_access_token']
        token = self._app_access_token if not user_token else user_token
        self._api = facebook.GraphAPI(token, DEFAULT_TIMEOUT, API_VERSION_USED)
        # if not user_token:
        #     self.api.access_token(self._app_access_token, self._app_secret)
        # else:
        #     self.api.access_token(user_token, self._app_secret)

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
        res = self.api.extend_access_token(self._app_id, self._app_secret)
        return res['access_token'], res['expires']

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
    # The main object to interact with to get source endpoints
    # The API proxy is injected no construction to have flexibility as
    # to which API sdk to use

    def __init__(self, api):
        self.fb_api = api
        self.api = api.api_caller()
        self.user_flush_state = None

    # ============================GETTERS=================================== #

    # ----------------------------- feeds -------------------------------------
    def get_feed(self, object_id, **args):
        resp = self.api.get_connections(object_id, 'feed', **args)
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
        for comments in self._get_next_comments(
                                           parent_comment.get('id'),
                                           next_page):
            for comment in comments:
                yield comment

    # ----------------------------- posts -------------------------------------
    def get_single_post(self, object_id, **kwargs):
        resp = self.api.get_object(object_id, **kwargs)
        return None if 'id' not in resp else resp

    def get_posts(self, object_id, **kwargs):
        resp = self.api.get_connections(object_id, 'posts', **kwargs)
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
    url_path = Column(String(1024))
    creator_id = Column(Integer, ForeignKey('facebook_account.id',
                        onupdate='CASCADE', ondelete='CASCADE'))
    creator = relationship('FacebookAccount',
                           backref=backref('sources',
                                           cascade="all, delete-orphan"))

    __mapper_args__ = {
        'polymorphic_identity': 'facebook_source'
    }

    @abstractmethod
    def fetch_content(self, api, limit=None):
        self._setup_reading(api)

    def make_reader(self):
        api = FacebookAPI()
        return FacebookReader(self.id, api)

    @classmethod
    def create_from(cls, discussion, url, fb_id, some_name):
        created_date = datetime.utcnow()
        last_import = created_date
        return cls(name=some_name, creation_date=created_date,
                   discussion=discussion, fb_source_id=fb_id,
                   url_path=url, last_import=last_import)

    def _setup_reading(self, api):
        self.provider = None
        self._get_facebook_provider()
        self.parser = FacebookParser(api)

    def _get_facebook_provider(self):
        if not self.provider:
            fb = self.db.query(IdentityProvider).\
                filter_by(name='facebook').first()
            self.provider = fb

    def _get_current_users(self):
        result = self.db.query(IdentityProviderAccount).\
            filter_by(domain=DOMAIN).all()
        return {x.userid: x for x in result}

    def _get_current_posts(self):
        results = self.db.query(FacebookPost).filter_by(
            source=self).all()
        return {x.source_post_id: x for x in results}

    def _create_fb_user(self, user, db):
        if user['id'] not in db:
            # avatar_url = self.parser.get_user_profile_photo(user)
            new_user = FacebookAccount.create(
                user,
                self.provider,
                self.parser.get_app_id()
            )
            self.db.add(new_user)
            self.db.flush()
            db[user['id']] = new_user

    def _create_post(self, post, user, db):
        # Utility method that creates the post and populates the local
        # cache.
        # Returns True if succesfull. False if post is not created.
        if post.get('id') in db:
            return True
        new_post = FacebookPost.create(self, post, user)
        if not new_post:
            return False
        self.db.add(new_post)
        self.db.flush()
        db[post.get('id')] = new_post
        return True

    def _manage_post(self, post, obj_id, posts_db, users_db):
        post_id = post.get('id')
        creator = self.parser.get_user_post_creator(post)
        self._create_fb_user(creator, users_db)

        # Get all of the tagged users instead?
        for user in self.parser.get_users_post_to_sans_self(post, obj_id):
            self._create_fb_user(user, users_db)

        creator_id = creator.get('id', None)
        creator_agent = users_db.get(creator_id)
        result = self._create_post(post, creator_agent, posts_db)

        if not result:
            return

        assembl_post = posts_db.get(post_id)
        self.db.commit()
        return assembl_post

    def _manage_comment(self, comment, parent_post, posts_db, users_db):
        user = self.parser.get_user_from_comment(comment)
        user_id = user.get('id')
        comment_id = comment.get('id')
        self._create_fb_user(user, users_db)
        for usr in self.parser.get_users_from_mention(comment):
            self._create_fb_user(usr, users_db)
        self.db.commit()

        cmt_creator_agent = users_db.get(user_id)
        cmt_result = self._create_post(comment, cmt_creator_agent, posts_db)
        if not cmt_result:
            return

        self.db.flush()
        comment_post = posts_db.get(comment_id)
        comment_post.set_parent(parent_post)
        self.db.commit()
        return comment_post

    def _manage_comment_subcomments(self, comment, parent_post,
                                    posts_db, users_db,
                                    sub_comments=False):
        comment_post = self._manage_comment(comment, parent_post,
                                            posts_db, users_db)
        if comment_post and sub_comments:
            for cmt in self.parser.get_comments_on_comment_paginated(comment):
                self._manage_comment(cmt, comment_post, posts_db,
                                     users_db)
                if self.read_status == ReaderStatus.SHUTDOWN:
                    break

    def feed(self, post_limit=None, cmt_limit=None):
        counter = 0
        comment_counter = 0
        users_db = self._get_current_users()
        posts_db = self._get_current_posts()

        object_info = self.parser.get_object_info(self.fb_source_id)

        self._create_fb_user(
            self.parser.get_user_object_creator(object_info), users_db
        )

        for post in self.parser.get_feed_paginated(self.fb_source_id):
            if post_limit:
                if counter >= post_limit:
                    break
            assembl_post = self._manage_post(post, self.fb_source_id,
                                             posts_db, users_db)
            if not assembl_post:
                continue

            counter += 1
            if self.read_status == ReaderStatus.SHUTDOWN:
                break
            for comment in self.parser.get_comments_paginated(post):
                if cmt_limit:
                    if comment_counter >= cmt_limit:
                        break
                self._manage_comment_subcomments(comment, assembl_post,
                                                 posts_db, users_db)
                if self.read_status == ReaderStatus.SHUTDOWN:
                    return

    def posts(self, post_limit=None):
        counter = 0
        users_db = self._get_current_users()
        posts_db = self._get_current_posts()

        for post in self.parser.get_posts_paginated(self.fb_source_id):
            if post_limit:
                if counter >= post_limit:
                    break
            assembl_post = self._manage_post(post, self.fb_source_id,
                                             posts_db, users_db)
            if not assembl_post:
                continue

            counter += 1
            if self.read_status == ReaderStatus.SHUTDOWN:
                break
            for comment in self.parser.get_comments_paginated(post):
                self._manage_comment_subcomments(comment, assembl_post,
                                                 posts_db, users_db,
                                                 True)
                if self.read_status == ReaderStatus.SHUTDOWN:
                    return

    def single_post(self, limit=None):
        raise NotImplementedError("To be developed after source/sink")


class FacebookGroupSource(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_open_group_source'
    }

    def fetch_content(self, api, limit=None):
        self._setup_reading(api)
        self.feed(limit)


class FacebookGroupSourceFromUser(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_private_group_source'
    }

    def fetch_content(self, api, limit=None):
        self._setup_reading(api)
        self.feed(limit)


class FacebookPagePostsSource(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_page_posts_source'
    }

    def fetch_content(self, api, limit=None):
        self._setup_reading(api)
        self.posts(limit)


class FacebookPageFeedSource(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_page_feed_source'
    }

    def fetch_content(self, api, limit=None):
        self._setup_reading(api)
        self.feed(limit)


class FacebookSinglePostSource(FacebookGenericSource):
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_singlepost_source'
    }

    def fetch_content(self, api, limit=None):
        # Limit should not apply here, unless the limit is in reference to
        # number of comments brought in
        self._setup_reading(api)
        self.single_post(limit)


class FacebookAccount(IdentityProviderAccount):
    __tablename__ = 'facebook_account'
    __mapper_args__ = {
        'polymorphic_identity': 'facebook_account'
    }

    account_provider_name = "facebook"

    id = Column(Integer, ForeignKey(
        'idprovider_agent_account.id',
        ondelete='CASCADE',
        onupdate='CASCADE'), primary_key=True)
    app_id = Column(String(512))

    def populate_picture(self, profile):
        self.picture_url = 'http://graph.facebook.com/%s/picture' % self.userid

    @classmethod
    def create(cls, user, provider, app_id, avatar_url=None):
        userid = user.get('id')
        full_name = user.get('name')
        agent_profile = AgentProfile(name=full_name)
        avatar = avatar_url or \
            'http://graph.facebook.com/%s/picture' % userid

        return cls(
            provider=provider,
            domain=DOMAIN,
            userid=userid,
            full_name=full_name,
            profile=agent_profile,
            app_id=app_id,
            picture_url=avatar
        )


class FacebookAccessTokens(Base):
    __tablename__ = 'facebook_access_tokens'

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey('facebook_account.id',
                     onupdate='CASCADE', ondelete='CASCADE'))

    user = relationship('FacebookAccount',
        backref=backref('access_tokens', cascade='all, delete-orphan'))

    token = Column(String(512), unique=True)
    expiration = Column(DateTime)
    # ['page', 'group', 'user', 'app'...]
    token_type = Column(String(50))
    # Object_name: The name of the group/page
    object_name = Column(String(512))

    def __init__(self, *args, **kwargs):
        try:       
            if 'expiration' in kwargs:
                val = kwargs['expiration']
                if isinstance(val, basestring):
                    # If a string is passed through, then it MUST be in
                    # ISO 8601 format
                    kwargs['expiration'] = parse_datetime(val)
            else:
                # There is no expiration sent. Go fetch it.
                # If errors out, put nothing
                kwargs['expiration'] = self.get_token_expiration()
        except:
            # TODO: Log the error and move on
            pass
        super(FacebookAccessTokens, self).__init__(args, kwargs)

    @property
    def expires(self):
        return self.expiration

    @expires.setter
    def expires(self, value):
        if isinstance(value, datetime):
            self.expiration = value
        else:
            pass

    def expiration(self):
        now = datetime.datetime.utcnow()
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
        return query.join(cls.user).filter(FacebookAccount.profile_id == user_id)

    crud_permissions = CrudPermissions(P_EXPORT, P_SYSADMIN, read_owned=P_EXPORT)



class FacebookPost(ImportedPost):
    """
    A facebook post, from any resource on the Open Graph API
    """
    __tablename__ = 'facebook_post'

    id = Column(Integer, ForeignKey(
                'imported_post.id',
                onupdate='CASCADE',
                ondelete='CASCADE'), primary_key=True)

    attachment = Column(String(1024))
    link_name = Column(CoerceUnicode(1024))
    post_type = Column(String(20))

    __mapper_args__ = {
        'polymorphic_identity': 'facebook_post'
    }

    @classmethod
    def create(cls, source, post, user):
        import_date = datetime.utcnow()
        source_post_id = post.get('id')
        source = source
        creation_date = parse_datetime(post.get('created_time'))
        discussion = source.discussion
        creator_agent = user.profile
        blob = json.dumps(post)

        post_type = post.get('type', None)
        subject, body, attachment, link_name = (None, None, None, None)
        if not post_type:
            # Typically, a facebook comment
            # Comments, even with links embedded, do not have an attachment
            body = post.get('message')
            post_type = 'comment'

        elif post_type is 'video' or 'photo':
            subject = post.get('story', None)
            body = post.get('message', "") + "\n" + post.get('link', "") \
                if 'message' in post else post.get('link', "")
            attachment = post.get('link', None)
            link_name = post.get('caption', None)

        elif post_type is 'link':
            subject = post.get('story', None)
            body = post.get('message', "")
            attachment = post.get('link')
            link_name = post.get('caption', None)
            match_str = re.split(r"^\w+://", attachment)[1]
            if match_str not in body:
                body += "\n" + attachment

        elif post_type is 'status':
            if not post.get('message', None):
                # A type of post that does not have any links nor body content
                # It is useless, therefore it should never generate a post
                return None
            body = post.get('message')

        return cls(
            attachment=attachment,
            link_name=link_name,
            body_mime_type='text/plain',
            import_date=import_date,
            source_post_id=source_post_id,
            message_id=source_post_id,
            source=source,
            creation_date=creation_date,
            discussion=discussion,
            creator=creator_agent,
            post_type=post_type,
            imported_blob=blob,
            subject=subject,
            body=body
        )


class FacebookContent(object):
    def __init__(self, body=None, attachment=None, extras=None):
        print "Created the IFacebookContent"
        self.body = body or ""
        self.attachment = attachment
        self.attachment_extras = extras or None

    def get_body(self):
        return self.body

    def has_body(self):
        return self.body is not ""

    def has_attachment(self):
        return self.attachment is not None

    def get_attachment(self):
        return self.attachment

    def get_attachment_extras(self):
        return self.attachment_extras


class FacebookContentSink(object):
    # An object that would push whatever content wanted to facebook
    def __init__(self, api, user):
        self.user = user
        self.parser = FacebookParser(api)

    def verify_access_token_valid(self):
        # Check that the user access token has not expired
        # yet
        # Might need Velruse and front-end work to get to this stage
        pass

    def create_source_from_post(self, post_id, post_address, user):
        # Create the source
        # Check that the access token allows pushing
        # If successfull push, create the source
        # And read from it immediately

        # Create a Source
        # source = FacebookSinglePostSource()
        # Create a ContentSourceIDs
        pass


class FacebookReader(PullSourceReader):
    def __init__(self, source_id, api):
        super(FacebookReader, self).__init__(source_id)
        self.api = api

    def do_read(self):
        # TODO reimporting
        limit = self.extra_args.get('limit', None)
        self.source.fetch_content(self.api, limit)
