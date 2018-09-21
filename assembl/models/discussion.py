"""Definition of the discussion class."""
import logging
import traceback
from collections import defaultdict
from datetime import datetime
from itertools import chain, groupby

import simplejson as json
from pyramid.httpexceptions import HTTPUnauthorized
from pyramid.path import DottedNameResolver
from pyramid.security import ALL_PERMISSIONS, Allow
from pyramid.settings import asbool
from pyramid.threadlocal import get_current_registry
from sqlalchemy import (Boolean, Column, DateTime, ForeignKey, Integer,
                        UnicodeText, event, func)
from sqlalchemy.orm import (backref, join, relationship, subqueryload,
                            with_polymorphic)
from sqlalchemy.sql.expression import distinct, literal

from assembl.lib.config import get
from assembl.lib.utils import full_class_name, get_global_base_url, slugify

from . import DiscussionBoundBase, NamedClassMixin
from ..auth import (P_ADMIN_DISC, P_READ, P_SYSADMIN, R_PARTICIPANT,
                    R_SYSADMIN, Authenticated, CrudPermissions, Everyone)
from ..lib.discussion_creation import IDiscussionCreationCallback
from ..lib.locale import strip_country
from ..lib.sqla_types import CoerceUnicode, URLString
from .auth import (DiscussionPermission, LocalUserRole, Permission, Role, User,
                   UserRole, UserTemplate)
from .langstrings import LangString
from .preferences import Preferences
from assembl.lib.caching import create_analytics_region

resolver = DottedNameResolver(__package__)
log = logging.getLogger('assembl')
visit_analytics_region = create_analytics_region()


class Discussion(DiscussionBoundBase, NamedClassMixin):
    """
    The context for a specific Assembl discussion.

    Most Assembl entities exist in the scope of a discussion, and inherit from
    :py:class:`assembl.models.DiscussionBoundBase`.
    """
    __tablename__ = "discussion"

    id = Column(Integer, primary_key=True)

    topic = Column(UnicodeText, nullable=False)  # deprecated field that was used as debate title

    title_id = Column(Integer(), ForeignKey(LangString.id))
    title = relationship(
        LangString, lazy="select", single_parent=True, primaryjoin=title_id == LangString.id,
        backref=backref("discussion_from_title", lazy="dynamic"), cascade="all, delete-orphan")

    subtitle_id = Column(Integer(), ForeignKey(LangString.id))
    subtitle = relationship(
        LangString, lazy="select", single_parent=True, primaryjoin=subtitle_id == LangString.id,
        backref=backref("discussion_from_subtitle", lazy="dynamic"), cascade="all, delete-orphan")

    button_label_id = Column(Integer(), ForeignKey(LangString.id))
    button_label = relationship(
        LangString, lazy="select", single_parent=True, primaryjoin=button_label_id == LangString.id,
        backref=backref("discussion_from_button_label", lazy="dynamic"), cascade="all, delete-orphan")

    slug = Column(CoerceUnicode, nullable=False, unique=True, index=True)

    creation_date = Column(DateTime, nullable=False, default=datetime.utcnow)
    objectives = Column(UnicodeText)
    instigator = Column(UnicodeText)
    introduction = Column(UnicodeText)
    introductionDetails = Column(UnicodeText)
    subscribe_to_notifications_on_signup = Column(Boolean, default=True)
    web_analytics_piwik_id_site = Column(Integer, nullable=True, default=None)
    help_url = Column(URLString, nullable=True, default=None)
    logo_url = Column(URLString, nullable=True, default=None)
    homepage_url = Column(URLString, nullable=True, default=None)
    show_help_in_debate_section = Column(Boolean, default=True)
    preferences_id = Column(Integer, ForeignKey(Preferences.id))
    creator_id = Column(Integer, ForeignKey('user.id', ondelete="SET NULL"))

    preferences = relationship(Preferences, backref=backref(
        'discussion'), cascade="all, delete-orphan", single_parent=True)
    creator = relationship('User', backref="discussions_created")

    # resources center
    resources_center_title_id = Column(
        Integer(), ForeignKey(LangString.id))
    resources_center_title = relationship(
        LangString,
        lazy="select", single_parent=True,
        primaryjoin=resources_center_title_id == LangString.id,
        backref=backref(
            "discussion_from_resources_center_title", lazy="dynamic"),
        cascade="all, delete-orphan")

    terms_and_conditions_id = Column(Integer(), ForeignKey(LangString.id))
    terms_and_conditions = relationship(
        LangString, lazy="select", single_parent=True, primaryjoin=terms_and_conditions_id == LangString.id,
        backref=backref("discussion_from_terms_and_conditions", lazy="dynamic"), cascade="all, delete-orphan")

    legal_notice_id = Column(Integer(), ForeignKey(LangString.id))
    legal_notice = relationship(
        LangString, lazy="select", single_parent=True, primaryjoin=legal_notice_id == LangString.id,
        backref=backref("discussion_from_legal_notice", lazy="dynamic"), cascade="all, delete-orphan")

    cookies_policy_id = Column(Integer(), ForeignKey(LangString.id))
    cookies_policy = relationship(
        LangString, lazy="select", single_parent=True, primaryjoin=cookies_policy_id == LangString.id,
        backref=backref("discussion_from_cookies_policy", lazy="dynamic"), cascade="all, delete-orphan")

    privacy_policy_id = Column(Integer(), ForeignKey(LangString.id))
    privacy_policy = relationship(
        LangString, lazy="select", single_parent=True, primaryjoin=privacy_policy_id == LangString.id,
        backref=backref("discussion_from_privacy_policy", lazy="dynamic"), cascade="all, delete-orphan")

    user_guidelines_id = Column(Integer(), ForeignKey(LangString.id))
    user_guidelines = relationship(
        LangString, lazy="select", single_parent=True, primaryjoin=user_guidelines_id == LangString.id,
        backref=backref("discussion_from_user_guidelines", lazy="dynamic"), cascade="all, delete-orphan")

    @classmethod
    def get_naming_column_name(cls):
        return "slug"

    @property
    def admin_source(self):
        """ Return the admin source for this discussion.  Used by notifications
        Very naive temporary implementation, to be revised with a proper relationship later """
        from .mail import AbstractMailbox
        for source in self.sources:
            if isinstance(source, AbstractMailbox):
                return source
        raise ValueError(
            "No source of type AbstractMailbox found to serve as admin source")

    def check_url_or_none(self, url):
        if url == '':
            url = None
        if url is not None:
            from urlparse import urlparse
            parsed_url = urlparse(url)
            from pyramid.httpexceptions import HTTPBadRequest
            if not parsed_url.scheme:
                raise HTTPBadRequest(
                    "The homepage url does not have a scheme. Must be either http or https"
                )

            if parsed_url.scheme not in (u'http', u'https'):
                raise HTTPBadRequest(
                    "The url has an incorrect scheme. Only http and https are accepted for homepage url"
                )
        return url

    @property
    def homepage(self):
        return self.homepage_url

    @property
    def require_secure_connection(self):
        return asbool(get('require_secure_connection'))

    @homepage.setter
    def homepage(self, url):
        url = self.check_url_or_none(url)
        self.homepage_url = url

    @property
    def favicon(self):
        from .attachment import AttachmentPurpose
        from ..graphql.utils import get_attachment_with_purpose
        attachment = get_attachment_with_purpose(
            self.attachments, AttachmentPurpose.FAVICON.value)
        return attachment and attachment.document

    @property
    def logo(self):
        return self.logo_url

    @logo.setter
    def logo(self, url):
        url = self.check_url_or_none(url)
        self.logo_url = url

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
            assert source is not None
            assert source.id
            try:
                source.import_content(only_new=only_new)
            except Exception:
                traceback.print_exc()

    def __init__(self, session=None, *args, **kwargs):
        session = session or self.default_db

        # TODO: Validate slug
        kwargs['preferences'] = preferences = Preferences(
            name='discussion_' + kwargs.get('slug', str(id(self))),
            cascade_preferences=Preferences.get_default_preferences(session))
        session.add(preferences)
        session.flush()

        root_idea = kwargs.get('root_idea', None)
        table_of_contents = kwargs.get('table_of_contents', None)
        next_synthesis = kwargs.get('next_synthesis', None)
        # create unless explicitly set to None

        if root_idea is None:
            from .idea import RootIdea
            kwargs['root_idea'] = RootIdea(discussion=self)
        else:
            root_idea.discussion = self
        if table_of_contents is None:
            from .idea_graph_view import TableOfContents
            kwargs['table_of_contents'] = TableOfContents(discussion=self)
        else:
            table_of_contents.discussion = self
        if next_synthesis is None:
            from .idea_graph_view import Synthesis
            kwargs['next_synthesis'] = Synthesis(discussion=self)
        else:
            next_synthesis.discussion = self

        super(Discussion, self).__init__(*args, **kwargs)
        if root_idea is None:
            session.add(kwargs['root_idea'])
        if table_of_contents is None:
            session.add(kwargs['table_of_contents'])
        if next_synthesis is None:
            session.add(kwargs['next_synthesis'])

        participant = session.query(Role).filter_by(name=R_PARTICIPANT).one()
        participant_template = UserTemplate(
            discussion=self, for_role=participant)
        # Precreate notification subscriptions
        participant_template.get_notification_subscriptions_and_changed(False)
        session.add(participant_template)

    def unique_query(self):
        # DiscussionBoundBase is misleading here
        return self.db.query(self.__class__).filter_by(
            slug=self.slug), True

    @property
    def settings_json(self):
        if not self.preferences:
            return Preferences.property_defaults
        return self.preferences.values_json

    def get_discussion_id(self):
        return self.id

    @classmethod
    def get_discussion_conditions(cls, discussion_id, alias_maker=None):
        return (cls.id == discussion_id,)

    def get_next_synthesis_id(self):
        from .idea_graph_view import Synthesis
        from .post import SynthesisPost
        return self.db.query(Synthesis.id).outerjoin(
            SynthesisPost).filter(
            Synthesis.discussion_id == self.id,
            SynthesisPost.id == None).first()  # noqa: E711

    def get_next_synthesis(self, full_data=True):
        from .idea_graph_view import Synthesis
        id = self.get_next_synthesis_id()
        query = self.db.query(Synthesis).filter_by(id=id)
        if full_data:
            query = query.options(
                subqueryload('idea_assocs').joinedload(
                    'idea').joinedload('title').joinedload('entries'),
                subqueryload('idea_assocs').joinedload('idea').joinedload(
                    'synthesis_title').joinedload('entries'),
                subqueryload('idea_assocs').joinedload('idea').joinedload(
                    'description').joinedload('entries'),
                subqueryload('idea_assocs').joinedload(
                    'idea').subqueryload('widget_links'),
                subqueryload('idea_assocs').joinedload('idea').subqueryload(
                    'attachments').joinedload('document'),
                subqueryload('idea_assocs').joinedload(
                    'idea').subqueryload('message_columns'),
                subqueryload('idea_assocs').joinedload(
                    'idea').joinedload('source_links'),
                subqueryload('idealink_assocs').joinedload('idea_link'),
                subqueryload(Synthesis.published_in_post)
            )
        else:
            query = query.options(
                subqueryload('idea_assocs'),
                subqueryload('idealink_assocs'),
            )
        return query.first()

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
            Synthesis.published_in_post != None  # noqa: E711
        ).options(
            subqueryload('idea_assocs').joinedload(
                'idea').joinedload('title').subqueryload('entries'),
            subqueryload('idea_assocs').joinedload('idea').joinedload(
                'synthesis_title').subqueryload('entries'),
            subqueryload('idea_assocs').joinedload('idea').joinedload(
                'description').subqueryload('entries'),
            subqueryload('idea_assocs').joinedload(
                'idea').subqueryload('widget_links'),
            subqueryload('idea_assocs').joinedload('idea').subqueryload(
                'attachments').joinedload('document'),
            subqueryload('idea_assocs').joinedload(
                'idea').subqueryload('message_columns'),
            subqueryload('idea_assocs').joinedload(
                'idea').joinedload('source_links'),
            subqueryload('idealink_assocs').joinedload('idea_link'),
            subqueryload(Synthesis.published_in_post)
        ).order_by(
            Synthesis.published_in_post.creation_date.desc()
        ).first()

    # returns a list of published and non-deleted syntheses, as well as the draft of the not yet published synthesis
    def get_all_syntheses_query(self, include_unpublished=True, include_tombstones=False):
        from .idea_graph_view import Synthesis
        from .post import SynthesisPost, PublicationStates
        condition = SynthesisPost.publication_state == PublicationStates.PUBLISHED
        if not include_tombstones:
            condition = condition & SynthesisPost.tombstone_condition()
        if include_unpublished:
            condition = condition | (SynthesisPost.id == None)  # noqa: E711
        return self.db.query(
            Synthesis).outerjoin(SynthesisPost
                                 ).options(
                subqueryload('subject').subqueryload('entries'),
                subqueryload('introduction').subqueryload('entries'),
                subqueryload('conclusion').subqueryload('entries'),
                subqueryload('idea_assocs').joinedload(
                    'idea').joinedload('title').subqueryload('entries'),
                subqueryload('idea_assocs').joinedload('idea').joinedload(
                    'synthesis_title').subqueryload('entries'),
                subqueryload('idea_assocs').joinedload('idea').joinedload(
                    'description').subqueryload('entries'),
                subqueryload('idea_assocs').joinedload(
                    'idea').subqueryload('widget_links'),
                subqueryload('idea_assocs').joinedload('idea').subqueryload(
                    'attachments').joinedload('document'),
                subqueryload('idea_assocs').joinedload(
                    'idea').subqueryload('message_columns'),
                subqueryload('idea_assocs').joinedload(
                    'idea').joinedload('source_links'),
                subqueryload('idealink_assocs').joinedload('idea_link'),
                subqueryload(Synthesis.published_in_post)
        ).filter(Synthesis.discussion_id == self.id, condition)

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

    def get_base_url(self, require_secure=None):
        """Get the base URL of this server

        Tied to discussion so that we can support virtual hosts or
        communities in the future and access the urls when we can't rely
        on pyramid's current request (such as when celery generates
        notifications)
        Temporarily equivalent to get_global_base_url
        """
        return get_global_base_url(require_secure)

    def get_discussion_urls(self):
        discussion_url_http = self.get_base_url(False) + "/" + self.slug
        discussion_url_https = self.get_base_url(True) + "/" + self.slug
        discussion_urls = [discussion_url_http]
        if discussion_url_https != discussion_url_http:
            discussion_urls.append(discussion_url_https)
        return discussion_urls

    def check_email(self, email):
        require_email_domain = self.preferences['require_email_domain']
        if not email or '@' not in email:
            return False
        if require_email_domain:
            email = email.split('@', 1)[-1]
            if email.lower() in require_email_domain:
                return True
        return False

    def check_authorized_email(self, user):
        # Check if the user has a verified email from a required domain
        from .social_auth import SocialAuthAccount
        require_email_domain = self.preferences['require_email_domain']
        autologin_backend = self.preferences['authorization_server_backend']
        if not (require_email_domain or autologin_backend):
            return True
        for account in user.accounts:
            if not account.verified:
                continue
            # Note that this allows an account which is either from the SSO
            # OR from an allowed domain, if any. In most cases, only one
            # validation mechanism will be defined.
            email = account.email
            email_check = self.check_email(email)
            if not email_check:
                continue
            else:
                return True
            if autologin_backend:
                if isinstance(account, SocialAuthAccount):
                    if account.provider_with_idp == autologin_backend:
                        return True
        return False

    def get_admin_emails(self):
        """Return a list or tuple of discussion administrator emails set for the discussion"""

        admin_emails = self.preferences['discussion_administrators']
        if admin_emails:
            return admin_emails
        # If no discussion admin is set, use the server administrator
        # This field MUST be set, else Assembl will throw error at startup
        return (get('assembl.admin_email'),)

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
        r = super(Discussion, self).__repr__()
        return r[:-1] + self.slug + ">"

    def get_notifications(self):
        for widget in self.widgets:
            for n in widget.has_notification():
                yield n

    def get_user_template(self, role_name, autocreate=False, on_thread=True):
        template = self.db.query(UserTemplate).join(
            Role).filter(Role.name == role_name).join(
            Discussion, UserTemplate.discussion).filter(
            Discussion.id == self.id).first()
        changed = False
        if autocreate and not template:
            # There is a template user per discussion.  If it doesn't exist yet
            # create it.
            role = self.db.query(Role).filter_by(name=role_name).one()
            template = UserTemplate(for_role=role, discussion=self)
            self.db.add(template)
            subs, changed = template.get_notification_subscriptions_and_changed(
                on_thread)
            self.db.flush()
        return template, changed

    def get_participant_template(self, on_thread=True):
        from ..auth import R_PARTICIPANT
        return self.get_user_template(R_PARTICIPANT, True, on_thread)

    def reset_notification_subscriptions_from_defaults(self, force=True):
        """Reset all notification subscriptions for this discussion"""
        from .notification import NotificationSubscriptionStatus
        template, changed = self.get_participant_template()
        roles_subscribed = defaultdict(list)
        for template in self.user_templates:
            template_subscriptions, changed2 = template.get_notification_subscriptions_and_changed()
            changed |= changed2
            for subscription in template_subscriptions:
                if subscription.status == NotificationSubscriptionStatus.ACTIVE:
                    roles_subscribed[subscription.__class__].append(
                        template.role_id)
        if force or changed:
            needed_classes = UserTemplate.get_applicable_notification_subscriptions_classes()
            for notif_cls in needed_classes:
                self.reset_notification_subscriptions_for(
                    notif_cls, roles_subscribed[notif_cls])

    def reset_notification_subscriptions_for(self, notif_cls, roles_subscribed):
        from .notification import (
            NotificationSubscription, NotificationSubscriptionStatus,
            NotificationCreationOrigin)
        from .auth import AgentStatusInDiscussion
        # Make most subscriptions inactive (simpler than deciding which ones should be)
        default_ns = self.db.query(notif_cls.id
                                   ).join(User, notif_cls.user_id == User.id
                                          ).join(LocalUserRole, LocalUserRole.user_id == User.id
                                                 ).join(AgentStatusInDiscussion,
                                                        AgentStatusInDiscussion.profile_id == User.id
                                                        ).filter(
            LocalUserRole.discussion_id == self.id,
            AgentStatusInDiscussion.discussion_id == self.id,
            AgentStatusInDiscussion.last_visit != None,  # noqa: E711
            notif_cls.discussion_id == self.id,
            notif_cls.creation_origin == NotificationCreationOrigin.DISCUSSION_DEFAULT)
        deactivated = default_ns.filter(
            notif_cls.status == NotificationSubscriptionStatus.ACTIVE)
        if roles_subscribed:
            # Make some subscriptions active (back)
            activated = default_ns.filter(
                LocalUserRole.role_id.in_(roles_subscribed),
                notif_cls.status == NotificationSubscriptionStatus.INACTIVE_DFT)
            self.db.query(notif_cls
                          ).filter(notif_cls.id.in_(activated.subquery())
                                   ).update(
                {"status": NotificationSubscriptionStatus.ACTIVE,
                 "last_status_change_date": datetime.utcnow()},
                synchronize_session=False)
            # Materialize missing subscriptions
            missing_subscriptions_query = self.db.query(
                User.id).join(
                    LocalUserRole, LocalUserRole.user_id == User.id
                ).join(AgentStatusInDiscussion, AgentStatusInDiscussion.profile_id == User.id
                ).outerjoin(notif_cls, (notif_cls.user_id == User.id) & (notif_cls.discussion_id == self.id)
            ).filter(
                LocalUserRole.discussion_id == self.id,
                AgentStatusInDiscussion.discussion_id == self.id,
                AgentStatusInDiscussion.last_visit != None,  # noqa: E711
                LocalUserRole.role_id.in_(roles_subscribed),
                notif_cls.id == None).distinct()

            def missing_subscriptions_gen():
                return [
                    notif_cls(
                        discussion_id=self.id,
                        user_id=user_id,
                        creation_origin=NotificationCreationOrigin.DISCUSSION_DEFAULT,
                        status=NotificationSubscriptionStatus.ACTIVE)
                    for (user_id,) in missing_subscriptions_query]

            self.locked_object_creation(
                missing_subscriptions_gen, NotificationSubscription, 10)
            # exclude from deactivated query
            deactivated = deactivated.except_(
                default_ns.filter(
                    LocalUserRole.role_id.in_(roles_subscribed)))
        self.db.query(notif_cls
                      ).filter(notif_cls.id.in_(deactivated.subquery())
                               ).update(
            {"status": NotificationSubscriptionStatus.INACTIVE_DFT,
             "last_status_change_date": datetime.utcnow()},
            synchronize_session=False)

        # Should we send them to the socket? We do not at this point.
        # changed = deactivated_ids + activated_ids
        # changed = self.db.query(NotificationSubscription).filter(
        #     NotificationSubscription.id.in_(changed))
        # for ns in changed:
        #     ns.send_to_changes(discussion_id=self.id)

    def invoke_callbacks_after_creation(self, callbacks=None):
        reg = get_current_registry()
        # If any of these callbacks throws an exception, the database
        # transaction fails and so the Discussion object will not
        # be added to the database (Discussion is not created).
        known_callbacks = reg.getUtilitiesFor(IDiscussionCreationCallback)
        if callbacks is not None:
            known_callbacks = {
                k: v for (k, v) in known_callbacks.iteritems() if k in callbacks}
        for name, callback in known_callbacks:
            callback.discussionCreated(self)

    @classmethod
    def extra_collections(cls):
        from assembl.views.traversal import (
            CollectionDefinition, AbstractCollectionDefinition)
        from .notification import NotificationSubscription
        from ..views.traversal import (
            UserNsDictCollection, DiscussionPreferenceCollection)

        class AllUsersCollection(AbstractCollectionDefinition):
            def __init__(self, cls):
                super(AllUsersCollection, self).__init__(cls, User)

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                from ..auth.util import get_current_user_id
                try:
                    current_user = get_current_user_id()
                except RuntimeError:
                    current_user = None
                participants = parent_instance.get_participants_query(
                    True, False, current_user).subquery()
                return query.join(
                    owner_alias, last_alias.id.in_(participants))

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id,
                    ctx, kwargs):
                if isinstance(instance, NotificationSubscription):
                    instance.discussion_id = parent_instance.id

            def contains(self, parent_instance, instance):
                from ..auth.util import get_current_user_id
                try:
                    current_user = get_current_user_id()
                    # shortcut
                    if instance.id == current_user:
                        return True
                except RuntimeError:
                    pass
                participants = parent_instance.get_participants_query(True)
                return parent_instance.db.query(
                    literal(instance.id).in_(participants.subquery())).first()[0]

            def get_instance(self, key, parent_instance):
                if key == 'current':
                    from ..auth.util import get_current_user_id
                    try:
                        key = get_current_user_id()
                    except RuntimeError:
                        raise HTTPUnauthorized()
                return super(AllUsersCollection, self).get_instance(
                    key, parent_instance)

        class ActiveWidgetsCollection(CollectionDefinition):

            def __init__(self, cls):
                super(ActiveWidgetsCollection, self).__init__(
                    cls, Discussion.widgets)

            def decorate_query(self, query, owner_alias, last_alias, parent_instance, ctx):
                from .widgets import Widget
                query = super(ActiveWidgetsCollection, self).decorate_query(
                    query, owner_alias, last_alias, parent_instance, ctx)
                query = Widget.filter_active(query)
                return query

            def contains(self, parent_instance, instance):
                return instance.is_active() and super(
                    ActiveWidgetsCollection, self).contains(
                    parent_instance, instance)

        class SourcesCollection(CollectionDefinition):
            def __init__(self, cls):
                super(SourcesCollection, self).__init__(
                    cls, cls.sources)

            def decorate_instance(
                    self, instance, parent_instance, assocs, user_id, ctx,
                    kwargs):

                super(SourcesCollection, self).decorate_instance(
                    instance, parent_instance, assocs, user_id, ctx, kwargs)

                from .generic import Content, ContentSourceIDs
                from .facebook_integration import FacebookGenericSource

                for inst in assocs[:]:
                    if isinstance(inst, FacebookGenericSource):
                        if 'is_content_sink' in kwargs:
                            is_sink = kwargs.get('is_content_sink', None)
                            data = kwargs.get('sink_data', None)
                            if is_sink:
                                if not data:
                                    raise ValueError(
                                        "User must pass sink data")
                                post_id = data.get('post_id', None)
                                fb_post_id = data.get('facebook_post_id', None)
                                source = instance
                                if not post_id:
                                    raise ValueError(
                                        "Could not create content because of "
                                        "improper data input")
                                else:
                                    try:
                                        post_object = Content.\
                                            get_instance(post_id)
                                        cs = ContentSourceIDs(source=source,
                                                              post=post_object,
                                                              message_id_in_source=fb_post_id)
                                        assocs.append(cs)
                                    except Exception:
                                        raise ValueError(
                                            "Failed on content sink transaction")

        return {'all_users': AllUsersCollection(cls),
                'active_widgets': ActiveWidgetsCollection(cls),
                'sources': SourcesCollection(cls),
                'user_ns_kv': UserNsDictCollection(cls),
                'settings': DiscussionPreferenceCollection(cls)}

    all_participants = relationship(
        User, viewonly=True, secondary=LocalUserRole.__table__,
        primaryjoin="LocalUserRole.discussion_id == Discussion.id",
        secondaryjoin=((LocalUserRole.user_id == User.id) & (LocalUserRole.requested == False)),  # noqa: E712
        backref="involved_in_discussion")

    # The list of praticipants actually subscribed to the discussion
    simple_participants = relationship(
        User, viewonly=True,
        secondary=join(LocalUserRole, Role,
                       ((LocalUserRole.role_id == Role.id) & (Role.name == R_PARTICIPANT))),
        primaryjoin="LocalUserRole.discussion_id == Discussion.id",
        secondaryjoin=((LocalUserRole.user_id == User.id) & (LocalUserRole.requested == False)),  # noqa: E712
        backref="participant_in_discussion")

    def current_discussion_phase(self):
        now = datetime.now()
        for phase in self.timeline_phases:
            if phase.start <= now <= (phase.end or now):
                return phase

    def get_participants_query(self, ids_only=False, include_readers=False, current_user=None):
        from .auth import AgentProfile, LocalUserRole
        from .generic import Content
        from .post import Post
        from .action import ViewPost
        from .idea_content_link import Extract
        from .announcement import Announcement
        from .attachment import Attachment
        post = with_polymorphic(Post, [Post])
        attachment = with_polymorphic(Attachment, [Attachment])
        extract = with_polymorphic(Extract, [Extract])
        db = self.db
        queries = [
            db.query(LocalUserRole.user_id.label('user_id')).filter(
                LocalUserRole.discussion_id == self.id),
            db.query(post.creator_id.label('user_id')).filter(
                post.discussion_id == self.id),
            db.query(extract.creator_id.label('user_id')).filter(
                extract.discussion_id == self.id),
            db.query(extract.owner_id.label('user_id')).filter(
                extract.discussion_id == self.id),
            db.query(Announcement.creator_id.label('user_id')).filter(
                Announcement.discussion_id == self.id),
            db.query(attachment.creator_id.label('user_id')).filter(
                attachment.discussion_id == self.id),
            db.query(UserRole.user_id.label('user_id')),
        ]
        if self.creator_id is not None:
            queries.append(db.query(literal(self.creator_id).label('user_id')))
        if current_user is not None:
            queries.append(db.query(literal(current_user).label('user_id')))
        if include_readers:
            queries.append(db.query(ViewPost.actor_id.label('user_id')).join(
                Content, Content.id == ViewPost.post_id).filter(
                Content.discussion_id == self.id))
        query = queries[0].union(*queries[1:]).distinct()
        if ids_only:
            return query
        return db.query(AgentProfile).filter(AgentProfile.id.in_(query))

    def get_participants(self, ids_only=False):
        query = self.get_participants_query(ids_only)
        if ids_only:
            return (id for (id,) in query.all())
        return query.all()

    def get_url(self, request=None):
        from assembl.lib.frontend_urls import FrontendUrls
        frontendUrls = FrontendUrls(self)
        return frontendUrls.get_discussion_url(request)

    @property
    def creator_name(self):
        if self.creator:
            return self.creator.name

    @property
    def creator_email(self):
        if self.creator:
            return self.creator.get_preferred_email()

    def count_contributions_per_agent(
            self, start_date=None, end_date=None, as_agent=True):
        from .post import Post
        from .auth import AgentProfile
        query = self.db.query(
            func.count(Post.id), Post.creator_id).filter(
                Post.discussion_id == self.id,
                Post.tombstone_condition())
        if start_date:
            query = query.filter(Post.creation_date >= start_date)
        if end_date:
            query = query.filter(Post.creation_date < end_date)
        query = query.group_by(Post.creator_id)
        results = query.all()
        # from highest to lowest
        results.sort(reverse=True)
        if not as_agent:
            return [(id, count) for (count, id) in results]
        agent_ids = [ag for (c, ag) in results]
        agents = self.db.query(AgentProfile).filter(
            AgentProfile.id.in_(agent_ids))
        agents_by_id = {ag.id: ag for ag in agents}
        return [(agents_by_id[id], count) for (count, id) in results]

    def count_new_visitors(
            self, start_date=None, end_date=None, as_agent=True):
        from .auth import AgentStatusInDiscussion
        query = self.db.query(
            func.count(AgentStatusInDiscussion.id)).filter_by(
            discussion_id=self.id)
        if start_date:
            query = query.filter(
                AgentStatusInDiscussion.first_visit >= start_date)
        if end_date:
            query = query.filter(
                AgentStatusInDiscussion.first_visit < end_date)
        return query.first()[0]

    def count_post_viewers(
            self, start_date=None, end_date=None, as_agent=True):
        from .post import Post
        from .action import ViewPost
        query = self.db.query(
            func.count(distinct(ViewPost.actor_id))).join(Post).filter(
                Post.discussion_id == self.id)
        if start_date:
            query = query.filter(ViewPost.creation_date >= start_date)
        if end_date:
            query = query.filter(ViewPost.creation_date < end_date)
        return query.first()[0]

    crud_permissions = CrudPermissions(
        P_SYSADMIN, P_READ, P_ADMIN_DISC, P_SYSADMIN)

    @property
    def discussion_locales(self):
        # Ordered list, not empty.
        # TODO: Guard. Each locale should be 2-letter or posix.
        # Waiting for utility function.
        locales = self.preferences['preferred_locales']
        if locales:
            return locales
        # Use installation settings otherwise.
        return [strip_country(l) for l in get(
            'available_languages', 'fr en').split()]

    @discussion_locales.setter
    def discussion_locales(self, locale_list):
        # TODO: Guard.
        self.preferences['preferred_locales'] = locale_list

    # class cache, indexed by discussion id
    _discussion_services = {}

    @property
    def translation_service_class(self):
        return self.preferences["translation_service"]

    def translation_service(self):
        service_class = (self.translation_service_class or
                         "assembl.nlp.translation_service.LanguageIdentificationService")
        service = self._discussion_services.get(self.id, None)
        if service and full_class_name(service) != service_class:
            service = None
        if service is None:
            try:
                if service_class:
                    service = resolver.resolve(service_class)(self)
            except RuntimeError:
                from assembl.nlp.translation_service import \
                    LanguageIdentificationService
                service = LanguageIdentificationService(self)
            self._discussion_services[self.id] = service
        return service

    def remove_translations(self):
        # For testing purposes
        for post in self.posts:
            post.remove_translations()

    @property
    def main_locale(self):
        return self.discussion_locales[0]

    def compose_external_uri(self, *args, **kwargs):
        """
        :use_api2 - uses API2 URL path
        pass as many nodes you want in the args
        """
        composer = ""
        base = self.get_base_url()
        if kwargs.get('use_api2', True):
            base += "/data/"
        else:
            base += "/"
        uri = self.uri(base_uri=base)
        composer += uri
        for arg in args:
            if arg:
                composer += "/%s" % arg
        return composer

    def get_dates_in_discussion_life_bounds(self, start_date=None, end_date=None, force_bounds=False):
        """
        @parameter start_date: string
        @parameter end_date: string
        """
        from datetime import datetime
        from assembl.lib.parsedatetime import parse_datetime

        start = start_date
        end = end_date
        discussion = self

        if start:
            start = parse_datetime(start)
            if force_bounds and start:
                discussion_lower_bound = discussion.creation_date
                if start < discussion_lower_bound:
                    start = discussion_lower_bound
        else:
            start = discussion.creation_date
        if end:
            end = parse_datetime(end)
            if force_bounds and end:
                if end < start:
                    end = start
                discussion_upper_bound = datetime.now()
                if end > discussion_upper_bound:
                    end = discussion_upper_bound
        else:
            end = datetime.now()
        return (start, end)

    def generate_redis_key(namespace, fn):
        fname = fn.__name__

        def generate_key(*args):
            return fname + "_" + str(args[0].id) + "_" + "_".join(str(s) for s in args[1:])

        return generate_key

    @visit_analytics_region.cache_on_arguments(function_key_generator=generate_redis_key)
    def get_visits_time_series_analytics(self, start_date=None, end_date=None, only_fields=None):
        """
        Fetches visits analytics from bound piwik site.
        Optional parameters `start` and `end` are dates like "2017-11-21" (default dates are from discussion creation date to today as default).
        @parameter start_date: string
        @parameter end_date: string
        """
        from assembl.lib.piwik import (
            piwik_VisitsSummary_getSumVisitsLength,
            piwik_Actions_get
        )

        start, end = self.get_dates_in_discussion_life_bounds(start_date, end_date, force_bounds=True)
        discussion = self
        piwik_id_site = discussion.web_analytics_piwik_id_site
        if not piwik_id_site:
            raise ValueError("This discussion is not bound to a Piwik site")

        piwik_url = get('web_analytics_piwik_url')
        piwik_api_token = get('web_analytics_piwik_api_token')
        missing_variables = []
        if not piwik_url:
            missing_variables.append("piwik_url")
        if not piwik_api_token:
            missing_variables.append("piwik_api_token")
        if len(missing_variables):
            raise ValueError("This Assembl server is not bound to a Piwik server. Missing configuration variables: " + ", ".join(missing_variables))

        def date_to_piwik_date(date):
            return date.strftime('%Y-%m-%d')

        period = "range"
        date = ",".join([date_to_piwik_date(start), date_to_piwik_date(end)])

        # For debates with lots of visitors we will probably want to cache piwik responses, using redis for example.
        if only_fields:
            should_query_visits_length = False
            should_query_actions = False
            result = {}
            if "sum_visits_length" in only_fields:
                should_query_visits_length = True
            if "nb_uniq_pageviews" in only_fields or "nb_pageviews" in only_fields:
                should_query_actions = True
            if should_query_visits_length:
                sum_visits_length = None
                try:
                    sum_visits_length = piwik_VisitsSummary_getSumVisitsLength(piwik_url, piwik_api_token, piwik_id_site, period, date)
                except:
                    raise ValueError("Analytics server responded with an error")
                result["sum_visits_length"] = sum_visits_length
            if should_query_actions:
                actions = None
                try:
                    actions = piwik_Actions_get(piwik_url, piwik_api_token, piwik_id_site, period, date)
                except:
                    raise ValueError("Analytics server responded with an error")
                if "nb_uniq_pageviews" not in actions or "nb_pageviews" not in actions:
                    raise ValueError("Analytics server responded with a malformed response")
                result["nb_uniq_pageviews"] = actions["nb_uniq_pageviews"]
                result["nb_pageviews"] = actions["nb_pageviews"]
            return result
        else:
            try:
                sum_visits_length = piwik_VisitsSummary_getSumVisitsLength(piwik_url, piwik_api_token, piwik_id_site, period, date)
            except:
                raise ValueError("Analytics server responded with an error")

            try:
                actions = piwik_Actions_get(piwik_url, piwik_api_token, piwik_id_site, period, date)
            except:
                raise ValueError("Analytics server responded with an error")

            if "nb_uniq_pageviews" not in actions or "nb_pageviews" not in actions:
                raise ValueError("Analytics server responded with a malformed response")

            return {
                "sum_visits_length": sum_visits_length,
                "nb_uniq_pageviews": actions["nb_uniq_pageviews"],
                "nb_pageviews": actions["nb_pageviews"],
            }


def slugify_topic_if_slug_is_empty(discussion, topic, oldvalue, initiator):
    """
    if the target doesn't have a slug, slugify the topic and use that.
    """
    if not discussion.slug:
        discussion.slug = slugify(topic)


event.listen(Discussion.topic, 'set', slugify_topic_if_slug_is_empty)
LangString.setup_ownership_load_event(Discussion, [
    'resources_center_title', 'terms_and_conditions', 'legal_notice', 'cookies_policy', 'privacy_policy', 'user_guidelines', 'title', 'subtitle', 'button_label'])
