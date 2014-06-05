# -*- coding: utf-8 -*-

import pytest
import anyjson as json

from ...models import (
    Idea,
    IdeaLink,
    SubGraphIdeaAssociation,
    SubGraphIdeaLinkAssociation,
    Post,
    Widget,
    IdeaContentWidgetLink,
    LickertRange,
    Criterion
)


def local_to_absolute(uri):
    if uri.startswith('local:'):
        return '/data/' + uri[6:]
    return uri


def test_get_ideas(discussion, test_app, synthesis_1,
                   subidea_1_1_1, test_session):
    all_ideas = test_app.get('/data/Idea')
    assert all_ideas.status_code == 200
    all_ideas = all_ideas.json
    disc_ideas = test_app.get('/data/Discussion/%d/ideas' % (discussion.id,))
    assert disc_ideas.status_code == 200
    disc_ideas = disc_ideas.json
    assert set(all_ideas) == set(disc_ideas)
    synthesis_ideasassocs = test_app.get(
        '/data/Discussion/%d/views/%d/idea_assocs' % (
            discussion.id, synthesis_1.id))
    assert synthesis_ideasassocs.status_code == 200
    synthesis_ideasassocs = synthesis_ideasassocs.json
    syn_ideas = set()
    for assoc_id in synthesis_ideasassocs:
        a = SubGraphIdeaAssociation.get_instance(assoc_id)
        syn_ideas.add(Idea.uri_generic(a.idea_id))
    assert syn_ideas < set(disc_ideas)
    subidea_1_1_1_id = Idea.uri_generic(subidea_1_1_1.id)
    assert subidea_1_1_1_id in disc_ideas
    assert subidea_1_1_1_id not in syn_ideas
    syn_ideas = test_app.get(
        '/data/Discussion/%d/views/%d/ideas' % (
            discussion.id, synthesis_1.id))
    assert syn_ideas.status_code == 200
    syn_ideas = syn_ideas.json
    assert set(syn_ideas) < set(disc_ideas)
    subidea_1_1_1_id = Idea.uri_generic(subidea_1_1_1.id)
    assert subidea_1_1_1_id in disc_ideas
    assert subidea_1_1_1_id not in syn_ideas


def test_add_idea_in_synthesis(
        discussion, test_app, synthesis_1, test_session):
    new_idea_r = test_app.post(
        '/data/Discussion/%d/views/%d/ideas' % (
            discussion.id, synthesis_1.id),
        {"short_title": "New idea"})
    assert new_idea_r.status_code == 201
    link = new_idea_r.location
    new_idea = Idea.get_instance(link)
    assert new_idea
    idea_assoc = Idea.db.query(SubGraphIdeaAssociation).filter_by(
        idea=new_idea, sub_graph=synthesis_1).first()
    assert idea_assoc


def test_add_subidea_in_synthesis(
        discussion, test_app, synthesis_1, subidea_1_1, test_session):
    new_idea_r = test_app.post(
        '/data/Discussion/%d/views/%d/ideas/%d/children' % (
            discussion.id, synthesis_1.id, subidea_1_1.id),
        {"short_title": "New subidea"})
    assert new_idea_r.status_code == 201
    link = new_idea_r.location
    new_idea = Idea.get_instance(link)
    assert new_idea
    db = Idea.db
    idea_link = db.query(IdeaLink).filter_by(
        target=new_idea, source=subidea_1_1).first()
    assert idea_link
    idea_assoc = db.query(SubGraphIdeaAssociation).filter_by(
        idea=new_idea, sub_graph=synthesis_1).first()
    assert idea_assoc
    idealink_assoc = db.query(SubGraphIdeaLinkAssociation).filter_by(
        sub_graph=synthesis_1, idea_link=idea_link).first()
    assert idealink_assoc


def test_widget_basic_interaction(
        discussion, test_app, subidea_1, participant1_user, test_session):
    # Post the initial configuration
    new_widget_loc = test_app.post(
        '/data/Discussion/%d/widgets' % (discussion.id,), {
            'type': 'CreativityWidget',
            'settings': json.dumps({
                'idea': 'local:Idea/%d' % (subidea_1.id)
            })
        })
    assert new_widget_loc.status_code == 201
    # Get the widget from the db
    Idea.db.flush()
    new_widget = Widget.get_instance(new_widget_loc.location)
    assert new_widget
    # Get the widget from the api
    widget_rep = test_app.get(
        local_to_absolute(new_widget.uri()),
        headers={"Accept": "application/json"}
    )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    print widget_rep
    assert 'messages_uri' in widget_rep
    assert 'ideas_uri' in widget_rep
    assert 'user' in widget_rep
    # Get the list of new ideas (should be empty)
    idea_endpoint = local_to_absolute(widget_rep['ideas_uri'])
    test = test_app.get(idea_endpoint)
    assert test.status_code == 200
    assert test.json == []

    # Create a new sub-idea
    new_idea_create = test_app.post(idea_endpoint, {
        "type": "Idea", "short_title": "This is a brand new idea"})
    assert new_idea_create.status_code == 201
    # Get the sub-idea from the db
    Idea.db.flush()
    new_idea1_id = new_idea_create.location
    new_idea1 = Idea.get_instance(new_idea1_id)
    assert new_idea1.widget_id == new_widget.id
    assert new_idea1.hidden
    assert not subidea_1.hidden
    # Get the sub-idea from the api
    new_idea1_rep = test_app.get(
        local_to_absolute(new_idea_create.location),
        headers={"Accept": "application/json"}
    )
    assert new_idea1_rep.status_code == 200
    # It should have a link to the root idea
    idea_link = IdeaLink.db.query(IdeaLink).filter_by(
        source_id=subidea_1.id, target_id=new_idea1.id).one()
    # The new idea should now be in the collection api
    test = test_app.get(idea_endpoint)
    assert test.status_code == 200
    assert new_idea1_id in test.json or new_idea1_id in [
        x['@id'] for x in test.json]
    # TODO: The root idea is included in the above, that's a bug.
    # get the new post endpoint from the idea data
    post_endpoint = new_idea1_rep.json.get('widget_add_post_endpoint', None)
    assert post_endpoint
    # Create a new post attached to the sub-idea
    new_post_create = test_app.post(local_to_absolute(post_endpoint), {
        "type": "Post", "message_id": "bogus",
        "body": "body", "creator_id": participant1_user.id})
    assert new_post_create.status_code == 201
    # Get the new post from the db
    Post.db.flush()
    new_post1_id = new_post_create.location
    post = Post.get_instance(new_post1_id)
    assert post.hidden
    # It should have a widget link to the idea.
    post_widget_link = Idea.db.query(IdeaContentWidgetLink).filter_by(
        content_id=post.id, idea_id=new_idea1.id).one()
    # The new post should now be in the collection api
    test = test_app.get(local_to_absolute(post_endpoint))
    assert test.status_code == 200
    assert new_post1_id in test.json or new_post1_id in [
        x['@id'] for x in test.json]
    # Get the new post from the api
    new_post1_rep = test_app.get(
        local_to_absolute(new_post_create.location),
        headers={"Accept": "application/json"}
    )
    assert new_post1_rep.status_code == 200
    # It should mention its idea
    print new_post1_rep.json
    assert new_idea1_id in new_post1_rep.json['widget_ideas']
    # Create a second idea
    new_idea_create = test_app.post(idea_endpoint, {
        "type": "Idea", "short_title": "This is another new idea"})
    assert new_idea_create.status_code == 201
    # Get the sub-idea from the db
    Idea.db.flush()
    new_idea2_id = new_idea_create.location
    # Approve the first but not the second idea
    confirm_idea_uri = local_to_absolute(widget_rep['confirm_ideas_uri'])
    confirm = test_app.post(confirm_idea_uri, {
        "ids": json.dumps([new_idea1_id])})
    assert confirm.status_code == 200
    Idea.db.flush()
    # Get it back
    get_back = test_app.get(confirm_idea_uri)
    assert get_back.status_code == 200
    # The first idea should now be unhidden, but not the second
    assert get_back.json == [new_idea1_id]
    new_idea1 = Idea.get_instance(new_idea1_id)
    assert not new_idea1.hidden
    new_idea2 = Idea.get_instance(new_idea2_id)
    assert new_idea2.hidden
    # Create a second post.
    new_post_create = test_app.post(local_to_absolute(post_endpoint), {
        "type": "Post", "message_id": "bogus",
        "body": "body", "creator_id": participant1_user.id})
    assert new_post_create.status_code == 201
    Post.db.flush()
    new_post2_id = new_post_create.location
    # Approve the first but not the second idea
    confirm_messages_uri = local_to_absolute(
        widget_rep['confirm_messages_uri'])
    confirm = test_app.post(confirm_messages_uri, {
        "ids": json.dumps([new_post1_id])})
    assert confirm.status_code == 200
    Idea.db.flush()
    # Get it back
    get_back = test_app.get(confirm_messages_uri)
    assert get_back.status_code == 200
    assert get_back.json == [new_post1_id]
    # The first idea should now be unhidden, but not the second
    new_post1 = Post.get_instance(new_post1_id)
    assert not new_post1.hidden
    new_post2 = Post.get_instance(new_post2_id)
    assert new_post2.hidden


def test_voting_widget(
        discussion, test_app, subidea_1_1, criterion_1, criterion_2,
        criterion_3, participant1_user, lickert_range, test_session):
    # Post the initial configuration
    db = Idea.db()
    new_widget_loc = test_app.post(
        '/data/Discussion/%d/widgets' % (discussion.id,), {
            'type': 'MultiCriterionVotingWidget',
            'settings': json.dumps({
                'idea': 'local:Idea/%d' % (subidea_1_1.id)
            })
        })
    assert new_widget_loc.status_code == 201
    # Get the widget from the db
    db.flush()
    new_widget = Widget.get_instance(new_widget_loc.location)
    assert new_widget
    # Get the widget from the api
    widget_rep = test_app.get(
        local_to_absolute(new_widget.uri()),
        headers={"Accept": "application/json"}
    )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    # Get the list of criteria (there should be 3)
    criteria_uri = local_to_absolute(widget_rep['criteria_uri'])
    test = test_app.get(criteria_uri)
    assert test.status_code == 200
    assert len(test.json) == 3
    # Get the voting endpoint
    user_votes_uri = local_to_absolute(widget_rep['user_votes_uri'])
    # It should be empty
    test = test_app.get(user_votes_uri)
    assert test.status_code == 200
    assert len(test.json) == 0
    # Add votes to the voting endpoint
    # TODO: Put lickert_range id in voter config. Or create one?
    test = test_app.post(user_votes_uri, {
        "type": "LickertIdeaVote",
        "value": 2,
        })
    assert test.status_code == 201
    # Get them back
    test = test_app.get(user_votes_uri)
    assert test.status_code == 200
    assert len(test.json) == 1
    # Add votes for another user
    # TODO
    # Get vote results.
    vote_results_uri = local_to_absolute(widget_rep['vote_results_uri'])
    test = test_app.get(vote_results_uri)
    assert test.status_code == 200
    assert test.json == 2
