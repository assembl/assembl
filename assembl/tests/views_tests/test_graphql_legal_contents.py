import json

from graphql_relay.node.node import from_global_id

from assembl import models
from assembl.graphql.schema import Schema as schema

def test_default_legal_contents(test_app, discussion):
    assert not discussion.preferences['mandatory_legal_contents_validation']


def test_update_legal_contents(test_app, discussion, graphql_registry, graphql_request):
    response = schema.execute(
        graphql_registry['updateLegalContents'],
        context_value=graphql_request,
        variable_values={
            "mandatoryLegalContentsValidation": True, 
            "cookiesPolicyAttachments": [],
            "legalNoticeAttachments": [],
            "privacyPolicyAttachments": [],
            "termsAndConditionsAttachments": [],
            "userGuidelinesAttachments": [],
            "cookiesPolicyEntries": [],
            "legalNoticeEntries": [],
            "privacyPolicyEntries": [],
            "termsAndConditionsEntries": [],
            "userGuidelinesEntries": [] }
    )
    assert discussion.preferences['mandatory_legal_contents_validation'] == True