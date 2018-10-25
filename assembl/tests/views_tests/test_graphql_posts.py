# -*- coding: utf-8 -*-
import json

from graphql_relay.node.node import from_global_id

from assembl.graphql.schema import Schema as schema


def test_mutation_add_extract_comment(admin_user, graphql_request, top_post_in_thread_phase, extract_post_1_to_subidea_1_1):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import Post
    post = Post.get(raw_id)
    post.extracts.append(extract_post_1_to_subidea_1_1)
    post.db.flush()

    extract_id = extract_post_1_to_subidea_1_1.graphene_id()
    res = schema.execute(u"""
        mutation myFirstMutation($extractId: ID!, $body: String!) {
            addExtractComment(extractId:$extractId, body:$body) {
                extract {
                    ... on Extract {
                        comment {
                            body
                        }
                    }
                }
            }
        }""", context_value=graphql_request, variable_values={'extractId': extract_id, 'body': "Aucun lien, fils unique"})
    assert json.loads(json.dumps(res.data)) == {
        u'addExtractComment': {
            u'extract': {
                u'comment': {u'body': 'Aucun lien, fils unique'}
            }}}