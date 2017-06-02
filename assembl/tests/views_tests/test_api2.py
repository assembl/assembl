# -*- coding: utf-8 -*-
import csv
import pytest
from datetime import datetime, timedelta
import simplejson as json
from io import BytesIO

from assembl.models import (
    AbstractIdeaVote,
    Idea,
    IdeaLink,
    SubGraphIdeaAssociation,
    SubGraphIdeaLinkAssociation,
    Post,
    Widget,
    IdeaContentWidgetLink,
    GeneratedIdeaWidgetLink,
    BaseIdeaWidgetLink,
    AbstractVoteSpecification
)


JSON_HEADER = {"Content-Type": "application/json"}


def local_to_absolute(uri):
    if uri.startswith('local:'):
        return '/data/' + uri[6:]
    return uri


def test_get_ideas(discussion, test_app, synthesis_1,
                   subidea_1_1_1, test_session):
    all_ideas = test_app.get('/data/Idea')
    assert all_ideas.status_code == 200
    all_ideas = all_ideas.json
    disc_ideas = test_app.get('/data/Discussion/%d/ideas?view=id_only' %
                              (discussion.id,))
    assert disc_ideas.status_code == 200
    disc_ideas = disc_ideas.json
    assert set(all_ideas) == set(disc_ideas)
    synthesis_ideasassocs = test_app.get(
        '/data/Discussion/%d/views/%d/idea_assocs?view=id_only' % (
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
        '/data/Discussion/%d/views/%d/ideas?view=id_only' % (
            discussion.id, synthesis_1.id))
    assert syn_ideas.status_code == 200
    syn_ideas = syn_ideas.json
    assert set(syn_ideas) < set(disc_ideas)
    subidea_1_1_1_id = Idea.uri_generic(subidea_1_1_1.id)
    assert subidea_1_1_1_id in disc_ideas
    assert subidea_1_1_1_id not in syn_ideas


def test_add_idea_in_synthesis(
        discussion, test_app, test_session, subidea_1_1):
    synthesis = discussion.next_synthesis
    new_idea_r = test_app.post(
        '/data/Discussion/%d/views/%d/ideas' % (
            discussion.id, synthesis.id),
        json.dumps({"@id": subidea_1_1.uri()}),
        headers=JSON_HEADER)
    assert new_idea_r.status_code == 201
    idea_assoc = discussion.db.query(SubGraphIdeaAssociation).filter_by(
        idea=subidea_1_1, sub_graph=synthesis).first()
    assert idea_assoc

    # remove this subidea from synthesis
    remove_idea_result = test_app.delete(
        '/data/Discussion/%d/syntheses/%d/ideas/%d' % (
            discussion.id, synthesis.id, subidea_1_1.id))
    assert remove_idea_result.status_code == 200


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
    db = discussion.db
    idea_link = db.query(IdeaLink).filter_by(
        target=new_idea, source=subidea_1_1).first()
    assert idea_link
    idea_assoc = db.query(SubGraphIdeaAssociation).filter_by(
        idea=new_idea, sub_graph=synthesis_1).first()
    assert idea_assoc
    idealink_assoc = db.query(SubGraphIdeaLinkAssociation).filter_by(
        sub_graph=synthesis_1, idea_link=idea_link).first()
    assert idealink_assoc


def test_widget_settings(
        discussion, test_app, subidea_1, participant1_user, test_session):
    # Post arbitrary json as initial configuration
    settings = {
        "ideas": [
            {"local:Idea/67": 8},
            {"local:Idea/66": 2},
            {"local:Idea/65": 9},
            {"local:Idea/64": 1}
        ]
    }
    settings_s = json.dumps(settings)
    new_widget_loc = test_app.post(
        '/data/Discussion/%d/widgets' % (discussion.id,), {
            'type': 'CreativitySessionWidget',
            'settings': json.dumps({
                'idea': 'local:Idea/%d' % (subidea_1.id)
            })
        })
    assert new_widget_loc.status_code == 201
    widget_id = new_widget_loc.location
    # Get the widget representation
    widget_rep = test_app.get(
        local_to_absolute(widget_id),
        headers={"Accept": "application/json"}
    )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    # Put the settings
    widget_settings_endpoint = local_to_absolute(
        widget_rep['widget_settings_url'])
    result = test_app.put(
        widget_settings_endpoint, settings_s,
        headers=JSON_HEADER)
    assert result.status_code in (200, 204)
    # Get it back
    result = test_app.get(
        widget_settings_endpoint, settings_s,
        headers={"Accept": "application/json"})
    assert result.status_code == 200
    assert result.json == settings


def test_widget_user_state(
        discussion, test_app, subidea_1, participant1_user, test_session):
    # Post the initial configuration
    state = [{"local:Idea/67": 8}, {"local:Idea/66": 2},
             {"local:Idea/65": 9}, {"local:Idea/64": 1}]
    state_s = json.dumps(state)
    new_widget_loc = test_app.post(
        '/data/Discussion/%d/widgets' % (discussion.id,), {
            'type': 'CreativitySessionWidget',
            'settings': json.dumps({
                'idea': 'local:Idea/%d' % (subidea_1.id)
            })
        })
    assert new_widget_loc.status_code == 201
    # Get the widget from the db
    discussion.db.flush()
    widget_id = new_widget_loc.location
    # Get the widget representation
    widget_rep = test_app.get(
        local_to_absolute(widget_id),
        headers={"Accept": "application/json"}
    )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    # Put the user state
    widget_user_state_endpoint = local_to_absolute(
        widget_rep['user_state_url'])
    result = test_app.put(
        widget_user_state_endpoint, state_s,
        headers=JSON_HEADER)
    assert result.status_code in (200, 204)
    # Get it back
    result = test_app.get(
        widget_user_state_endpoint,
        headers={"Accept": "application/json"})
    assert result.status_code == 200
    assert result.json == state
    # See if the user_state is in the list of all user_states
    result = test_app.get(
        local_to_absolute(widget_rep['user_states_url']),
        headers={"Accept": "application/json"}
    )
    assert result.status_code == 200
    assert state in result.json
    # Alter the state
    state.append({'local:Idea/30': 3})
    state_s = json.dumps(state)
    # Put the user state
    result = test_app.put(
        widget_user_state_endpoint, state_s,
        headers=JSON_HEADER)
    # Get it back
    result = test_app.get(
        widget_user_state_endpoint,
        headers={"Accept": "application/json"})
    assert result.status_code == 200
    assert result.json == state


def test_creativity_session_widget(
        discussion, test_app, subidea_1, subidea_1_1,
        participant1_user, test_session, request):
    # Post the initial configuration
    format = lambda x: x.strftime('%Y-%m-%dT%H:%M:%S')
    new_widget_loc = test_app.post_json(
        '/data/Discussion/%d/widgets' % (discussion.id,), {
            '@type': 'CreativitySessionWidget',
            'settings': {
                'idea': 'local:Idea/%d' % (subidea_1.id),
                'notifications': [
                    {
                        'start': '2014-01-01T00:00:00',
                        'end': format(datetime.utcnow() + timedelta(1)),
                        'message': 'creativity_session'
                    },
                    {
                        'start': format(datetime.utcnow() + timedelta(1)),
                        'end': format(datetime.utcnow() + timedelta(2)),
                        'message': 'creativity_session'
                    }
                ]
            }
        })
    assert new_widget_loc.status_code == 201
    # Get the widget from the db
    discussion.db.flush()
    new_widget = Widget.get_instance(new_widget_loc.location)
    assert new_widget
    assert new_widget.base_idea == subidea_1
    assert not new_widget.generated_ideas
    widget_id = new_widget.id
    # There should be a link
    widget_uri = new_widget.uri()
    widget_link = discussion.db.query(BaseIdeaWidgetLink).filter_by(
        idea_id=subidea_1.id, widget_id=widget_id).all()
    assert widget_link
    assert len(widget_link) == 1
    # Get the widget from the api
    widget_rep = test_app.get(
        local_to_absolute(widget_uri),
        headers={"Accept": "application/json"}
    )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    print widget_rep
    assert 'messages_url' in widget_rep
    assert 'ideas_url' in widget_rep
    assert 'user' in widget_rep
    # Get the list of new ideas
    # should be empty, despite the idea having a non-widget child
    idea_endpoint = local_to_absolute(widget_rep['ideas_url'])
    idea_hiding_endpoint = local_to_absolute(widget_rep['ideas_hiding_url'])
    test = test_app.get(idea_endpoint)
    assert test.status_code == 200
    assert test.json == []

    discussion.db.flush()
    assert new_widget.base_idea == subidea_1
    ctx_url = "http://example.com/cardgame.xml#card_1"
    # Create a new sub-idea
    new_idea_create = test_app.post_json(idea_hiding_endpoint, {
        "@type": "Idea", "short_title": "This is a brand new idea",
        "context_url": ctx_url
    })
    assert new_idea_create.status_code == 201
    # Get the sub-idea from the db
    discussion.db.flush()
    assert new_widget.base_idea == subidea_1
    new_idea1_id = new_idea_create.location
    new_idea1 = Idea.get_instance(new_idea1_id)
    assert new_idea1.proposed_in_post
    assert new_idea1 in new_widget.generated_ideas
    assert new_idea1.hidden
    assert new_idea1.proposed_in_post.hidden
    assert not subidea_1.hidden

    # Get the sub-idea from the api
    new_idea1_rep = test_app.get(
        local_to_absolute(new_idea_create.location),
        headers={"Accept": "application/json"}
    )
    assert new_idea1_rep.status_code == 200
    new_idea1_rep = new_idea1_rep.json

    # It should have a link to the root idea
    idea_link = discussion.db.query(IdeaLink).filter_by(
        source_id=subidea_1.id, target_id=new_idea1.id).one()
    assert idea_link

    # It should have a link to the widget
    widget_link = discussion.db.query(GeneratedIdeaWidgetLink).filter_by(
        idea_id=new_idea1.id, widget_id=widget_id).all()
    assert widget_link
    assert len(widget_link) == 1

    # It should be linked to its creating post.
    content_link = discussion.db.query(IdeaContentWidgetLink).filter_by(
        idea_id=new_idea1.id, content_id=new_idea1.proposed_in_post.id).first()
    assert content_link

    # The new idea should now be in the collection api
    test = test_app.get(idea_endpoint)
    assert test.status_code == 200
    test = test.json
    assert new_idea1_id in test or new_idea1_id in [
        x['@id'] for x in test]

    # We should find the context in the new idea
    assert ctx_url in test[0].get('creation_ctx_url', [])
    # TODO: The root idea is included in the above, that's a bug.
    # get the new post endpoint from the idea data
    post_endpoint = new_idea1_rep.get('widget_add_post_endpoint', None)
    assert (post_endpoint and widget_rep["@id"] and
            post_endpoint[widget_rep["@id"]])
    post_endpoint = post_endpoint[widget_rep["@id"]]

    # Create a new post attached to the sub-idea
    new_post_create = test_app.post_json(local_to_absolute(post_endpoint), {
        "@type": "AssemblPost",
        "body": {"@type": "LangString", "entries": [{
            "@type": "LangStringEntry", "value": "body",
            "@language": "en"
        }]}, "idCreator": participant1_user.uri()})
    assert new_post_create.status_code == 201

    # Get the new post from the db
    discussion.db.flush()
    new_post1_id = new_post_create.location
    post = Post.get_instance(new_post1_id)
    assert post.hidden

    # It should have a widget link to the idea.
    post_widget_link = discussion.db.query(IdeaContentWidgetLink).filter_by(
        content_id=post.id, idea_id=new_idea1.id).one()

    # It should be linked to the idea.
    content_link = discussion.db.query(IdeaContentWidgetLink).filter_by(
        idea_id=new_idea1.id, content_id=post.id).first()
    assert content_link

    # TODO: get the semantic data in tests.
    # assert subidea_1.id in Idea.get_idea_ids_showing_post(new_post1_id)
    # It should be a child of the proposing post
    assert post.parent == new_idea1.proposed_in_post

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

    new_post1 = Post.get_instance(new_post1_id)
    assert new_post1.hidden
    new_idea1 = Idea.get_instance(new_idea1_id)
    assert new_idea1.hidden

    # Create a second idea
    new_idea_create = test_app.post_json(idea_hiding_endpoint, {
        "@type": "Idea", "short_title": "This is another new idea"})
    assert new_idea_create.status_code == 201
    # Get the sub-idea from the db
    discussion.db.flush()
    new_idea2_id = new_idea_create.location

    # Approve the first but not the second idea
    confirm_idea_url = local_to_absolute(widget_rep['confirm_ideas_url'])
    confirm = test_app.post_json(confirm_idea_url, {
        "ids": [new_idea1_id]})
    assert confirm.status_code == 200
    discussion.db.flush()

    # Get it back
    get_back = test_app.get(confirm_idea_url)
    assert get_back.status_code == 200

    # The first idea should now be unhidden, but not the second
    assert get_back.json == [new_idea1_id]
    new_idea1 = Idea.get_instance(new_idea1_id)
    assert not new_idea1.hidden
    new_idea2 = Idea.get_instance(new_idea2_id)
    assert new_idea2.hidden
    assert new_idea2.proposed_in_post

    # The second idea was not proposed in public
    assert new_idea2.proposed_in_post.hidden

    # The root ideas should not be hidden.
    subidea_1 = Idea.get_instance(subidea_1.id)
    assert not subidea_1.hidden

    # Create a second post.
    new_post_create = test_app.post_json(local_to_absolute(post_endpoint), {
        "@type": "AssemblPost",
        "body": {"@type": "LangString", "entries": [{
            "@type": "LangStringEntry", "value": "body",
            "@language": "en"
        }]}, "idCreator": participant1_user.uri()})
    assert new_post_create.status_code == 201
    discussion.db.flush()
    new_post2_id = new_post_create.location

    # Approve the first but not the second idea
    confirm_messages_url = local_to_absolute(
        widget_rep['confirm_messages_url'])
    confirm = test_app.post_json(confirm_messages_url, {
        "ids": [new_post1_id]})
    assert confirm.status_code == 200
    discussion.db.flush()

    # Get it back
    get_back = test_app.get(confirm_messages_url)
    assert get_back.status_code == 200
    assert get_back.json == [new_post1_id]

    # The first idea should now be unhidden, but not the second
    new_post1 = Post.get_instance(new_post1_id)
    assert not new_post1.hidden
    new_post2 = Post.get_instance(new_post2_id)

    def clear_data():
        print "finalizing test data"
        test_session.delete(new_post1)
        test_session.delete(new_post2)
        test_session.delete(new_idea1.proposed_in_post)
        test_session.delete(new_idea2.proposed_in_post)
        test_session.flush()
    request.addfinalizer(clear_data)
    assert new_post2.hidden

    # Get the notifications
    notifications = test_app.get(
        '/data/Discussion/%d/notifications' % discussion.id)
    assert notifications.status_code == 200
    notifications = notifications.json

    # Only one active session
    assert len(notifications) == 1
    notification = notifications[0]
    print notification
    assert notification['widget_url']
    assert notification['time_to_end'] > 23 * 60 * 60
    assert notification['num_participants'] == 2  # participant and admin
    assert notification['num_ideas'] == 2


def test_inspiration_widget(
        discussion, test_app, subidea_1, subidea_1_1,
        participant1_user, test_session):
    # Post the initial configuration
    format = lambda x: x.strftime('%Y-%m-%dT%H:%M:%S')
    new_widget_loc = test_app.post(
        '/data/Discussion/%d/widgets' % (discussion.id,), {
            'type': 'InspirationWidget',
            'settings': json.dumps({
                'idea': 'local:Idea/%d' % (subidea_1.id)
            })
        })
    assert new_widget_loc.status_code == 201

    # Get the widget from the db
    discussion.db.flush()
    widget_uri = new_widget_loc.location
    new_widget = Widget.get_instance(widget_uri)
    assert new_widget
    assert new_widget.base_idea == subidea_1
    widget_id = new_widget.id

    # There should be a link
    widget_link = discussion.db.query(BaseIdeaWidgetLink).filter_by(
        idea_id=subidea_1.id, widget_id=widget_id).all()
    assert widget_link
    assert len(widget_link) == 1

    # Get the widget from the api
    widget_rep = test_app.get(
        local_to_absolute(widget_uri),
        headers={"Accept": "application/json"}
    )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    print widget_rep
    assert 'messages_url' in widget_rep
    assert 'ideas_url' in widget_rep
    assert 'user' in widget_rep

    # Get the list of new ideas
    # should be empty, despite the idea having a non-widget child
    idea_endpoint = local_to_absolute(widget_rep['ideas_url'])
    idea_hiding_endpoint = local_to_absolute(widget_rep['ideas_hiding_url'])
    test = test_app.get(idea_endpoint)
    assert test.status_code == 200
    assert test.json == []

    discussion.db.flush()
    assert new_widget.base_idea == subidea_1
    return

    # WEIRD virtuoso crash in the tests here,
    # dependent on previous tests being run.
    ancestor_widgets = test_app.get(
        '/data/Discussion/%d/ideas/%d/ancestor_inspiration_widgets/' % (
            discussion.id, subidea_1_1.id))
    assert ancestor_widgets.status_code == 200
    ancestor_widgets_rep = ancestor_widgets.json
    assert new_widget_loc.location in ancestor_widgets_rep

    # TODO. ajouter la collection descendant_ideas.
    # Comment déduire cet URL du widget????
    r = test_app.post(
        '/data/Discussion/%d/widgets/%d/base_idea_descendants/%d/linkedposts' %
        (discussion.id, widget_id, subidea_1_1.id), {
            "type": "WidgetPost",
            "body": {"@type": "LangString", "entries": [{
                "@type": "LangStringEntry", "value": "body",
                "@language": "en"
            }]}, "creator_id": participant1_user.id,
            "metadata_json": {
                "inspiration_url":
                    "https://www.youtube.com/watch?v=7E2FUSYO374"}})
    assert r.ok
    post_location = r.location
    post = Post.get_instance(post_location)
    assert post
    assert post.widget
    assert post.metadata_json['inspiration_url']


def test_voting_widget(
        discussion, test_app, subidea_1_1, criterion_1, criterion_2,
        criterion_3, admin_user, participant1_user,
        test_session, request):
    # Post the initial configuration
    db = discussion.db
    criteria = (criterion_1, criterion_2, criterion_3)
    new_widget_loc = test_app.post(
        '/data/Discussion/%d/widgets' % (discussion.id,), {
            'type': 'MultiCriterionVotingWidget',
            'settings': json.dumps({
                "votable_root_id": subidea_1_1.uri()
            })
        })
    assert new_widget_loc.status_code == 201

    # Get the widget from the db
    db.flush()
    widget_uri = new_widget_loc.location
    new_widget = Widget.get_instance(widget_uri)
    assert new_widget
    assert new_widget.base_idea == subidea_1_1
    db.expire(new_widget, ('criteria', 'votable_ideas', 'vote_specifications'))

    # Get the widget from the api
    widget_rep = test_app.get(
        local_to_absolute(widget_uri),
        headers={"Accept": "application/json"}
    )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    votespecs_url = widget_rep.get('votespecs_url', None)
    assert votespecs_url
    votespecs_url = local_to_absolute(votespecs_url)

    # Add a first criterion
    vote_spec_1 = {
        '@type': 'LickertVoteSpecification',
        'minimum': 0,
        'maximum': 1,
        'criterion_idea': criterion_1.uri()
    }
    new_vote_spec_loc = test_app.post(
        votespecs_url, json.dumps(vote_spec_1),
        headers=JSON_HEADER)
    assert new_vote_spec_loc.status_code == 201
    new_vote_spec_uri = new_vote_spec_loc.location
    new_vote_spec = AbstractVoteSpecification.get_instance(new_vote_spec_uri)
    assert new_vote_spec

    # and another one
    vote_spec_2 = {
        '@type': 'BinaryVoteSpecification',
        'criterion_idea': criterion_2.uri()
    }
    new_vote_spec_loc = test_app.post(
        votespecs_url, json.dumps(vote_spec_2),
        headers=JSON_HEADER)
    assert new_vote_spec_loc.status_code == 201
    new_vote_spec_uri = new_vote_spec_loc.location
    new_vote_spec = AbstractVoteSpecification.get_instance(new_vote_spec_uri)
    assert new_vote_spec

    # and another one
    vote_spec_3 = {
        '@type': 'MultipleChoiceVoteSpecification',
        'num_choices': 5,
        'criterion_idea': criterion_3.uri()
    }
    new_vote_spec_loc = test_app.post(
        votespecs_url, json.dumps(vote_spec_3),
        headers=JSON_HEADER)
    assert new_vote_spec_loc.status_code == 201
    new_vote_spec_uri = new_vote_spec_loc.location
    new_vote_spec = AbstractVoteSpecification.get_instance(new_vote_spec_uri)
    assert new_vote_spec

    # Get an updated widget_rep with target
    widget_rep = test_app.get(
        local_to_absolute(widget_uri),
        {'target': subidea_1_1.uri()},
        headers={"Accept": "application/json"}
    )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    voting_urls = widget_rep['voting_urls']
    vote_spec_reps = widget_rep['vote_specifications']
    assert voting_urls

    # User votes should be empty
    user_votes_url = local_to_absolute(widget_rep['user_votes_url'])
    test = test_app.get(user_votes_url)
    assert test.status_code == 200
    assert len(test.json) == 0

    # Get the voting endpoint for each vote_spec, and post a vote.
    # Here we're using the voting_urls of the widget based on a single target;
    # The alternative is to look at the voting_urls of a vote_spec
    # and to get an url per target. The end result should be the same.
    for i, (vote_spec_id, voting_url) in enumerate(voting_urls.iteritems()):
        voting_url = local_to_absolute(voting_url)
        for spec in vote_spec_reps:
            if spec['@id'] == vote_spec_id:
                break
        else:
            assert False, "vote spec %s in voting_urls "\
                "but not in vote_specifications" % (vote_spec_id)
        vote_type = spec['vote_class']
        if vote_type == 'LickertIdeaVote':
            vote_range = spec['maximum'] - spec['minimum']
            value = spec['minimum'] + (i % vote_range)
        elif vote_type == 'BinaryIdeaVote':
            value = True
        elif vote_type == 'MultipleChoiceIdeaVote':
            value = (i % spec['num_choices'])

        test = test_app.post(voting_url, json.dumps({
            "@type": vote_type,
            "value": value,
        }), headers=JSON_HEADER)
        assert test.status_code == 201

    # Get them back
    test = test_app.get(user_votes_url)
    assert test.status_code == 200
    assert len(test.json) == len(vote_spec_reps)

    # Add votes for another user
    # TODO
    # Get vote results.
    vote_results_urls = widget_rep['voting_results_by_spec_url']
    for spec_rep in vote_spec_reps:
        assert spec_rep['@id'] in vote_results_urls
        vote_results_url = vote_results_urls.get(spec_rep['@id'], None)
        assert vote_results_url
        vote_results = test_app.get(local_to_absolute(vote_results_url))
        assert vote_results.status_code == 200
        vote_results = vote_results.json
        assert vote_results[subidea_1_1.uri()]['n'] == 1
        if spec_rep['@type'] == "LickertVoteSpecification":
            assert vote_results[subidea_1_1.uri()]['avg'] == 0
    return
    # So far so good, rest to be done.

    # Change my mind
    criterion_key = criteria[0].uri()
    voting_url = local_to_absolute(voting_urls[criterion_key])
    test_app.post(voting_url, {
        "type": "LickertIdeaVote", "value": 10})
    votes = db.query(AbstractIdeaVote).filter_by(
        voter_id=admin_user.id, idea_id=subidea_1_1.id,
        criterion_id=criteria[0].id).all()
    assert len(votes) == 2
    assert len([v for v in votes if v.is_tombstone]) == 1
    for v in votes:
        assert v.widget_id == new_widget.id
    # Get vote results again.
    vote_results_urls = widget_rep['voting_results_by_spec_url']
    for spec_rep in vote_spec_reps:
        assert spec_rep['@id'] in vote_results_urls
        vote_results_url = vote_results_urls.get(spec_rep['@id'], None)
        assert vote_results_url
        vote_results = test_app.get(local_to_absolute(vote_results_url))
        assert vote_results.status_code == 200
        vote_results = vote_results.json
        assert vote_results[subidea_1_1.uri()]['n'] == 1
        if spec_rep['@type'] == "LickertVoteSpecification":
            assert vote_results[subidea_1_1.uri()]['avg'] == 10

    # ideas_data = test_app.get('/api/v1/discussion/%d/ideas' % discussion.id)
    # assert ideas_data.status_code == 200
    # print ideas_data

    def fin():
        print "finalizer test_voting_widget"
        new_widget.delete()
        # this should cascade to specs and votes
        test_session.flush()
    request.addfinalizer(fin)


def DISABLEDtest_voting_widget_criteria(
        discussion, test_app, subidea_1_1, criterion_1, criterion_2,
        criterion_3, admin_user, participant1_user,
        test_session):
    # Post the initial configuration
    db = discussion.db
    criteria = (criterion_1, criterion_2)
    criteria_def = [
        {
            "@id": criterion.uri(),
            "short_title": criterion.short_title
        } for criterion in criteria
    ]
    new_widget_loc = test_app.post(
        '/data/Discussion/%d/widgets' % (discussion.id,), {
            'type': 'MultiCriterionVotingWidget',
            'settings': json.dumps({
                "criteria": criteria_def
            })
        })
    assert new_widget_loc.status_code == 201
    # Get the widget from the db
    db.flush()
    new_widget = Widget.get_instance(new_widget_loc.location)
    assert new_widget
    db.expire(new_widget, ('criteria', ))
    # Get the widget from the api
    widget_rep = test_app.get(
        local_to_absolute(new_widget.uri()),
        {'target': subidea_1_1.uri()},
        headers={"Accept": "application/json"}
    )
    assert widget_rep.status_code == 200
    widget_rep = widget_rep.json
    voting_urls = widget_rep['voting_urls']
    assert voting_urls
    assert widget_rep['criteria']
    assert widget_rep['criteria_url']

    # Note: At this point, we have two copies of the criteria in the rep.
    # One is the full ideas in widget_rep['criteria'], the other is
    # as specified originally in widget_rep['settings']['criteria'].
    # In what follows I'll use the former.

    # The criteria should also be in the criteria url
    criteria_url = local_to_absolute(widget_rep['criteria_url'])
    test = test_app.get(criteria_url)
    assert test.status_code == 200
    assert len(test.json) == 2
    assert {x['@id'] for x in test.json} == {c.uri() for c in criteria}
    assert test.json == widget_rep['criteria']

    # Set a new set of criteria
    criteria = (criterion_2, criterion_3)
    criteria_def = [
        {
            "@id": criterion.uri(),
            "short_title": criterion.short_title
        } for criterion in criteria
    ]
    test_app.put(criteria_url, json.dumps(criteria_def),
                 headers=JSON_HEADER)
    db.flush()
    db.expire(new_widget, ('criteria', ))

    # Get them back
    test = test_app.get(criteria_url)
    assert test.status_code == 200
    assert len(test.json) == 2
    assert {x['@id'] for x in test.json} == {c.uri() for c in criteria}


def test_add_user_description(test_app, discussion, participant1_user):
    url = "/data/AgentProfile/%d" % (participant1_user.id,)
    description = 'Lorem ipsum Aliqua est irure eu id.'

    # Add the description
    r = test_app.put(url, {'description': description})
    assert r.status_code == 200

    # Check it
    r = test_app.get(url)
    assert r.status_code == 200
    res_data = json.loads(r.body)
    assert res_data['description'] == description


def test_add_partner_organization(test_app, discussion):
    url = "/data/Discussion/%d/partner_organizations/" % (discussion.id,)
    org = {
        'name': "Our organizer",
        'description': "We organize discussions!",
        'logo': "http://example.org/logo.png",
        'homepage': "http://example.org/",
        'is_initiator': True
    }

    # Create the org
    r = test_app.post(url, org)
    assert r.status_code == 201

    # Check it
    link = local_to_absolute(r.location)
    r = test_app.get(link)
    assert r.status_code == 200
    res_data = json.loads(r.body)
    for k, v in org.iteritems():
        assert res_data[k] == v


def test_add_timeline_event(test_app, discussion):
    url = "/data/Discussion/%d/timeline_events" % (discussion.id,)
    phase1 = {
        '@type': "DiscussionPhase",
        'title': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "phase 1",
                "@language": "en"}]},
        'description': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "A first exploratory phase",
                "@language": "en"}]},
        'start': "20141231T09:00:00Z"
    }

    # Create the phase
    r = test_app.post_json(url, phase1)
    assert r.status_code == 201
    uri1 = r.location
    discussion.db.flush()

    # Create phase2
    phase2 = {
        '@type': "DiscussionPhase",
        'title': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "phase 2",
                "@language": "en"}]},
        'description': {
            "@type": "LangString",
            "entries": [{
                "@type": "LangStringEntry",
                "value": "A second divergent phase",
                "@language": "en"}]},
        'previous_event': uri1
    }

    # Create the phase
    r = test_app.post_json(url, phase2)
    assert r.status_code == 201
    discussion.db.flush()
    discussion.db.expunge_all()

    # Check it
    uri2 = r.location
    r = test_app.get(local_to_absolute(uri2))
    assert r.status_code == 200
    phase2_data = json.loads(r.body)

    # Get phase 1
    r = test_app.get(local_to_absolute(uri1))
    assert r.status_code == 200
    phase1_data = json.loads(r.body)

    # check that the link was made in both directions
    assert phase1_data['next_event'] == phase2_data['@id']
    assert phase1_data['@type'] == 'DiscussionPhase'


def test_phase1_export(proposals_with_sentiments, discussion, test_app):

    THEMATIC_NAME = 0
    QUESTION_ID = 1
    QUESTION_TITLE = 2
    POST_BODY = 3
    POST_LIKE_COUNT = 4
    POST_DISAGREE_COUNT = 5
    POST_CREATOR_NAME = 6
    POST_CREATOR_EMAIL = 7
    POST_CREATION_DATE = 8
    SENTIMENT_ACTOR_NAME = 9
    SENTIMENT_ACTOR_EMAIL = 10
    SENTIMENT_CREATION_DATE = 11

    response = test_app.get(
        '/data/Discussion/{}/phase1_csv_export'.format(discussion.id))
    csv_file = BytesIO()
    csv_file.write(response.app_iter[0])
    csv_file.seek(0)
    assert response.status_code == 200
    result = csv.reader(csv_file, dialect='excel')
    result = list(result)

    header = result[0]
    assert header[QUESTION_ID] == b'Numéro de la question'
    assert header[SENTIMENT_ACTOR_NAME] == b"Nom du votant"

    first_row = result[1]
    assert first_row[THEMATIC_NAME] == b'Comprendre les dynamiques et les enjeux'
    assert first_row[QUESTION_TITLE] == b"Comment qualifiez-vous l'emergence "\
                                        b"de l'Intelligence Artificielle "\
                                        b"dans notre société ?"
    assert first_row[POST_BODY] == b'une proposition 14'
    assert first_row[POST_LIKE_COUNT] == b'0'
    assert first_row[POST_DISAGREE_COUNT] == b'0'
    assert first_row[POST_CREATOR_NAME] == b'Mr. Administrator'
    assert first_row[POST_CREATOR_EMAIL] == b''
    date = datetime.today().strftime('%d/%m/%Y')
    assert first_row[POST_CREATION_DATE].startswith(date)
    assert first_row[SENTIMENT_ACTOR_NAME] == b''
    assert first_row[SENTIMENT_ACTOR_EMAIL] == b''
    assert first_row[SENTIMENT_CREATION_DATE] == b''

    last_row = result[-1]
    assert last_row[THEMATIC_NAME] == b'Comprendre les dynamiques et les enjeux'
    assert last_row[POST_LIKE_COUNT] == b'1'
    assert last_row[POST_DISAGREE_COUNT] == b'0'
    assert last_row[SENTIMENT_ACTOR_NAME] == b'Mr. Administrator'
