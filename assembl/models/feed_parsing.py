from sqlalchemy import (
    orm,
    Column,
    ForeignKey,
    Integer,
    String,
    DateTime
 )
import transaction

from .generic import PostSource
from .post import ImportedPost
from .auth import AbstractAgentAccount, AgentProfile
from virtuoso.alchemy import CoerceUnicode
from ..lib.sqla import get_session_maker
from cStringIO import StringIO
import feedparser
import requests
import pytz
from importlib import import_module
from datetime import datetime
from calendar import timegm
from ..tasks.source_reader import PullSourceReader


class FeedFetcher(object):
    """
    A thin wrapper around requests in order to be able to get a feed from a
    web resource address, returning either as a string object (which is the
    preferred method for feedparser) or as a StringIO object (which is what
    speedparser likes)
    """

    def return_string(self, uri):
        """Returns the string content with the xml inside"""
        resp = requests.get(uri)
        return resp.content

    def return_file(self, uri):
        """Returns a StringIO with the xml inside"""
        output = StringIO()
        resp = requests.get(uri)
        output.write(resp.content)
        return output


class ParserWrapper(object):
    """
    A moderate wrapper around which parsing module is used (feedparser vs
    speedparser).
    """

    def __init__(self, fetcher, parser, parser_can_read_file=False):
        self.fetcher = fetcher
        self.parser = parser
        self.parser_can_read_file = parser_can_read_file

    def parse(self, uri):
        if self.parser_can_read_file:
            return self.parser.parse(self.fetcher.return_file(uri))
        else:
            return self.parser.parse(self.fetcher.return_string(uri))


class ParsedData(object):
    """
    For every atom feed URL that is fetched, a ParsedData object is generated
    to handle the retrieving the feed, the entries, or other fields as needed.
    This object is the base "Data Getter" object for atom feeds.

    @TODO: Extend this class to suport RRS feeds as well.
    """

    def __init__(self, url, parser_wrapper=None):
        self.url = url
        self._parse_agent = parser_wrapper or \
            ParserWrapper(FeedFetcher(), feedparser)
        self._feed = None

    def _fetch_source(self):
        if not self._feed:
            print "parsing feed from %s" % (self.url)
            self._feed = self._parse_agent.parse(self.url)

    def _update_feed(self,url):
        print "parsing feed from new url source"
        self._feed = self._parse_agent.parse(url)

    def refetch_source(self):
        self._feed = self._parse_agent.parse(self.url)

    def get_parsed_feed(self):
        """Returns the entire parsed feed as a dict"""
        self._fetch_source()
        return self._feed

    def get_feed(self):
        """Returns feed summary from entire parsed feed as list"""
        self._fetch_source()
        return self.get_parsed_feed()['feed']

    # Does not update the source
    def get_feed_forced(self,url):
        return self._parse_agent.parse(url)

    def get_entries(self):
        self._fetch_source()
        return iter(self.get_parsed_feed()['entries'])


class PaginatedParsedData(ParsedData):
    """
    Extention of the "Data Getter" object, which supports basic pagination of
    data.

    @TODO: Extend this object to support variable key pagination, rather than
    simple integer incrementation.
    """
    def __init__(self, url, parser_wrapper=None,
                 page_key='page', start_page=1):
        self.page_number = start_page
        self.page_key = page_key
        self.url = url
        self._new_source_fetched = False
        self._parse_wrapper = parser_wrapper or \
            ParserWrapper(FeedFetcher(), feedparser)
        super(self.__class__, self).__init__(url, self._parse_wrapper)

    def _check_empty_entries(self, feed):
        """Checks if the currently fetched feed has any entries or not"""
        return feed['entries'] == []

    def _update_url(self):
        """The method updates the url to update the concept of 'next page'.
        It will call _append_pagination_to_url.

        @override this to implement specific logic"""
        next = self.page_number
        while True:
            next_url = self.url + "?" + self.page_key + "=" + str(next)
            next += 1
            yield next_url

    def get_next_feed(self):
        for url in self._update_url():
            print "Fetching current url: \n%s" % url
            feed = super(self.__class__, self).get_feed_forced(url)
            if feed['entries'] == []:
                raise StopIteration
            yield feed

    def _get_entry_per_feed(self, feed):
        return iter(feed['entries'])

    def get_entries(self):
        for feed in self.get_next_feed():
            for entry in self._get_entry_per_feed(feed):
                yield entry


class FeedPostSource(PostSource):
    """
    The source of an imported feed, be it Atom, RSS, or any other type of feed
    protocol.
    """
    __tablename__ = 'feed_posts_source'

    id = Column(Integer, ForeignKey(
                'post_source.id',
                ondelete='CASCADE',
                onupdate='CASCADE'), primary_key=True)

    url = Column(String(1024), nullable=False)

    # For parameter free calling to parse posts from this source.
    parser_full_class_name = Column(String(512), nullable=False)

    __mapper_args__ = {
        'polymorphic_identity': 'feed_posts_source'
    }

    @classmethod
    def create_from(cls, discussion, url, source_name, parse_config_class):
        encoded_name = source_name.encode('utf-8')
        encoded_url = url.encode('utf-8')
        created_date = pytz.datetime.datetime.utcnow().\
            replace(tzinfo=pytz.utc)
        parser_name = str(parse_config_class).split("'")[1]
        return cls(name=encoded_name, creation_date=created_date,
                   discussion=discussion, url=encoded_url,
                   parser_full_class_name=parser_name)

    def __init__(self, *args, **kwargs):
        print "I am in the orignial constructor"
        super(FeedPostSource,self).__init__(*args,**kwargs)
        self.init_on_reload()

    @orm.reconstructor
    def init_on_reload(self):
        print "I am reloading my constructor"
        self._parse_agent = None
        self._post_type = FeedPost # for db querying
        self._user_agents = {}

    def _check_parser_loaded(self):
        if not self._parse_agent:
            module, parse_cls = \
                tmp =  self.parser_full_class_name.rsplit(".",1)
            mod = import_module(module)
            tmp = getattr(mod, parse_cls)
            self._parse_agent = tmp(self.url)

    def _generate_post_stream(self):
        self._check_parser_loaded()
        for entry in self._parse_agent.get_entries():
            account = self._create_account_from_entry(entry)
            self._add_user_agent(account)
            yield self._convert_to_post(entry, account)

    def _generate_post_stream_debug(self):
        self._check_parser_loaded()
        for entry in self._parse_agent.get_entries():
            account = self._create_account_from_entry(entry)
            self._add_user_agent(account)
            yield self._convert_to_post(entry, account), account

    def _add_user_agent(self, account):
        """Takes an account, and populate the _user_agents cache."""
        user = account.get_user_link()
        if user not in self._user_agents:
            self._user_agents[user] = account

    def _add_users_to_db(self):
        for user in self._user_agents.itervalues():
            self.db().add(user)

    # This must also be overriden to search the correct Posts table
    def _validate_post_not_exists(self, post):
        """Checks that the post is not already a part of the db"""
        tbl = self._post_type
        results = self.db().query(tbl).\
            filter(tbl.source_post_id == post.source_post_id).count()
        return results == 0

    # This should be populated differently for subclasses that handles
    # convertion logic
    def _convert_to_post(self, entry, account):
        # Content Baggage: id (PrimaryKey), type, creation_date, discussion_id,
        # hidden

        # Post Baggage: id(ForeignKey, content), message_id, ancestry,
        # parent_id(ForeignKey, post), children (rs: Post),
        # creator_id(ForeignKey agentprofile), creator(rs: AgentProfile),
        # subject, body,

        # ImportedPost Baggage: id (ForeignKey, post), import_date,
        # source_post_id, source_id, body_mime_type, source(PostSource)

        # Time in UTC w/o timezone information
        post_created_date = datetime.\
            fromtimestamp(timegm(entry['updated_parsed']))
        source_post_id = entry['id'].encode('utf-8')
        source = self
        body_mime_type = entry['content'][0]['type']

        subject = entry['title'].encode('utf-8')
        body = entry['content'][0]['value'].encode('utf-8')
        imported_date = pytz.datetime.datetime.\
            utcnow().replace(tzinfo=pytz.utc)

        user = account.profile

        return FeedPost(creation_date=post_created_date,
                        import_date=imported_date,
                        source_post_id=source_post_id,
                        source=source,
                        discussion=source.discussion,
                        body_mime_type=body_mime_type,
                        creator=user,
                        subject=subject,
                        body=body)


    # Override on subclass, as necessary
    def _create_account_from_entry(self, entry):
        """Create a WeblinkAccount from a parsed ATOM entry"""

        author_name = entry['author'].encode('utf-8')
        author_link = entry['author_detail']['href'].encode('utf-8')
        desc = "Generic Feed-Based Account"
        agent_profile = AgentProfile(name=author_name, description=desc)

        return WebLinkAccount(user_link=author_link, profile=agent_profile)

    def _add_entries(self):
        for post in self._generate_post_stream():
            if self._validate_post_not_exists(post):
                self.db().add(post)
                self.db().flush()

    def generate_posts(self):
        self._check_parser_loaded()
        self._add_entries()
        # self.commit_changes()

    def commit_changes(self):
        self._add_users_to_db()
        self.db().commit()

    def make_reader(self):
        return FeedSourceReader(self.id)


class FeedSourceReader(PullSourceReader):
    def do_read(self):
        import pdb; pdb.set_trace()
        self.source.generate_posts()


class LoomioPostSource(FeedPostSource):
    """
    The source an imported feed, that came directly from Loomio.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'feed_posts_source_loomio'
    }

    def __init__(self, *args, **kwargs):
        self._post_type = LoomioFeedPosts
        super(self.__class__, self).__init__(*args, **kwargs)

    def _create_account_from_entry(self, entry):
        author_name = entry['author'].encode('utf-8')
        author_link = entry['author_detail']['href'].encode('utf-8')
        desc = "Loomio Feed-Based Account"
        agent_profile = AgentProfile(name=author_name, description=desc)

        # There appears to be a duplication of records containing the
        # author_name, both in this table, and in the AgentProfile table.
        # Does this table become unnecessary?
        return LoomioAccount(user_link=author_link, user_name=author_name,
                             profile=agent_profile)

    def _convert_to_post(self,entry,account):
        # Content Baggage: id (PrimaryKey), type, creation_date, discussion_id,
        # hidden

        # Post Baggage: id(ForeignKey, content), message_id, ancestry,
        # parent_id(ForeignKey, post), children (rs: Post),
        # creator_id(ForeignKey agentprofile), creator(rs: AgentProfile),
        # subject, body,

        # ImportedPost Baggage: id (ForeignKey, post), import_date,
        # source_post_id, source_id, body_mime_type, source(PostSource)

        # Time in UTC w/o timezone information
        post_created_date = datetime.\
            fromtimestamp(timegm(entry['updated_parsed']))
        source_post_id = entry['id'].encode('utf-8') # alter
        source = self
        body_mime_type = entry['content'][0]['type']

        subject = entry['title'].encode('utf-8')
        body = entry['content'][0]['value'].encode('utf-8')
        imported_date = pytz.datetime.datetime.\
            utcnow().replace(tzinfo=pytz.utc)

        user = account.profile

        return LoomioFeedPost(creation_date=post_created_date,
                        import_date=imported_date,
                        source_post_id=source_post_id,
                        source=source,
                        body_mime_type=body_mime_type,
                        creator=user,
                        subject=subject,
                        body=body)


class FeedPost(ImportedPost):
    """
    A discussion post that is imported from an external feed source.
    """

    # Content Baggage: id (PrimaryKey), type, creation_date, discussion_id,
    # hidden

    # Post Baggage: id(ForeignKey, content), message_id, ancestry,
    # parent_id(ForeignKey, post), children (rs: Post),
    # creator_id(ForeignKey agentprofile), creator(rs: AgentProfile),
    # subject, body,

    # ImportedPost Baggage: id (ForeignKey, post), import_date,
    # source_post_id, source_id, body_mime_type, source(PostSource)

    __mapper_args__ = {
        'polymorphic_identity': 'feed_imported_posts',
    }


class LoomioFeedPosts(FeedPost):
    """
    A discussion post this is imported from a feed extracted from Loomio.
    """

    __mapper_args__ = {
        'polymorphic_identity': 'loomio_feed_post'
    }


class WebLinkAccount(AbstractAgentAccount):
    """
    An imported name that has not been validated nor authenticated
    within Assembl. This is to keep track of an imported post's ownership.
    """

    # Baggage: Id, type, profile_id (ForeignKey, agent_profile),
    # preferred (ForeignKey, agent_profile), verified, email,

    __tablename__ = 'weblink_user'

    id = Column(Integer, ForeignKey(
                'abstract_agent_account.id',
                onupdate='CASCADE',
                ondelete='CASCADE'), primary_key=True)

    user_link = Column(String(1024), unique=True)

    __mapper_args__ = {
        'polymorphic_identity': 'weblink_user'
    }

    def get_user_link(self):
        return self.user_link


class NamedWebLinkAccount(WebLinkAccount):
    """
    A weblink account with URL and Name. This is not an authenticated user.
    """
    __tablename__ = 'named_weblink_user'

    id = Column(Integer, ForeignKey(
                'weblink_user.id',
                ondelete='CASCADE',
                onupdate='CASCADE'), primary_key=True)

    user_name = Column(CoerceUnicode(1024))
    __mapper_args__ = {
        'polymorphic_identity': 'named_weblink_user'
    }


class LoomioAccount(NamedWebLinkAccount):
    """
    An imported Loomio name and address. This is not an authenticated user.
    """
    __mapper_args__ = {
        'polymorphic_identity': 'loomio_user'
    }
