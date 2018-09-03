# -*- coding: utf-8 -*-
from sqlalchemy import desc
from sqlalchemy.orm import contains_eager, joinedload, subqueryload

from assembl import models
from assembl.models.timeline import (
    Phases, PHASES_WITH_POSTS, get_phase_by_identifier)
from assembl.graphql.utils import get_root_thematic_for_phase


def format_date(datetime_to_format):
    return datetime_to_format.strftime('%d/%m/%Y %H:%M')


def get_published_posts(idea):
    """Get published posts for given idea."""
    Post = models.Post
    related = idea.get_related_posts_query(True)
    query = Post.query.join(
        related, Post.id == related.c.post_id
        ).filter(Post.publication_state == models.PublicationStates.PUBLISHED
        ).order_by(desc(Post.creation_date), Post.id
        ).options(subqueryload(Post.creator),
                  subqueryload(Post.creator, models.AgentProfile.accounts))

    return query


def get_all_phase_root_ideas(discussion):
    root_ideas = []
    for phase in discussion.timeline_phases:
        if phase.root_idea:
            root_ideas.append(phase.root_idea)

    return root_ideas


def get_descendants(ideas):
    if not ideas:
        return []

    descendants = []
    for idea in ideas:
        descendants.extend(idea.get_all_descendants(id_only=True, inclusive=True))

    return descendants


def get_ideas(phase, options=None):
    phase_identifier = phase.identifier
    root_thematic = get_root_thematic_for_phase(phase)
    discussion = phase.discussion
    if root_thematic is None:
        return []

    model = models.Idea
    query = model.query
    if discussion.root_idea == root_thematic:
        # thread phase is directly on discussion.root_idea,
        # we need to remove all descendants of all the other phases
        descendants_to_ignore = get_descendants(get_all_phase_root_ideas(discussion))
        descendants = root_thematic.get_all_descendants(id_only=True, inclusive=False)
        descendants = set(descendants) - set(descendants_to_ignore)
        query = query.filter(model.id.in_(descendants))
    else:
        descendants_query = root_thematic.get_descendants_query(inclusive=False)
        query = query.filter(model.id.in_(descendants_query))

    query = query.outerjoin(
            models.Idea.source_links
        ).filter(
            model.sqla_type != 'question',
            model.hidden == False,  # noqa: E712
            model.tombstone_date == None  # noqa: E711
        ).options(
            contains_eager(models.Idea.source_links),
            joinedload(models.Idea.title).joinedload("entries"),
            joinedload(models.Idea.description).joinedload("entries"),
        ).order_by(models.IdeaLink.order, models.Idea.creation_date)
    if options is not None:
        query = query.options(*options)

    if phase_identifier == Phases.multiColumns.value:
        # Filter out ideas that don't have columns.
        query = query.filter(
            models.Idea.message_view_override == 'messageColumns')

    return query


def get_posts_for_phases(discussion, identifiers, include_deleted=False):
    """Return related posts for the given phases `identifiers` on `discussion`.
    """
    # Retrieve the phases with posts
    identifiers_with_posts = [i for i in identifiers if i in PHASES_WITH_POSTS]
    if not discussion or not identifiers_with_posts:
        return None

    ideas = []
    # If survey phase, we need the root thematic
    if Phases.survey.value in identifiers_with_posts:
        survey_phase = get_phase_by_identifier(discussion, Phases.survey.value)
        if survey_phase:
            root_thematic = get_root_thematic_for_phase(survey_phase)
            if root_thematic:
                ideas.append(root_thematic)

        identifiers_with_posts.remove(Phases.survey.value)

    if identifiers_with_posts:
        # If we have both 'thread' and 'multiColumns' in identifiers_with_posts
        # use get_ideas with 'thread' phase to get all ideas.
        # If only 'multiColumns' in identifiers_with_posts, use 'multiColumns' phase.
        # Ideas from 'multiColumns' phase are a subset of the ideas
        # from 'thread' phase
        is_multi_columns = Phases.multiColumns.value in identifiers_with_posts and \
            len(identifiers_with_posts) == 1
        if is_multi_columns:
            multi_columns_phase = get_phase_by_identifier(discussion, Phases.multiColumns.value)
            if multi_columns_phase:
                ideas.extend(get_ideas(multi_columns_phase).all())
        else:
            thread_phase = get_phase_by_identifier(discussion, Phases.thread.value)
            if thread_phase:
                ideas.extend(get_ideas(thread_phase).all())

    if not ideas:
        return None

    model = models.AssemblPost
    query = discussion.db.query(model)
    queries = []
    for idea in ideas:
        related = idea.get_related_posts_query(True)
        related_query = query.join(
            related, model.id == related.c.post_id
        )
        queries.append(related_query)

    query = queries[0].union_all(*queries[1:])
    if not include_deleted:
        return query.filter(
            model.publication_state == models.PublicationStates.PUBLISHED)

    return query
