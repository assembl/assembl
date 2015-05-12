from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Text
 )

from .generic import PostSource
from .post import ImportedPost
from .auth import AbstractAgentAccount, AgentProfile
from ..tasks.source_reader import PullSourceReader
from ..lib import config
from ..lib.locale import get_localizer, _
from sqlalchemy.orm import relationship, backref
from datetime import datetime
import requests
import uuid
import simplejson as json


class EdgeSenseDrupalSource(PostSource):
    __tablename__ = 'edgesense_drupal_source'
    __mapper_args__ = {
        'polymorphic_identity': 'edgesense_drupal_source'
    }

    """
    Many of the links that come from edgeryder/drupal are relative links,
    and therefore the source should maintian a root URL for parsing
    purposes.

    A uniqueness constraint is NOT put on the 3 sources together in the DB,
    becauset there CAN be duplicate sources created across discussions,
    even possibly in the same discussion.

    Furthermore, for comments and posts, the IDs that will be imported will
    NOT be unique. However, unlike managing user uniqueness, Posts have
    internal mechanism
    """

    id = Column(Integer, ForeignKey(
                'post_source.id',
                onupdate='CASCADE',
                ondelete='CASCADE'), primary_key=True)

    node_source = Column(String(1024), nullable=False)
    node_root = Column(String(200))
    user_source = Column(String(1024), nullable=False)
    comment_source = Column(String(1024), nullable=False)
    post_id_prepend = Column(String(100), nullable=False)

    def generate_prepend_id(self):
        return uuid.uuid1().hex + "_"

    # @override
    def get_default_prepended_id(self):
        return self.post_id_prepend

    def get_prepend_id(self):
        return self.post_id_prepend

    def __init__(self, *args, **kwargs):
        if 'post_id_prepend' not in kwargs:
            kwargs['post_id_prepend'] = self.generate_prepend_id()
        super(EdgeSenseDrupalSource, self).__init__(*args, **kwargs)

    def make_reader(self):
        # Duck-Typed method to create a source_reader from this source
        return EdgeSenseReader(self.id)

    @classmethod
    def create(cls, nodes, users, comments, title, discussion, root_url=None):
        now = datetime.utcnow()
        return cls(node_source=nodes,
                   user_source=users,
                   comment_source=comments,
                   node_root=root_url,
                   last_import=now,
                   name=title,
                   creation_date=now,
                   discussion=discussion)


class SourceSpecificAccount(AbstractAgentAccount):
    """
    It is important to note that the IDs that come from edgeryder and
    other drupal sources will NOT be unique.

    In order to ensure uniqueness within Assembl, for users at least, the
    IDs are namespaced by adding a uniqueness constraint to the IDs
    stored, by the source that they come from.
    """

    __tablename__ = 'source_specific_account'

    __mapper_args__ = {
        'polymorphic_identity': 'source_specific_account'
    }

    __table_args__ = (UniqueConstraint('user_id', 'source_id'), )

    id = Column(Integer, ForeignKey(
                'abstract_agent_account.id',
                onupdate='CASCADE',
                ondelete='CASCADE'), primary_key=True)

    user_link = Column(String(1024))
    # user_id: Edgeryder returns "6464" or "6460"
    user_id = Column(String(15), nullable=False)
    user_info = Column(Text)  # The JSON blob for future-keeping
    source_id = Column(Integer, ForeignKey(
                       'edgesense_drupal_source.id',
                       onupdate='CASCADE',
                       ondelete='CASCADE'), nullable=False)
    source = relationship(EdgeSenseDrupalSource,
                          backref=backref('accounts'))

    @property
    def user_info_json(self):
        if self.user_info:
            return json.load(self.user_info)
        return {}

    @user_info_json.setter
    def user_info_json(self, value):
        self.user_info = json.dumps(value)

    @classmethod
    def create(cls, source, user_dict):
        user = user_dict['user']
        user_id = user['uid']
        # created = datetime.datetime.fromtimestamp(user['created'])
        name = user['name']
        link = u"https://edgeryders.eu/user/%s" % user_id
        profile = AgentProfile(name=name)

        return cls(user_info=json.dumps(user_dict),
                   user_link=link,
                   user_id=user_id,
                   source=source,
                   profile=profile)


class SourceSpecificUnknownAccount(SourceSpecificAccount):
    __mapper_args__ = {
        'polymorphic_identity': 'unknown_source_specific_account'
    }

    def display_name(self):
        localizer = get_localizer()
        return localizer.translate(_("Unknown User ${uid}",
                                   mapping={'uid': self.user_id}))


class SourceSpecificPost(ImportedPost):
    __mapper_args__ = {
        'polymorphic_identity': 'source_specific_post'
    }

    @staticmethod
    def create_nid(node):
        # prefixed because cid & nid WILL collide with each other
        return "nid_" + node['nid']

    @classmethod
    def create(cls, source, post):
        # post is a dictionary of the post from json

        # post = json.loads(json_post)
        # Check whether the incoming post is a Node post or a Comment post
        # prefix_id = source.get_prepend_id()
        if 'node' in post:
            if 'uid' not in post['node']:
                return None
            node = post.get('node', None)
            node_id = SourceSpecificPost.create_nid(node)

            created = datetime.fromtimestamp(int(node['created']))
            user_id = node['uid']
            source_id = source.id

            # By putting the users in first, assuming that this is
            # never empty
            user = source.db.query(SourceSpecificAccount).filter_by(
                user_id=user_id, source_id=source_id).first()

            agent = None if not user else user.profile
            import_date = datetime.utcnow()
            body = node.get('Body')
            if '/sites/default/files/' in body and ('http' or 'www'
                                                    not in body):
                body = source.node_root + body
            body_mime_type = 'text/html'
            discussion = source.discussion
            message_id = source.get_default_prepended_id() + node_id
            blob = json.dumps(post)

            return cls(import_date=import_date, source=source,
                       message_id=message_id, body_mime_type=body_mime_type,
                       source_post_id=node_id, creator=agent,
                       creation_date=created, imported_blob=blob,
                       discussion=discussion, body=body)

        if 'comment' in post:
            if 'uid' not in post['comment']:
                return None
            comment = post['comment']
            comment_id = comment['cid']
            created = datetime.fromtimestamp(int(comment['created']))

            user_id = comment['uid']
            source_id = source.id

            user = source.db.query(SourceSpecificAccount).filter_by(
                user_id=user_id, source_id=source_id).first()

            agent = None if not user else user.profile
            import_date = datetime.utcnow()
            body = comment.get('Comment')
            if '/sites/default/files/' in body:

                body = source.node_root + body
            body_mime_type = 'text/html'
            # title = comment['title']
            discussion = source.discussion
            message_id = source.get_default_prepended_id() + comment_id
            blob = json.dumps(post)

            return cls(import_date=import_date, source_post_id=comment_id,
                       message_id=message_id, source=source, creator=agent,
                       creation_date=created, discussion=discussion,
                       body_mime_type=body_mime_type, imported_blob=blob,
                       body=body)


class EdgeSenseFetcher(object):
    def __init__(self, source, from_file=None):
        self.from_file = from_file or False
        self.source = source

    def get_users(self, **kwargs):
        """To pass an HTTP AUTH to the request, pass as a (username,pass)
        tuple in kwargs.

        eg. get_users(auth=(my_username, my_password))"""
        path = self.source.user_source
        if self.from_file:
            with open(path) as data:
                users = json.load(data)
                return users.get('users', [])
        else:
            users = requests.get(path, **kwargs)
            return users.json().get('users', [])

    def get_nodes(self, **kwargs):
        """To pass an HTTP AUTH to the request, pass as a (username,pass)
        tuple in kwargs.

        eg. get_users(auth=(my_username, my_password))"""
        path = self.source.node_source
        if self.from_file:
            with open(path) as data:
                nodes = json.load(data)
                return nodes.get('nodes', [])
        else:
            nodes = requests.get(path, **kwargs)
            return nodes.json().get('nodes', [])

    def get_comments(self, **kwargs):
        """To pass an HTTP AUTH to the request, pass as a (username,pass)
        tuple in kwargs.

        eg. get_users(auth=(my_username, my_password))"""
        path = self.source.comment_source
        if self.from_file:
            with open(path) as data:
                comments = json.load(data)
                return comments.get('comments', [])
        else:
            comments = requests.get(path, **kwargs)
            return comments.json().get('comments', [])


class EdgeSenseParser(object):
    # In the parsing process, ALWAYS parse the USERS FIRST, because they will
    # be queried to get their agent-profile
    def __init__(self, source, fetcher=None):
        self.source = source
        self.session = source.db
        self.threaded = False
        self.fetcher = fetcher or EdgeSenseFetcher(source)
        self.users = None
        self.nodes = None
        self.comments = None

    def _setup(self):
        username = config.get('edgeryder.username')
        password = config.get('edgeryder.password')
        auth = (username, password)
        self.nodes = self.fetcher.get_nodes(auth=auth, verify=False)
        self.comments = self.fetcher.get_comments(auth=auth, verify=False)
        self.users = {x.get('user').get('uid'): x for x in
                      self.fetcher.get_users(auth=auth, verify=False)}

    def _get_all_users(self):
        return self.session.query(SourceSpecificAccount).\
            filter(SourceSpecificAccount.source_id == self.source.id).all()

    def _get_all_posts(self):
        # Is this dangerous, as it makes a (potentially) heavy query
        return self.session.query(SourceSpecificPost).\
            filter(SourceSpecificPost.source_id == self.source.id).all()

    def _convert_users_to_dict(self, db):
        return {x.user_id: x for x in db}

    def _convert_posts_to_dict(self, db):
        return {x.source_post_id: x for x in db}

    def _process_comment_threading(self, posts_db):
        # comments are json formatted dictionary objects
        # includes both nodes and comments

        waiting_list = []
        first_run = True
        while True:
            if first_run:
                current_list = self.comments
                first_run = False
            else:
                current_list = waiting_list
                waiting_list = []

            for comment in current_list:
                comm = comment['comment']
                if int(comm['pid']) == 0:
                    # Node nid is the parent
                    parent_id = 'nid_' + comm['nid']
                    parent = posts_db.get(parent_id, None)
                    if not parent:
                        waiting_list.append(comment)
                        continue
                    child = posts_db[comm['cid']]
                    # print child.id, parent.id, child.creator_id, parent.creator_id
                    child.set_parent(parent)

                else:
                    # Otherwise the comment is a reply to
                    # another comment
                    parent_id = comm['pid']
                    parent = posts_db.get(parent_id, None)
                    if not parent:
                        waiting_list.append(comment)
                        continue
                    child = posts_db[comm['cid']]
                    child.set_parent(parent)

            if not current_list:
                break

    def _create_user(self, user, users_db, unknown=False):
        if user:
            if unknown:
                new_user = SourceSpecificUnknownAccount.create(self.source,
                                                               user)
            else:
                new_user = SourceSpecificAccount.create(self.source, user)
            self.session.add(new_user)
            users_db[new_user.user_id] = new_user

    def _parse_nodes(self, posts_db, users_db):
        if not self.nodes:
            raise ValueError('There are no nodes to parse')
        else:
            for node in self.nodes:
                node_id = "nid_" + node['node']['nid']
                if node_id in posts_db:
                    continue
                user_id = node.get('node', {}).get('uid', None)
                if user_id:
                    if user_id not in users_db:
                        user = self.users.get(user_id, None)
                        if not user:
                            # Simplification:
                            # There is a user that is created with a user that
                            # does not exist in the users.json db
                            unknown_user = {"user": {
                                                    "uid": user_id,
                                                    "name": None,
                                           }}
                            self._create_user(unknown_user, users_db, True)

                        self._create_user(user, users_db)

                    new_post = SourceSpecificPost.create(self.source, node)
                    if not new_post:
                        continue
                    posts_db[node_id] = new_post
                    self.session.add(new_post)

    def _parse_comments(self, posts_db, users_db):
        if not self.comments:
            raise ValueError('There are no comments to parse')
        else:
            for comment in self.comments:
                comment_id = comment['comment']['cid']
                if comment_id in posts_db:
                    continue
                user_id = comment.get('comment', {}).get('uid', None)
                if user_id and user_id not in users_db:
                    user = self.users.get(user_id, None)
                    self._create_user(user, users_db)

                new_post = SourceSpecificPost.create(self.source, comment)
                if not new_post:
                    continue
                posts_db[comment_id] = new_post
                self.session.add(new_post)

    def parse(self):
        # First, setup
        self._setup()
        # First, get all users and posts from the source, so as to not create
        # duplicates
        users_db = self._convert_users_to_dict(self._get_all_users())
        posts_db = self._convert_posts_to_dict(self._get_all_posts())

        # pre-cursor to getting started
        self.session.flush()

        self._parse_nodes(posts_db, users_db)
        self.session.commit()

        self._parse_comments(posts_db, users_db)
        self.session.commit()

        self._process_comment_threading(posts_db)
        self.session.commit()

    def _update_user(self, user_id, user_db):
        user = user_db.get(user_id, None)
        if not user:
            user = self.users.get(user_id, None)
            self._create_user(user, user_db)
        else:
            new_user = self.users.get(user_id, None)
            if new_user:
                # If new_user is not in the db (for whatever reason), then
                # retain the old data.
                usr = new_user.get('user')
                user.user_info = json.dumps(new_user)
                user.user_link = u"https://edgeryders.eu/user/%s" % \
                                 user_id
                user.source = self.source
                profile = user.profile
                profile.name = usr.get('name')

    def _reimport_nodes_users(self, posts_db, users_db):
        if not self.nodes:
            raise ValueError('There are no nodes to re-parse')
        else:
            for node in self.nodes:
                nde = node['node']
                nid = SourceSpecificPost.create_nid(nde)
                if nid in posts_db:
                    user_id = nde.get('uid')
                    self._update_user(user_id, users_db)

                    old_node = posts_db.get(nid)
                    old_node.import_date = datetime.utcnow()
                    old_node.source = self.source
                    old_node.discussion = self.source.discussion
                    old_node.source_post_id = nid
                    old_node.message_id = \
                        self.source.get_default_prepended_id() + nid
                    body = nde['Body']
                    if '/sites/default/files/' in body and ('http' or 'www'
                                                            not in body):
                        body = self.source.node_root + body
                    old_node.body = body
                    old_node.body_mime_type = 'text/html'
                    old_node.creation_date = datetime.fromtimestamp(
                        int(nde['created']))

                    user = users_db.get(user_id, None)
                    if user:
                        # user can possibly not exist
                        agent = user.profile
                        old_node.creator = agent

                else:
                    new_post = SourceSpecificPost.create(self.source, node)
                    if not new_post:
                        continue
                    posts_db[nid] = new_post
                    self.session.add(new_post)

    def _reimport_comment_users(self, posts_db, users_db):
        if not self.comments:
            raise ValueError('There are no comments to re-parse')
        else:
            for comment in self.comments:
                comm = comment['comment']
                comment_id = comm.get('cid')
                user_id = comm.get('uid', None)
                if comm['cid'] in posts_db:
                    self._update_user(user_id, users_db)

                    old_comm = posts_db.get(comment_id)
                    old_comm.import_date = datetime.utcnow()
                    old_comm.source = self.source
                    old_comm.discussion = self.source.discussion
                    old_comm.source_post_id = comment_id
                    old_comm.message_id = \
                        self.source.get_default_prepended_id() + comment_id

                    body = comm['Comment']
                    if '/sites/default/files/' in body and ('http' or 'www'
                                                            not in body):
                        body = self.source.node_root + body

                    old_comm.body = body
                    old_comm.creation_date = datetime.fromtimestamp(
                        int(comm['created']))

                    user = users_db.get(user_id, None)
                    if user:
                        agent = user.profile
                        old_comm.creator = agent

                else:
                    new_comm = SourceSpecificPost.create(self.source, comment)
                    if not new_comm:
                        continue
                    posts_db[comment_id] = new_comm
                    self.session.add(new_comm)

    def re_import(self):
        self._setup()
        users_db = self._convert_users_to_dict(self._get_all_users())
        posts_db = self._convert_posts_to_dict(self._get_all_posts())

        self._reimport_nodes_users(posts_db, users_db)
        self.session.commit()

        self._reimport_comment_users(posts_db, users_db)
        self.session.commit()

        self._process_comment_threading(posts_db)
        self.session.commit()


class EdgeSenseReader(PullSourceReader):
    def setup(self):
        super(EdgeSenseReader, self).setup()
        self.parser = EdgeSenseParser(self.source)

    def do_read(self):
        self.parser.parse()

    def re_import(self):
        self.parser.re_import()
