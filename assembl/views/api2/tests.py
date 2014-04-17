# -*- coding: utf-8 -*-

import uuid
import json
import transaction
import traceback
from urllib import urlencode
import pdb

import pytest

from assembl.source.models import PostSource, Content, Post
from assembl.synthesis.models import (
    Idea,
    TableOfContents,
    Discussion,
    Extract,
    SubGraphIdeaAssociation
)
from assembl.auth.models import (
    AgentProfile, User, Role, UserRole, Username, R_SYSADMIN,
    create_default_permissions, populate_default_permissions,
    populate_default_roles, Permission)


def test_get_ideas(discussion, test_app, synthesis_1, subidea_1_1_1, test_session):
    all_ideas = test_app.get('/data/Idea')
    assert all_ideas.status_code == 200
    all_ideas = all_ideas.json
    disc_ideas = test_app.get('/data/Discussion/%d/ideas' % (discussion.id,))
    assert disc_ideas.status_code == 200
    disc_ideas = disc_ideas.json
    assert set(all_ideas) == set(disc_ideas)
    synthesis_ideasassocs = test_app.get('/data/Discussion/%d/views/%d/idea_assocs' % (discussion.id, synthesis_1.id))
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
