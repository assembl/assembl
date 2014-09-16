from itertools import groupby, chain
import traceback
from datetime import datetime

import anyjson as json
from pyramid.security import Allow, ALL_PERMISSIONS
from sqlalchemy import (
    Column,
    Integer,
    Unicode,
    UnicodeText,
    DateTime,
    event,
    and_,
)
from sqlalchemy.orm import relationship

from assembl.lib.utils import slugify
from . import DiscussionBoundBase
from ..semantic.virtuoso_mapping import QuadMapPatternS
from ..auth import (
    P_READ, R_SYSADMIN, P_ADMIN_DISC, Authenticated, Everyone)
from .auth import (
    DiscussionPermission, Role, Permission, User, UserRole, LocalUserRole)
from .action import ViewPost
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

    slug = Column(Unicode, nullable=False, unique=True, index=True)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
                           info={'rdf': QuadMapPatternS(None, DCTERMS.created)})
    objectives = Column(UnicodeText)
    instigator = Column(UnicodeText)
    introduction = Column(UnicodeText)
    introductionDetails = Column(UnicodeText)


    def read_post_ids(self, user_id):
        from .post import Post
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
        from .generic import PostSource
        for source in self.sources:
            # refetch after calling
            source = PostSource.db.merge(source)
            try:
                source.import_content(only_new=only_new)
            except:
                traceback.print_exc()

    def __init__(self, *args, **kwargs):
        super(Discussion, self).__init__(*args, **kwargs)
        root_idea = kwargs.get('root_idea')
        if root_idea:
            root_idea.discussion = this
        else:
            from .idea import RootIdea
            self.root_idea = RootIdea(discussion=self)

        table_of_contents = kwargs.get('table_of_contents')
        if table_of_contents:
            table_of_contents.discussion = this
        else:
            from .idea_graph_view import TableOfContents
            self.table_of_contents = TableOfContents(discussion=self)
        next_synthesis = kwargs.get('next_synthesis')
        if next_synthesis:
            next_synthesis.discussion = this
        else:
            from .idea_graph_view import Synthesis
            synthesis = Synthesis(discussion=self)
            self.db.add(synthesis)

    def serializable(self):
        return {
            "@id": self.uri(),
            "@type": self.external_typename(),
            "topic": self.topic,
            "slug": self.slug,
            "creation_date": self.creation_date.isoformat(),
            "root_idea": self.root_idea.uri()
        }

    def get_discussion_id(self):
        return self.id

    @classmethod
    def get_discussion_condition(cls, discussion_id):
        return cls.id == discussion_id

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
        return self.db().query(Synthesis).filter(
            Synthesis.discussion_id == self.id and
            Synthesis.published_in_post != None
        ).order_by(Synthesis.published_in_post.creation_date.desc()
                   ).first()

    def get_all_syntheses(self):
        from .idea_graph_view import Synthesis
        return self.db().query(Synthesis).filter(
            Synthesis.discussion_id == self.id).all()

    def get_permissions_by_role(self):
        roleperms = self.db().query(Role.name, Permission.name).select_from(
            DiscussionPermission).join(Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id).all()
        roleperms.sort()
        byrole = groupby(roleperms, lambda (r, p): r)
        return {r: [p for (r2, p) in rps] for (r, rps) in byrole}

    def get_roles_by_permission(self):
        permroles = self.db().query(Permission.name, Role.name).select_from(
            DiscussionPermission).join(Role, Permission).filter(
                DiscussionPermission.discussion_id == self.id).all()
        permroles.sort()
        byperm = groupby(permroles, lambda (p, r): p)
        return {p: [r for (p2, r) in prs] for (p, prs) in byperm}

    def get_readers(self):
        session = self.db()
        users = session.query(User).join(
            UserRole, Role, DiscussionPermission, Permission).filter(
                DiscussionPermission.discussion_id == self.id and
                Permission.name == P_READ
            ).union(self.db().query(User).join(
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
        from ..auth.util import user_has_permission
        return json.dumps(_get_agents_real(
            discussion=self,
            include_email=user and user_has_permission(
                self.id, user.id, P_ADMIN_DISC)))

    def get_readers_preload(self):
        return json.dumps([user.serializable() for user in self.get_readers()])

    def get_ideas_preload(self):
        from assembl.views.api.idea import _get_ideas_real
        return json.dumps(_get_ideas_real(discussion=self))

    def get_idea_links(self):
        from .idea import Idea
        return Idea.get_all_idea_links(self.id)

    def get_idea_and_links(self):
        return chain(self.ideas, self.get_idea_links())

    def get_top_ideas(self):
        from .idea import Idea
        return self.db().query(Idea).filter(
            Idea.discussion_id == self.id).filter(
                ~Idea.source_links.any()).all()

    def get_related_extracts_preload(self):
        from assembl.views.api.extract import _get_extracts_real
        return json.dumps(_get_extracts_real(discussion=self))

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


def slugify_topic_if_slug_is_empty(discussion, topic, oldvalue, initiator):
    """
    if the target doesn't have a slug, slugify the topic and use that.
    """
    if not discussion.slug:
        discussion.slug = slugify(topic)


event.listen(Discussion.topic, 'set', slugify_topic_if_slug_is_empty)
