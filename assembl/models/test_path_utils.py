from .post import Post


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
    orphan_count = counters.get_orphan_counts()
    # for (num, idea) in enumerate(ideas):
    #     print "idea", num, idea.short_title, "#", counters.counts[idea.id]
    #     print "posts:", ",".join(posts_by_idea[idea.id])
    # print "orphans #", orphan_count, ":", ",".join(orphans)
    # for id, loc_coll in test_webrequest.discussion_data._post_path_counter.paths.iteritems():
    #     print id, ":", " ; ".join((as_post_nums(path) for path in loc_coll.paths))
    # counters.paths[subidea_1.id].as_clause_base(test_session)

    # Resulting paths:
    # subidea_1 : <1+> ; <1,3,5-> ; <1,3,5,6+> ; <1,2,17,18+> ; <1,4+> ; <1,4,8,9,15,16->
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
