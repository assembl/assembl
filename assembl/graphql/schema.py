import graphene
# from graphene_sqlalchemy import SQLAlchemyObjectType
from assembl.models import Discussion as DiscussionModel
from assembl.models import User as UserModel


class Discussion(graphene.ObjectType):

    id = graphene.id
    topic = graphene.String()
    slug = graphene.String()

    creation_date = graphene.datetime()

    help_url = graphene.String()
    logo_url = graphene.String()
    homepage_url = graphene.String()
    creator = graphene.ObjectType()
    piwik_id = graphene.Integer()
    introduction = graphene.String()
    subscribe_to_notifications = graphene.Boolean()

    # id = Column(Integer, primary_key=True,
    #             info={'rdf': QuadMapPatternS(None, ASSEMBL.db_id)})

    # topic = Column(UnicodeText, nullable=False,
    #                info={'rdf': QuadMapPatternS(None, DCTERMS.title)})

    # slug = Column(CoerceUnicode, nullable=False, unique=True, index=True)

    # creation_date = Column(DateTime, nullable=False, default=datetime.utcnow,
    #                        info={'rdf': QuadMapPatternS(None, DCTERMS.created)})
    # objectives = Column(UnicodeText)
    # instigator = Column(UnicodeText)
    # introduction = Column(UnicodeText)
    # introductionDetails = Column(UnicodeText)
    # subscribe_to_notifications_on_signup = Column(Boolean, default=True)
    # web_analytics_piwik_id_site = Column(Integer, nullable=True, default=None)
    # help_url = Column(URLString, nullable=True, default=None)
    # logo_url = Column(URLString, nullable=True, default=None)
    # homepage_url = Column(URLString, nullable=True, default=None)
    # show_help_in_debate_section = Column(Boolean, default=True)
    # preferences_id = Column(Integer, ForeignKey(Preferences.id))
    # creator_id = Column(Integer, ForeignKey('user.id', ondelete="SET NULL"))

    # preferences = relationship(Preferences, backref=backref(
    #     'discussion'), cascade="all, delete-orphan", single_parent=True)
    # creator = relationship('User', backref="discussions_created")


class Query(graphene.ObjectType):
    discussion = graphene.String()

    def resolve_discussion(self, args, context, info):
        return 'world'


schema = graphene.Schema(query=Query)
