from sqlalchemy import (
    orm,
    Column,
    ForeignKey,
    Integer,
    String,
    Boolean,
    DateTime,
    UniqueConstraint,
    Text
#    not_
 )

from .generic import PostSource, ContentSource
from .post import ImportedPost, Post, Content
from .auth import AbstractAgentAccount, AgentProfile
from .feed_parsing import WebLinkAccount
from ..lib.sqla import get_session_maker
from ..tasks.source_reader import PullSourceReader
from ..lib import config
from sqlalchemy.orm import relationship, backref
from virtuoso.alchemy import CoerceUnicode
from exceptions import ImportError, TypeError
from importlib import import_module
from datetime import datetime
import requests
import pytz
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

    node_source = Column(String(1024))
    node_root = Column(String(200))
    user_source = Column(String(1024))
    comment_source = Column(String(1024))
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

    __table_args__ = (
        UniqueConstraint('user_id','source_id'), )

    id = Column(Integer, ForeignKey(
                'abstract_agent_account.id',
                onupdate='CASCADE',
                ondelete='CASCADE'), primary_key=True)

    user_link = Column(String(1024))
    # user_id: Edgeryder returns "6464" or "6460"
    user_id = Column(String(15), nullable=False)
    user_info = Column(Text) # The JSON blob for future-keeping
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

        return cls(user_link=link, user_name=name,
                   user_id=user_id, source=source,
                   user_info=json.dumps(user_dict),
                   profile=profile)


class SourceSpecificPost(ImportedPost):
    # __tablename__ = 'source_specific_post'
    __mapper_args__ = {
        'polymorphic_identity': 'source_specific_post'
    }

    # "node": {
    #     "nid": "4413",
    #     "uid": "34",
    #     "date": "13 Mar 2015 - 10:18",
    #     "created": "1426241895",
    #     "body": "https:\/\/edgeryders.eu\/profiles\/commons\/libraries\/ckeditor\/plugins\/smiley\/images\/regular_smile.png"

    # "comment": {
    #     "cid": "286",
    #     "nid": "194",
    #     "uid": "34",
    #     "created": "1316509746",
    #     "pid": "0",
    #     "comment": "Definitely a lot of energy at #15shm. For me it was quite clear that there is no accepted way to deal with an institution that shows up respectfully and wishes to interact. People are so accustomed to having to fight for attention that they are not sure what to do when they get it!",
    #     "title": ""
    # }

    # if pid is 0, then the comment is on a node
    # if pid is not 0, then the comment is on another comment

    # Content: creation_date, discussion_id/discussion,
    # Post: message_id, ancestry, parent_id, children, creator_id/creator,
    #   subject, body
    # ImportedPost: import_date, source_post_id, source_id/source,
    #   body_mime_type,

    # Char-escape for the body of content is going to be a Biznitch

    @classmethod
    def create(cls, discussion, source, post):
        # post is a dictionary of the post from json

        #post = json.loads(json_post)
        # Check whether the incoming post is a Node post or a Comment post
        # prefix_id = source.get_prepend_id()
        if 'node' in post:
            node = post['node']
            node_id = "nid_" + node['nid'] #prefixed because cid & nid WILL
            # collide with each other
            created = datetime.fromtimestamp(int(node['created']))
            user_id = node['uid']
            source_id = source.id

            # By putting the users in first, assuming that this is
            # never empty
            user = source.db.query(SourceSpecificAccount).filter_by(
                user_id=user_id, source_id=source_id).first()

            agent = user.profile
            import_date = datetime.utcnow()
            body = node['body']

            return cls(import_date=import_date, source_post_id=node_id,
                       source=source, creator=agent, creation_date=created,
                       discussion=discussion, body=body)

        if 'comment' in post:
            comment = post['comment']
            comment_id = comment['cid']
            created = datetime.fromtimestamp(int(comment['created']))

            if 'uid' in comment['uid']:
                user_id = comment['uid']
            source_id = source.id

            user = source.db.query(SourceSpecificAccount).filter_by(
                user_id=user_id, source_id=source_id).first()

            agent =  None if not user else user.profile
            import_date = datetime.utcnow()
            body = comment['body']
            title = comment['title']

            # if comment['pid'] == 0:
            #     parent_id = prefix_id + comment['nid']
            # else:
            #     parent_id = prefix_id + comment['pid']

            # parent = source.db.query(Post).\
            #     filter_by(message_id=parent_id).first()

            # parent_id_to_store = parent.id

            return cls(import_date=import_date, source_post_id=comment_id,
                       source=source, creator=agent, creation_date=created,
                       discussion=discussion, body=body, subject=title)
                       # parent_id=parent_id_to_store)



# In the parsing process, ALWAYS parse the USERS FIRST, because they will
# be queried to get their agent-profile
class EdgeSenseParser(object):
    def __init__(self, source, from_file=False, file_source=None):
        if not from_file:
            self.source = source
            self.session= source.db
            self.users = self._load_json(source, 'users')
            self.nodes = self._load_json(source, 'nodes')
            self.comments = self._load_json(source, 'comments')
        elif file_source:
            self.users = self.load_json_from_file(file_source, 'users')
            self.nodes = self.load_json_from_file(file_source, 'nodes')
            self.comments = self.load_json_from_file(file_source, 'comments')
            self.source = source
            self.session = source.db
        else:
            print "You dun goofed hard"

    def _load_json(self,source, resource_type):
        if resource_type is 'users':
            source_link = source.user_source
            data = None
            try:
                data = requests.request(source_link).json()
                if 'users' in data:
                    data = data['users']
            except e:
                data=None
            return data

        if resource_type is 'nodes':
            source_link = source.node_source
            data = None
            try:
                data = requests.request(source_link).json()
                if 'nodes' in data:
                    data = data['nodes']
            except e:
                data=None
            return data

        if resource_type is 'comments':
            source_link = source.comment_source
            data = None
            try:
                data = requests.request(source_link).json()
                if 'comments' in data:
                    data = data['comments']
            except e:
                data=None
            return data
        else:
            raise InputError("%s is not a proper resource" % resource_type)

    def load_json_from_file(self,file_path,source_type='nodes'):
        # source_type = ['users', 'nodes', 'comments']
        with open(file_path) as data:
            if source_type is 'users':
                self.users = json.load(data)['users']
            elif source_type is 'nodes':
                self.users = json.load(data)['nodes']
            elif source_type is 'comments':
                self.comments = json.load(data)['comments']
            else:
                raise InputError('source_type is not valid')


    def _get_all_users(self):
        return self.session.query(SourceSpecificAccount).\
            filter(SourceSpecificAccount.source_id == self.source.id).all()

    def _get_all_posts(self):
        # Is this dangerous, as it makes a (potentially) heavy query
        return self.session.query(SourceSpecificPost).\
            filter(SourceSpecificPost.source_id == self.source.id).all()

    def _covert_posts_to_dict(self, db):
        return {x.source_post_id: x for x in db}

    def _process_comment_threading(self, comments):
        # incoming comments are json formatted dictionary objects
        # includes both nodes and comments

        # posts_db = self.session.query(SourceSpecificPost)./
        #     filter(
        #            ~(SourceSpecificPost.source_post_id.like(
        #            '%'+'nid_'+'%')) & (
        #            SourceSpecificPost.source_id == self.source.id)).all()

        posts_db = self._get_all_posts()
        comments_dict = self._conver_post_to_dict(self,posts_db)

        for comment in comments:
            comm = comment['comment']
            if comm['pid'] == 0:
                # Node nid is the parent
                parent_id = 'nid_' + comm['nid']
                parent = posts_db[parent_id]
                child = posts_db[comm['cid']]
                child.set_parent(parent)

            # Otherwise the comment is a reply to another comment
            parent_id = comm['pid']
            parent = posts_db[parent_id]
            child = posts_db[comm['cid']]
            child.set_parent(parent)

    def parse(self, bound_discussion):
        # First add all of the users to the db
        # Then add all of the nodes
        # Then add all of the comments
        # Then set parent on all comments

        #First, get all users and posts from the source, so as to not create
        # duplicates
        users_db = self._conver_users_to_dict(self._get_all_users())
        posts_db = self._conver_post_to_dict(self._get_all_posts())

        # pre-cursor to getting started
        self.session.flush()

        for user in self.users:
            if user['user']['uid'] in users_db:
                continue
            new_user = SourceSpecificAccount.create(self.source, user)
            self.session.add(new_user)

        self.session.commit()

        for node in self.nodes:
            if ("nid_" + node['user']['nid']) in posts_db:
                continue
            new_post = SourceSpecificPost.create(bound_discussion,
                                                 self.source)
            self.session.add(new_post)

        self.session.commit()

        for comment in self.comments:
            if comment['comment']['cid'] in posts_db:
                continue
            new_post = SourceSpecificPost.create(bound_discussion,
                                                 self.source)
            self.session.add(new_post)

        self.session.commit()

        self._process_comment_threading(self.comments)
        self.session.commit()
