# -*- coding: utf-8 -*-
import json

from graphql_relay.node.node import from_global_id

from assembl.graphql.schema import Schema as schema
from freezegun import freeze_time


@freeze_time("2018-3-1")
def test_mutation_add_extract_comment(admin_user, graphql_request, idea_in_thread_phase, top_post_in_thread_phase, extract_post_1_to_subidea_1_1):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import Post
    post = Post.get(raw_id)
    post.extracts.append(extract_post_1_to_subidea_1_1)
    post.db.flush()

    extract_id = extract_post_1_to_subidea_1_1.graphene_id()

    idea_id = idea_in_thread_phase
    res = schema.execute(u"""
        mutation createPost {
            createPost(
                ideaId:"%s",
                extractId:"%s",
                subject:"Manger des choux à la crème",
                body:"Je recommande de manger des choux à la crème, c'est très bon, et ça permet de maintenir l'industrie de la patisserie française."
            ) {
                post {
                    ... on Post {
                        parentExtractId
                    }
                }
            }
        }
        """ % (idea_id, extract_id), context_value=graphql_request)

    assert res.data['createPost']['post']['parentExtractId'] == extract_id


@freeze_time("2018-3-1")
def test_mutation_add_extract_comment_reply(admin_user, graphql_request, idea_in_thread_phase, top_post_in_thread_phase, extract_post_1_to_subidea_1_1, extract_comment):
    from graphene.relay import Node
    raw_id = int(Node.from_global_id(top_post_in_thread_phase)[1])
    from assembl.models import Post, ExtractComment
    post = Post.get(raw_id)
    post.extracts.append(extract_post_1_to_subidea_1_1)
    post.db.flush()

    extract_id = extract_post_1_to_subidea_1_1.graphene_id()
    comment_id = extract_comment.graphene_id()
    idea_id = idea_in_thread_phase
    res = schema.execute(u"""
        mutation createPost {
            createPost(
                ideaId:"%s",
                extractId:"%s",
                parentId:"%s",
                subject:"Manger des choux à la crème",
                body:"Je recommande de manger des choux à la crème, c'est très bon, et ça permet de maintenir l'industrie de la patisserie française."
            ) {
                post {
                    ... on Post {
                        parentExtractId
                        parentId
                    }
                }
            }
        }
        """ % (idea_id, extract_id, comment_id), context_value=graphql_request)

    assert res.data['createPost']['post']['parentExtractId'] == extract_id
    assert res.data['createPost']['post']['parentId'] == comment_id
