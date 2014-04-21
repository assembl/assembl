# -*- coding: utf-8 -*-

import pytest
import anyjson as json

from ...models import (
    Idea,
    IdeaLink,
    SubGraphIdeaAssociation,
    SubGraphIdeaLinkAssociation,
    Widget,
)


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
    link = [x for x in new_idea_r.body.split("\n") if ':' in x][0]
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
    link = [x for x in new_idea_r.body.split("\n") if ':' in x][0]
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
        discussion, test_app, subidea_1, test_session):
    new_widget_loc = test_app.post(
        '/data/Discussion/%d/widgets' % (discussion.id,), {
            'widget_type': 'creativity',
            'settings': json.dumps({
                'idea': 'local:Idea/%d' % (subidea_1.id)
            })
    })
    assert new_widget_loc.status_code == 201
    link = [x for x in new_widget_loc.body.split("\n") if ':' in x][0]
    new_widget = Widget.get_instance(link)
    assert new_widget
    widget_rep = test_app.get(
        '/data/'+ new_widget.uri()[6:]
        )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    print widget_rep
    assert 'messages_uri' in widget_rep
    assert 'ideas_uri' in widget_rep
    assert 'user' in widget_rep
    messages_uri = '/data' + widget_rep['messages_uri'][6:]
    # new_post_loc = test_app.post(messages_uri, {"title": "test_message"})
    # assert new_post_loc.status_code == 201
    # link = [x for x in new_post_loc.body.split("\n") if ':' in x][0]
    # post = Post.get_instance(link)
    