from sqlalchemy import (
    Column,
    ForeignKey,
    Integer,
    String,
    UniqueConstraint,
    Text
 )

from .generic import PostSource
from .models.posts import ImportedPost
from .auth import AbstractAgentAccount, AgentProfile
from ..tasks.source_reader import PullSourceReader
from ..lib import config
from exceptions import InputError
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
        created = user['created']
        name = user['name']
        link = user['link']
        profile = AgentProfile(name=name)

        return cls(user_info=json.dumps(user_dict),
                   user_link=link,
                   user_id=user_id,
                   source=source,
                   profile=profile)


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
            body = node['body']
            discussion = source.discussion
            message_id = source.get_default_prepended_id() + node_id

            return cls(import_date=import_date, source=source,
                       message_id=message_id,
                       source_post_id=node_id, creator=agent,
                       creation_date=created,
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
            body = comment['comment']
            title = comment['title']
            discussion = source.discussion
            message_id = source.get_default_prepended_id() + comment_id

            return cls(import_date=import_date, source_post_id=comment_id,
                       message_id=message_id, source=source, creator=agent,
                       creation_date=created, discussion=discussion,
                       body=body, subject=title)


# In the parsing process, ALWAYS parse the USERS FIRST, because they will
# be queried to get their agent-profile
class EdgeSenseParser(object):
    def __init__(self, source, from_file=False):
        self.source = source
        self.session = source.db
        self.threaded = False
        if from_file:
            self.users = self._load_json_from_file(source.user_source)['users']
            self.nodes = self._load_json_from_file(source.node_source)['nodes']
            self.comments = self._load_json_from_file(
                source.comment_source)['comments']
        else:
            self.users = self._load_json(source, 'users', from_file)
            self.nodes = self._load_json(source, 'nodes', from_file)
            self.comments = self._load_json(source, 'comments', from_file)

    def _load_json_from_file(self, file_name):
        with open(file_name) as data:
            return json.load(data)

    def _load_json(self, source, resource_type, from_file):
        if resource_type is 'users':
            source_link = source.user_source
            if from_file:
                data = self.load_json_from_file(
                    source.user_source, 'users')
            else:
                data = requests.get(source_link).json()
            if 'users' in data:
                data = data['users']
            return data

        if resource_type is 'nodes':
            source_link = source.node_source
            if from_file:
                data = self.load_json_from_file(
                    source.node_source, 'nodes')
            else:
                data = requests.request(source_link).json()
            if 'nodes' in data:
                data = data['nodes']
            return data

        if resource_type is 'comments':
            source_link = source.comment_source
            if from_file:
                data = self.load_json_from_file(
                    source.comment_source, 'comments')
            else:
                data = requests.request(source_link).json()
            if 'comments' in data:
                data = data['comments']
            return data

        else:
            raise InputError("%s is not a proper resource" % resource_type)

    def load_json_from_file(self, file_path, source_type='nodes'):
        # source_type = ['users', 'nodes', 'comments']
        with open(file_path) as data:
            if source_type is 'users':
                return json.load(data)['users']
            if source_type is 'nodes':
                return json.load(data)['nodes']
            if source_type is 'comments':
                return json.load(data)['comments']
            else:
                raise InputError('source_type is not valid')

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

    def _process_comment_threading(self):
        # comments are json formatted dictionary objects
        # includes both nodes and comments

        # posts_db = self.session.query(SourceSpecificPost)./
        #     filter(
        #            ~(SourceSpecificPost.source_post_id.like(
        #            '%'+'nid_'+'%')) & (
        #            SourceSpecificPost.source_id == self.source.id)).all()
        if not self.threaded:
            posts_db = self._convert_posts_to_dict(
                self._get_all_posts()
            )

            for comment in self.comments:
                comm = comment['comment']
                if int(comm['pid']) == 0:
                    # Node nid is the parent
                    parent_id = 'nid_' + comm['nid']
                    parent = posts_db[parent_id]
                    child = posts_db[comm['cid']]
                    child.set_parent(parent)

                else:
                    # Otherwise the comment is a reply to another comment
                    parent_id = comm['pid']
                    parent = posts_db[parent_id]
                    child = posts_db[comm['cid']]
                    child.set_parent(parent)

            self.threaded = True

    def _parse_users(self, db):
        if not self.users:
            print "Array of users is empty!"
        else:
            for user in self.users:
                if user['user']['uid'] in db:
                    continue
                new_user = SourceSpecificAccount.create(self.source, user)
                self.session.add(new_user)

    def _parse_nodes(self, db):
        if not self.nodes:
            print "Array of nodes is empty!"
        else:
            for node in self.nodes:
                if ("nid_" + node['node']['nid']) in db:
                    continue
                new_post = SourceSpecificPost.create(self.source, node)
                if not new_post:
                    continue
                self.session.add(new_post)

    def _parse_comments(self, db):
        if not self.comments:
            print "Array of comments is empty!"
        else:
            for comment in self.comments:
                if comment['comment']['cid'] in db:
                    continue
                new_post = SourceSpecificPost.create(self.source, comment)
                if not new_post:
                    continue
                self.session.add(new_post)

    def parse(self):
        # First add all of the users to the db
        # Then add all of the nodes
        # Then add all of the comments
        # Then set parent on all comments

        # First, get all users and posts from the source, so as to not create
        # duplicates
        users_db = self._convert_users_to_dict(self._get_all_users())
        posts_db = self._convert_posts_to_dict(self._get_all_posts())

        # pre-cursor to getting started
        self.session.flush()

        self._parse_users(users_db)
        self.session.commit()

        self._parse_nodes(posts_db)
        self.session.commit()

        self._parse_comments(posts_db)
        self.session.commit()

        self._process_comment_threading()
        self.session.commit()

    def _update_users(self, db):
        if not self.users:
            print "Array of users is empty!"
        else:
            for user in self.users:
                if user['user']['uid'] in db:
                    usr = user.get('user')
                    old_user = db.get(usr['uid'])
                    old_user.user_info = json.dumps(user)
                    old_user.user_link = usr['link']
                    old_user.user_id = usr['uid']
                    old_user.source = self.source

                else:
                    new_user = SourceSpecificAccount.create(self.source, user)
                    self.session.add(new_user)

                # return cls(import_date=import_date, source=source,
                #        message_id = message_id,
                #        source_post_id=node_id, creator=agent,
                #        creation_date=created,
                #        discussion=discussion, body=body)

    def _update_nodes(self, db, users_db):
        if not self.nodes:
            print "Array of nodes is empty!"
        else:
            for node in self.nodes:
                nde = node['node']
                nid = SourceSpecificPost.create_nid(nde)
                if nid in db:
                    old_node = db.get(nid)
                    old_node.import_date = datetime.utcnow()
                    old_node.source = self.source
                    old_node.discussion = self.source.discussion
                    old_node.source_post_id = SourceSpecificPost.create_nid(
                        nde)
                    old_node.message_id = \
                        self.source.get_default_prepended_id() + \
                        SourceSpecificPost.create_nid(nde)
                    old_node.body = nde['body']
                    old_node.creation_date = datetime.fromtimestamp(
                        int(nde['created']))

                    user = users_db.get(nde['uid'])
                    agent = user.profile
                    old_node.creator = agent

                else:
                    new_post = SourceSpecificPost.create(self.source, node)
                    if not new_post:
                        continue
                    self.session.add(new_post)

    def _update_comments(self, db, users_db):
        if not self.comments:
            print "Array of comments is empty!"
        else:
            for comment in self.comments:
                comm = comment['comment']
                if comm['cid'] in db:
                    old_comm = db.get(comm['cid'])
                    old_comm.import_date = datetime.utcnow()
                    old_comm.source = self.source
                    old_comm.discussion = self.source.discussion
                    old_comm.source_post_id = comm['cid']
                    old_comm.message_id = \
                        self.source.get_default_prepended_id() + comm['cid']
                    old_comm.body = comm['comment']
                    old_comm.creation_date = datetime.fromtimestamp(
                        int(comm['created']))

                    user = users_db.get(comm['uid'])
                    agent = user.profile
                    old_comm.creator = agent
                else:
                    new_comm = SourceSpecificPost.create(self.source, comment)
                    if not new_comm:
                        continue
                    self.session.add(new_comm)

    def re_import(self):

        users_db = self._convert_users_to_dict(self._get_all_users())
        self._update_users(users_db)
        self.session.commit()

        # Users have been updated. Must update the local cache of users
        # as well
        users_db = self._convert_users_to_dict(self._get_all_users())

        posts_db = self._convert_posts_to_dict(self._get_all_posts())
        self._update_nodes(posts_db, users_db)
        self.session.commit()

        # Likewise, Posts have been updated; must update the posts_db to
        # reflect that change as well
        posts_db = self._convert_posts_to_dict(self._get_all_posts())
        self._update_comments(posts_db, users_db)
        self.session.commit()

        self.threaded = False
        self._process_comment_threading()
        self.session.commit()


class EdgeSenseReader(PullSourceReader):
    def __init__(self, source_id):
        super(EdgeSenseReader, self).__init__(source_id)

    def do_read(self):
        parser = EdgeSenseParser(self.source)
        parser.parse()

    def re_import(self):
        parser = EdgeSenseParser(self.source)
        parser.re_import()
