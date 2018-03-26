import pytest
from assembl.models.post import Post, PublicationStates
from assembl.models.idea_content_link import IdeaContentPositiveLink


def test_jack_layton_linked_discussion(
        test_session, test_webrequest, jack_layton_linked_discussion,
        subidea_1, subidea_1_1, subidea_1_1_1, subidea_1_1_1_1,
        subidea_1_1_1_1_1, subidea_1_1_1_1_2, subidea_1_1_1_1_2_1,
        subidea_1_1_1_1_2_2, subidea_1_2, subidea_1_2_1):
    ideas = (
        subidea_1, subidea_1_1, subidea_1_1_1, subidea_1_1_1_1,
        subidea_1_1_1_1_1, subidea_1_1_1_1_2, subidea_1_1_1_1_2_1,
        subidea_1_1_1_1_2_2, subidea_1_2, subidea_1_2_1)
    counters = subidea_1.prepare_counters(subidea_1.discussion_id, True)
    posts = test_session.query(Post.id).order_by(Post.creation_date).all()
    posts = [x for (x,) in posts]
    posts.insert(0, None)  # We are using 1-offset indices below.
    posts_id_by_num = dict(enumerate(posts))
    posts_num_by_id = {v: k for (k, v) in posts_id_by_num.iteritems()}

    def as_post_nums(path):
        path2 = ",".join((str(posts_num_by_id[int(id)])
                          for id in path.post_path.strip(",").split(",")))
        return "<%s%s>" % (
            path2, "+" if path.positive else "-")

    posts_by_idea = {}
    for idea in ideas:
        posts_of_idea = list(test_session.execute(
            counters.paths[idea.id].as_clause_base(test_session)))
        posts_of_idea = [posts_num_by_id[id] for (id,) in posts_of_idea]
        # posts_of_idea.sort()
        # posts_of_idea = [str(id) for id in posts_of_idea]
        posts_by_idea[idea.id] = set(posts_of_idea)
    orphans = list(test_session.execute(counters.orphan_clause()))
    orphans = [posts_num_by_id[id] for (id,) in orphans]
    # orphans.sort()
    # orphans = [str(id) for id in orphans]
    orphans = set(orphans)
    # orphan_count = counters.get_orphan_counts()
    # data = test_webrequest.discussion_data._post_path_counter.paths
    # for (num, idea) in enumerate(ideas):
    #     print "idea", num, idea.short_title, "#", counters.counts[idea.id]
    #     print "posts:", ",".join((str(x) for x in posts_by_idea[idea.id]))
    #     print " ; ".join((as_post_nums(path) for path in data[idea.id].paths))
    # print "orphans #", orphan_count, ":", ",".join((str(x) for x in orphans))

    # Resulting paths:
    # subidea_1 : <1+> ; <1,3,5-> ; <1,3,5,6+> ; <1,4,8,9,15,16->
    # subidea_1_1 : <1,3,5,6+> ; <1,2,17,18+> ; <1,4,8+> ; <1,4,8,9,15,16->
    # subidea_1_1_1 : <1,2,17,18+> ; <1,4,8+> ; <1,4,8,9,15,16->
    # subidea_1_1_1_1 : <1,2,17,18+> ; <1,4,8+> ; <1,4,8,9,15,16->
    # subidea_1_1_1_1_1 : <1,2,17,18+> ; <1,4,8,9,15+> ; <1,4,8,9,15,16->
    # subidea_1_1_1_1_2 : <1,4,8,19+>
    # subidea_1_1_1_1_2_1 : <1,4,8,19+>
    # subidea_1_1_1_1_2_2 : <1,4,8,19,20+>
    # subidea_1_2 : <1,4+> ; <1,4,8,9,15,16->
    # subidea_1_2_1 : <1,4+> ; <1,4,8,9,15,16->

    expected = {
        subidea_1.id: {1, 2, 3, 4, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20},
        subidea_1_1.id: {6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 18, 19, 20},
        subidea_1_1_1.id: {8, 9, 10, 15, 18, 19, 20},
        subidea_1_1_1_1.id: {8, 9, 10, 15, 18, 19, 20},
        subidea_1_1_1_1_1.id: {15, 18},
        subidea_1_1_1_1_2.id: {19, 20},
        subidea_1_1_1_1_2_1.id: {19, 20},
        subidea_1_1_1_1_2_2.id: {20},
        subidea_1_2.id: {4, 8, 9, 10, 15, 19, 20},
        subidea_1_2_1.id: {4, 8, 9, 10, 15, 19, 20},
        None: {5, 16}  # orphans
    }
    for idea in ideas:
        assert posts_by_idea[idea.id] == expected[idea.id]
    assert orphans == expected[None]

    # we need to commit to expire post*.idea_content_links_above_post
    # used in indirect_idea_content_links_with_cache
    test_session.commit()

    # Post 6 is linked to subidea_1 through its direct link, but not its link through post 1
    post_6 = Post.get(posts_id_by_num[6])
    icls = post_6.indirect_idea_content_links_with_cache(filter=False)
    icls_f = post_6.indirect_idea_content_links_with_cache(filter=True)
    assert len(icls_f) < len(icls)
    # Post 5 is not linked to subidea_1
    post_5 = Post.get(posts_id_by_num[5])
    icls_f = post_5.indirect_idea_content_links_with_cache(filter=True)
    icpl_polymap = {
            cls.external_typename()
            for cls in IdeaContentPositiveLink.get_subclasses()}
    positive = [icl for icl in icls_f if icl["@type"] in icpl_polymap]
    assert not positive


def test_deleted_post_count(
        test_session, test_webrequest, reply_deleted_post_4,
        subidea_1_1, reply_to_deleted_post_5, extract_post_1_to_subidea_1_1):
    # Deleted posts with live children should not be counted in num_posts,
    # but should be retrieved in get_related_posts
    assert subidea_1_1.num_posts == 2
    assert subidea_1_1.get_related_posts_query().count() == 3
    assert subidea_1_1.get_related_posts_query(
        include_deleted=True).count() == 1


def test_deleted_root_post_count(
        test_session, test_webrequest, reply_post_1,
        subidea_1_1, extract_post_1_to_subidea_1_1):
    # Deleted posts with live children should not be counted in num_posts,
    # but should be retrieved in get_related_posts
    # assert subidea_1_1.num_posts == 1
    # assert subidea_1_1.get_related_posts_query().count() == 1
    reply_post_1.delete_post(PublicationStates.DELETED_BY_ADMIN)
    assert subidea_1_1.num_posts == 0
    assert subidea_1_1.get_related_posts_query().count() == 0
    assert subidea_1_1.get_related_posts_query(
        include_deleted=True).count() == 1
    assert subidea_1_1.get_related_posts_query(
        include_deleted=None).count() == 1


def test_deleted_post_count_bis(
        test_session, test_webrequest, reply_deleted_post_4,
        subidea_1_1, extract_post_1_to_subidea_1_1):
    # Deleted posts without live children should not be counted in num_posts,
    # and should be not be retrieved in get_related_posts either,
    # unless requested.

    # But first do a delete post so tombstone status is right.
    reply_deleted_post_4.delete_post(PublicationStates.DELETED_BY_ADMIN)
    assert subidea_1_1.num_posts == 1
    assert subidea_1_1.get_related_posts_query().count() == 1
    assert subidea_1_1.get_related_posts_query(
        include_deleted=None).count() == 2


def test_deleted_orphan_count(
        test_session, test_webrequest, root_idea, discussion,
        reply_deleted_post_4, reply_to_deleted_post_5):
    # Deleted posts should not be counted in num_posts, but should be retrieved
    # in _get_orphan_posts_statement
    assert root_idea._get_orphan_posts_statement(discussion.id).count() == 4
    assert root_idea._get_orphan_posts_statement(
        discussion.id, include_deleted=True).count() == 1
    assert root_idea.num_orphan_posts == 3


def test_delete_posts(
        test_session, test_webrequest, reply_post_1, reply_post_2):
    # Delete on parent with live child should not set tombstone...
    reply_post_1.delete_post(PublicationStates.DELETED_BY_ADMIN)
    assert reply_post_1.publication_state == PublicationStates.DELETED_BY_ADMIN
    assert not reply_post_1.is_tombstone
    # ...until child is deleted
    reply_post_2.delete_post(PublicationStates.DELETED_BY_ADMIN)
    assert reply_post_2.publication_state == PublicationStates.DELETED_BY_ADMIN
    assert reply_post_2.is_tombstone
    assert reply_post_1.is_tombstone
