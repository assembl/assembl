# -*- coding: utf-8 -*-
from sqlalchemy import desc
from sqlalchemy.orm import contains_eager, joinedload, subqueryload

from assembl import models
from assembl.models.idea import MessageView
from assembl.models.timeline import Phases
from assembl.graphql.utils import get_root_thematic_for_phase


def format_date(datetime_to_format):
    return datetime_to_format.strftime('%d/%m/%Y %H:%M')


def get_published_posts(idea):
    """Get published posts for given idea."""
    Post = models.Post
    related = idea.get_related_posts_query(True, include_moderating=False)
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
            ~model.sqla_type.in_(('question', 'vote_proposal')),
            model.hidden == False,  # noqa: E712
            model.tombstone_date == None  # noqa: E711
        ).options(
            contains_eager(models.Idea.source_links),
            joinedload(models.Idea.title).joinedload("entries"),
            joinedload(models.Idea.description).joinedload("entries"),
        ).order_by(models.IdeaLink.order, models.Idea.creation_date)
    if options is not None:
        query = query.options(*options)

    return query


def get_posts_for_phases(
        discussion, identifiers, include_deleted=False, include_moderating=None):
    """Return related posts for the ideas with module type in `identifiers` on `discussion`.
    """
    if not discussion:
        return None

    module_types = identifiers[:]
    if Phases.multiColumns.value in module_types:
        # backward compatibility with bluenove-actionable
        module_types.remove(Phases.multiColumns.value)
        module_types.append(MessageView.messageColumns.value)

    ideas = []
    for phase in discussion.timeline_events:
        root_thematic = get_root_thematic_for_phase(phase)
        if root_thematic is not None:
            ideas_query = get_ideas(phase)
            ideas.extend(ideas_query.filter(
                models.Idea.message_view_override.in_(module_types)).all())

    if not ideas:
        return None

    model = models.AssemblPost
    query = discussion.db.query(model)
    queries = []
    for idea in ideas:
        # Note we are not sending user_id
        related = idea.get_related_posts_query(
            True, include_deleted, include_moderating)
        related_query = query.join(
            related, model.id == related.c.post_id
        )
        queries.append(related_query)

    query = queries[0].union_all(*queries[1:])
    if not include_deleted:
        return query.filter(
            model.publication_state == models.PublicationStates.PUBLISHED)

    return query
