from itertools import groupby, chain
import traceback
from datetime import datetime

import simplejson as json
from pyramid.security import Allow, ALL_PERMISSIONS
from sqlalchemy import (
    Column,
    Integer,
    UnicodeText,
    SmallInteger,
    DateTime,
    Text,
    String,
    Boolean,
    event,
    and_,
)
from sqlalchemy.orm import relationship, join, subqueryload_all

from assembl.lib.utils import slugify
from . import DiscussionBoundBase
from virtuoso.alchemy import CoerceUnicode
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..auth import (
    P_READ, R_SYSADMIN, P_ADMIN_DISC, R_PARTICIPANT, P_SYSADMIN,
    CrudPermissions, Authenticated, Everyone)
from .auth import (
    DiscussionPermission, Role, Permission, User, UserRole, LocalUserRole,
    UserTemplate)
from ..semantic.namespaces import (CATALYST, ASSEMBL, DCTERMS)


class Discussion(DiscussionBoundBase):
    """
    A Discussion
    """
    __tablename__ = "discussion"
    rdf_class = CATALYST.Conversation

    id = Column(Integer, primary_key=True,
                info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})

    topic = Column(UnicodeText, nullable=False,
                   info={'rdf': QuadMapPatternS(None, DCTERMS.title)})

    slug = Column(CoerceUnicode, nullable=False, unique=True, index=True)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
                           info={'rdf': QuadMapPatternS(None, DCTERMS.created)})
    objectives = Column(UnicodeText)
    instigator = Column(UnicodeText)
    introduction = Column(UnicodeText)
    introductionDetails = Column(UnicodeText)
    settings = Column(Text())  # JSON blob
    subscribe_to_notifications_on_signup = Column(Boolean, default=False)
    web_analytics_piwik_id_site = Column(Integer, nullable=True, default=None)
    help_url = Column(String, nullable=True, default=None)
    preferred_locales = Column(String)
    show_help_in_debate_section = Column(Boolean, default=True)

    @property
    def admin_source(self):
        """ Return the admin source for this discussion.  Used by notifications
        Very naive temporary implementation, to be revised with a proper relationship later """
        from .mail import AbstractMailbox
        for source in self.sources:
            if isinstance(source, AbstractMailbox):
                return source
        raise ValueError("No source of type AbstractMailbox found to serve as admin source")


    def read_post_ids(self, user_id):
        from .post import Post
        from .action import ViewPost
        return (x[0] for x in self.db.query(Post.id).join(
            ViewPost
        ).filter(
            Post.discussion_id == self.id,
            ViewPost.actor_id == user_id,
            ViewPost.post_id == Post.id
        ))

    def get_read_posts_ids_preload(self, user_id):
        from .post import Post
        return json.dumps([
            Post.uri_generic(id) for id in self.read_post_ids(user_id)])

    def import_from_sources(self, only_new=True):
        for source in self.sources:
            # refresh after calling
            source = self.db.merge(source)
            assert source != None
            assert source.id
            try:
                source.import_content(only_new=only_new)
            except:
                traceback.print_exc()

    def __init__(self, *args, **kwargs):
        session = kwargs.pop('session', self.default_db)
        super(Discussion, self).__init__(*args, **kwargs)
        # create unless explicitly set to None
        if 'root_idea' in kwargs:
            root_idea = kwargs.get('root_idea')
            if root_idea:
                root_idea.discussion = self
        else:
            from .idea import RootIdea
            self.root_idea = RootIdea(discussion=self)

        if 'table_of_contents' in kwargs:
            table_of_contents = kwargs.get('table_of_contents')
            if table_of_contents:
                table_of_contents.discussion = self
        else:
            from .idea_graph_view import TableOfContents
            self.table_of_contents = TableOfContents(discussion=self)
        if 'next_synthesis' in kwargs:
            next_synthesis = kwargs.get('next_synthesis')
            if next_synthesis:
                next_synthesis.discussion = self
        else:
            from .idea_graph_view import Synthesis
            synthesis = Synthesis(discussion=self)
            session.add(synthesis)
        participant = session.query(Role).filter_by(name=R_PARTICIPANT).one()
        participant_template = UserTemplate(discussion=self, for_role=participant)
        session.add(participant_template)

    def unique_query(self):
        # DiscussionBoundBase is misleading here
        return self.db.query(self.__class__).filter_by(
            slug=self.slug), True

    @property
    def settings_json(self):
        if self.settings:
            return json.loads(self.settings)
        return {}

    @settings_json.setter
    def settings_json(self, val):
        self.settings = json.dumps(val)

    def get_discussion_id(self):
        return self.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.id == discussion_id,)

    def get_next_synthesis(self):
        return self.next_synthesis

    syntheses = relationship('Synthesis')

    next_synthesis = relationship('Synthesis',
        uselist=False, secondary="outerjoin(Synthesis, SynthesisPost)",
        primaryjoin="Discussion.id == Synthesis.discussion_id",
        secondaryjoin='SynthesisPost.id == None',
        viewonly=True)

    def get_last_published_synthesis(self):
        from .idea_graph_view import Synthesis
        return self.db.query(Synthesis).filter(
            Synthesis.discussion_id == self.id and
            Synthesis.published_in_post != None
        ).order_by(Synthesis.published_in_post.creation_date.desc()
                   ).first()

    def get_all_syntheses(self):
        from .idea_graph_view import Synthesis
        return self.db.query(
            Synthesis).options(
            subqueryload_all(
            'idea_assocs.idea'),
            subqueryload_all(
            'idealink_assocs.idea_link'),
            subqueryload_all(
            Synthesis.published_in_post)).filter(
            Synthesis.discussion_id == self.id).all()

    def get_permissions_by_role(self):
        roleperms = self.db.query(Role.name, Permission.name).select_from(
            DiscussionPermission).join(Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id).all()
        roleperms.sort()
        byrole = groupby(roleperms, lambda (r, p): r)
        return {r: [p for (r2, p) in rps] for (r, rps) in byrole}

    def get_roles_by_permission(self):
        permroles = self.db.query(Permission.name, Role.name).select_from(
            DiscussionPermission).join(Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id).all()
        permroles.sort()
        byperm = groupby(permroles, lambda (p, r): p)
        return {p: [r for (p2, r) in prs] for (p, prs) in byperm}

    def get_readers(self):
        session = self.db
        users = session.query(User).join(
            UserRole, Role, DiscussionPermission, Permission).filter(
                DiscussionPermission.discussion_id == self.id and
                Permission.name == P_READ
            ).union(self.db.query(User).join(
                LocalUserRole, Role, DiscussionPermission, Permission).filter(
                    DiscussionPermission.discussion_id == self.id and
                    LocalUserRole.discussion_id == self.id and
                    Permission.name == P_READ)).all()
        if session.query(DiscussionPermission).join(
            Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id and
                Permission.name == P_READ and
                Role.name == Authenticated).first():
            pass  # add a pseudo-authenticated user???
        if session.query(DiscussionPermission).join(
            Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id and
                Permission.name == P_READ and
                Role.name == Everyone).first():
            pass  # add a pseudo-anonymous user?
        return users

    def get_all_agents_preload(self, user=None):
        from assembl.views.api.agent import _get_agents_real
        return json.dumps(_get_agents_real(
            self, user.id if user else Everyone, 'partial'))

    def get_readers_preload(self):
        return json.dumps([user.generic_json('partial') for user in self.get_readers()])

    def get_ideas_preload(self, user_id):
        from assembl.views.api.idea import _get_ideas_real
        return json.dumps(_get_ideas_real(discussion=self, user_id=user_id))

    def get_idea_links(self):
        from .idea import Idea
        return Idea.get_all_idea_links(self.id)

    def get_idea_and_links(self):
        return chain(self.ideas, self.get_idea_links())

    def get_top_ideas(self):
        from .idea import Idea
        return self.db.query(Idea).filter(
            Idea.discussion_id == self.id).filter(
                ~Idea.source_links.any()).all()

    def get_related_extracts_preload(self, user_id):
        from assembl.views.api.extract import _get_extracts_real
        return json.dumps(_get_extracts_real(discussion=self, user_id=user_id))

    def get_user_permissions(self, user_id):
        from ..auth.util import get_permissions
        return get_permissions(user_id, self.id)

    def get_user_permissions_preload(self, user_id):
        return json.dumps(self.get_user_permissions(user_id))

    @property
    def widget_collection_url(self):
        return "/data/Discussion/%d/widgets" % (self.id,)

    # Properties as a route context
    __parent__ = None

    @property
    def __name__(self):
        return self.slug

    @property
    def __acl__(self):
        acls = [(Allow, dp.role.name, dp.permission.name) for dp in self.acls]
        acls.append((Allow, R_SYSADMIN, ALL_PERMISSIONS))
        return acls

    def __repr__(self):
        return "<Discussion %s>" % repr(self.topic)

    def get_notifications(self):
        for widget in self.widgets:
            for n in widget.has_notification():
                yield n

    def get_user_template(self, role_name, autocreate=False):
        template = self.db.query(UserTemplate).join(
            Role).filter(Role.name == role_name).join(
            Discussion).filter(Discussion.id == self.id).first()
        changed = False
        if autocreate and not template:
            # There is a template user per discussion.  If it doesn't exist yet
            # create it.
            from .notification import (
                NotificationCreationOrigin, NotificationSubscriptionFollowSyntheses)
            role = self.db.query(Role).filter_by(name=role_name).one()
            template = UserTemplate(for_role=role, discussion=self)
            self.db.add(template)
            subs, changed = template.get_notification_subscriptions_and_changed()
            self.db.flush()
        return template, changed

    def get_participant_template(self):
        from ..auth import R_PARTICIPANT
        return self.get_user_template(R_PARTICIPANT, True)

    def reset_participant_default_subscriptions(self, force=True):
        template, changed = self.get_participant_template()
        # TODO maparent: This is too slow. I need to preload subscriptions.
        # Consider improving NotificationSubscription.reset_defaults
        if changed or force:
            for participant in self.all_participants:
                participant.get_notification_subscriptions(self.id, True)

    @classmethod
    def extra_collections(cls):
        from assembl.views.traversal import AbstractCollectionDefinition
        from .notification import NotificationSubscription
        class AllUsersCollection(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(AllUsersCollection, self).__init__(cls, User)

            def decorate_query(self, query, last_alias, parent_instance, ctx):
                # No real outerjoin in sqlalchemy. Use a dummy condition.
                return query.outerjoin(self.owner_alias, self.owner_alias.id != None)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                if isinstance(instance, NotificationSubscription):
                    NotificationSubscription.discussion_id = parent_instance.id

            def contains(self, parent_instance, instance):
                return True

        return {'all_users': AllUsersCollection(cls)}

    all_participants = relationship(
        User, viewonly=True, secondary=LocalUserRole.__table__,
        primaryjoin="LocalUserRole.discussion_id == Discussion.id",
        secondaryjoin=((LocalUserRole.user_id == User.id)
            & (LocalUserRole.requested == 0)),
        backref="involved_in_discussion")

    #The list of praticipants actually subscribed to the discussion
    simple_participants = relationship(
        User, viewonly=True,
        secondary=join(LocalUserRole, Role,
            ((LocalUserRole.role_id == Role.id) & (Role.name == R_PARTICIPANT))),
        primaryjoin="LocalUserRole.discussion_id == Discussion.id",
        secondaryjoin=((LocalUserRole.user_id == User.id)
            & (LocalUserRole.requested == 0)),
        backref="participant_in_discussion")

    def get_participants_query(self, ids_only=False, include_readers=False):
        from .auth import AgentProfile, LocalUserRole
        from .generic import Content
        from .post import Post
        from .action import ViewPost
        from .idea_content_link import Extract

        query = self.db.query(AgentProfile.id).join(LocalUserRole,
                LocalUserRole.user_id==AgentProfile.id).filter(
            LocalUserRole.discussion_id == self.id).union(
            self.db.query(AgentProfile.id).join(Post,
                Post.creator_id==AgentProfile.id).filter(
            Post.discussion_id == self.id)).union(
            self.db.query(AgentProfile.id).join(
                Extract, Extract.creator_id==AgentProfile.id).filter(
            Extract.discussion_id == self.id))
        if include_readers:
            query = query.union(
                self.db.query(ViewPost.actor_id).join(
                Content, Content.id==ViewPost.post_id).filter(
                Content.discussion_id==self.id))
        query = query.distinct()
        if ids_only:
            return query
        return self.db.query(AgentProfile).filter(AgentProfile.id.in_(query))

    def get_participants(self, ids_only=False):
        query = self.get_participants_query(ids_only)
        if ids_only:
            return (id for (id,) in query.all())
        return query.all()

    def get_base_url(self):
        """ Abstracted so that we can support virtual hosts or communities in 
        the future and access the urls when we can't rely on pyramid's current
        request (such as when celery generates notifications
        """
        from assembl.lib import config
        port = config.get('public_port')
        portString = (':'+port) if port != 80 else ''
        return 'http://'+config.get('public_hostname')+portString

    def get_url(self):
        from assembl.lib.frontend_urls import FrontendUrls
        frontendUrls = FrontendUrls(self)
        return frontendUrls.get_discussion_url()
    
    crud_permissions = CrudPermissions(
        P_SYSADMIN, P_READ, P_ADMIN_DISC, P_SYSADMIN)

    @property
    def discussion_locales(self):
        # Ordered list, not empty.
        # TODO: Guard. Each locale should be 2-letter or posix.
        # Waiting for utility function.
        if self.preferred_locales:
            return self.preferred_locales.split(' ')
        # Use installation settings otherwise.
        from assembl.lib.config import get_config
        return get_config().get('available_languages', 'fr_CA en_CA').split()

    @discussion_locales.setter
    def discussion_locales(self, locale_list):
        # TODO: Guard.
        self.preferred_locales = ' '.join(locale_list)


def slugify_topic_if_slug_is_empty(discussion, topic, oldvalue, initiator):
    """
    if the target doesn't have a slug, slugify the topic and use that.
    """
    if not discussion.slug:
        discussion.slug = slugify(topic)


event.listen(Discussion.topic, 'set', slugify_topic_if_slug_is_empty)
