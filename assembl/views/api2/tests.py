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
    IdeaContentWidgetLink
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
            'widget_type': 'creativity',
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
    new_idea_rep = test_app.post(idea_endpoint, {
        "type": "Idea", "short_title": "This is a brand new idea"})
    assert new_idea_rep.status_code == 201
    # Get the sub-idea from the db
    Idea.db.flush()
    new_idea_id = new_idea_rep.location
    new_idea = Idea.get_instance(new_idea_id)
    assert new_idea.widget_id == new_widget.id
    #assert new_idea.hidden, Still TODO
    # Get the sub-idea from the api
    new_idea_rep = test_app.get(
        local_to_absolute(new_idea_rep.location),
        headers={"Accept": "application/json"}
    )
    assert new_idea_rep.status_code == 200
    # It should have a link to the root idea
    idea_link = IdeaLink.db.query(IdeaLink).filter_by(
        source_id=subidea_1.id, target_id=new_idea.id).one()
    # The new idea should now be in the collection api
    test = test_app.get(idea_endpoint)
    assert test.status_code == 200
    assert new_idea_id in test.json
    # TODO: The root idea is included in the above, that's a bug.
    # get the new post endpoint from the idea data
    post_endpoint = new_idea_rep.json.get('widget_add_post_endpoint', None)
    assert post_endpoint
    # Create a new post attached to the sub-idea
    new_post_rep = test_app.post(local_to_absolute(post_endpoint), {
        "type": "Post", "subject": "test_message", "message_id": "bogus",
        "body": "body", "creator_id": participant1_user.id})
    assert new_post_rep.status_code == 201
    # Get the new post from the API
    Post.db.flush()
    new_post_id = new_post_rep.location
    post = Post.get_instance(new_post_id)
    assert post.hidden
    # It should have a widget link to the idea.
    post_widget_link = Idea.db.query(IdeaContentWidgetLink).filter_by(
        content_id=post.id, idea_id=new_idea.id).one()
    # The new post should now be in the collection api
    test = test_app.get(local_to_absolute(post_endpoint))
    assert test.status_code == 200
    assert new_post_id in test.json
