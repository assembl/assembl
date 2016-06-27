"""Import JSON-LD into assembl."""
import simplejson as json
from rdflib_jsonld.context import Context
from . import (context_url, local_context_loc)
from assembl.models.import_records import ImportRecordHandler
from assembl.lib.sqla import get_named_class

class_equivalents = {
    "AbstractionStatement": "IdeaLink",
    "Agent": "AgentProfile",
    "Argument": "Idea",
    "Argument": "Idea",
    "ArgumentApplication": "IdeaLink",
    "ArgumentOpposesIdea": "IdeaLink",
    "ArgumentSupportsIdea": "IdeaLink",
    "CausalInference": "IdeaLink",
    "CausalStatement": "IdeaLink",
    "ComparisonStatement": "IdeaLink",
    "ContextOfExpression": "IdeaLink",
    "Conversation": "Discussion",
    "Criterion": "Idea",
    "CriterionApplication": "IdeaLink",
    "Decision": "Idea",
    "DirectedIdeaRelation": "IdeaLink",
    "DistinctionStatement": "IdeaLink",
    "EquivalenceStatement": "IdeaLink",
    "Excerpt": "Extract",
    "FragmentSelector": "TextFragmentIdentifier",
    "GenericIdea": "Idea",
    "GenericIdeaNode": "Idea",
    "IdeaRelation": "IdeaLink",
    "InclusionRelation": "IdeaLink",
    "InclusionRelation": "IdeaLink",
    "Issue": "Idea",
    "IssueAppliesTo": "IdeaLink",
    "IssueQuestions": "IdeaLink",
    "LickertRange": "LickertVoteSpecification",
    "LickertVote": "LickertVote",
    "Map": "ExplicitSubGraphView",
    "MutualRelevanceStatement": "IdeaLink",
    "Position": "Idea",
    "PositionRespondsToIssue": "IdeaLink",
    "Post": "ImportedPost",
    "PostSource": "ContentSource",
    "Question": "Idea",
    "ReadStatusChange": "ViewPost",
    "Reference": "Idea",
    "Role": "Role",
    "RootIdea": "Idea",
    "SPost": "ImportedPost",
    "UserAccount": "User",
    "WholePartRelation": "IdeaLink",
    "CIdea": "Idea",
    "Agent": "AgentProfile",
    "BinaryVote": "BinaryIdeaVote",

    "IdeaMap": "ExplicitSubGraphView",  # ?
    "Container": "ExplicitSubGraphView",  # ?
    "Annotate": None,  # "version:Annotate",
    "Annotation": None,  # Extract
    "ApprovalChange": None,  # "version:ApprovalChange",
    "Community": None,  # "sioc:Community",
    "Conversation": None,  # "catalyst:Conversation",
    "Create": None,  # "version:Create",
    "Delete": None,  # "version:Delete",
    "ExcerptTarget": None,  # "catalyst:ExcerptTarget",
    "Forum": None,  # "sioc:Forum",
    "Graph": None,  # "trig:Graph",
    "Ideas": None,  # "catalyst:Ideas",
    "Item": None,  # "catalyst:Item",
    "MailingList": None,  # "assembl:MailingList",
    "Move": None,  # "version:Move",
    "ObjectSnapshot": None,  # "version:ObjectSnapshot",
    "OrderingVote": "vote:OrderingVote",
    "Organization": None,  # "foaf:Organization",
    "ParticipantGroup": None,  # "catalyst:ParticipantGroup",
    "Participants": None,  # "catalyst:Participants",
    "Person": None,  # "foaf:Person",
    "PerUserStateChange": None,  # "version:PerUserStateChange",
    "PerUserUpdate": None,  # "version:PerUserUpdate",
    "Site": None,  # "catalyst:Site",
    "SItem": None,  # "sioc:Item",
    "Space": None,  # "sioc:Space",
    "SpecificResource": None,  # Extract
    "SSite": None,  # "sioc:Site",
    "StateChange": None,  # "version:StateChange",
    "Statement": None,  # "rdf:Statement",
    "TextPositionSelector": None,  # "oa:TextPositionSelector",
    "TextQuoteSelector": None,  # "oa:TextQuoteSelector",
    "Thread": None,  # "sioc:Thread",
    "Tombstone": None,  # "version:Tombstone",
    "Update": None,  # "version:Update",
    "UserAccount": None,  # "sioc:UserAccount",
    "Usergroup": None,  # "sioc:Usergroup",
    "Vote": None,  # "vote:Vote",

}


class simple_jsonld_reader(object):

    def __init__(self):
        pass

    def class_from_type(self, type):
        return class_equivalents.get(type, None)

    def read(self, jsonld, discussion, admin_user_id, base=None):
        if isinstance(jsonld, (str, unicode)):
            jsonld = json.loads(jsonld)
        c = jsonld['@context']
        # Avoid loading the main context.
        if c == context_url:
            c = local_context_loc
        elif context_url in c:
            c.remove(context_url)
            c.append(local_context_loc)
        c = Context(c, base=base)
        by_id = dict()
        site_iri = None

        def find_objects(j):
            if isinstance(jsonld, (str, unicode)):
                return
            if isinstance(j, list):
                for x in j:
                    find_objects(x)
            if isinstance(j, dict):
                jid = j.get('@id', None)
                if jid:
                    by_id[jid] = j
                for x in j.values():
                    find_objects(x)
        find_objects(jsonld)
        for json in by_id.itervalues():
            if json.get('@type', None) == 'Site':
                site_iri = json['@id']
                break
        site_iri = site_iri or base
        assert site_iri is not None
        handler = ImportRecordHandler(discussion, site_iri)
        for json in by_id.itervalues():
            cls = self.class_from_type(json['@type'])
            if not cls:
                print "missing cls for :", json['@type']
                continue
            if cls:
                cls = get_named_class(cls)
            cls.create_from_json(
                json, admin_user_id, aliases=handler,
                parse_def_name='readcif.json', jsonld=by_id)
