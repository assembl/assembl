# -*- coding: utf-8 -*-
from sqlalchemy import desc
from sqlalchemy.orm import contains_eager, joinedload, subqueryload

from assembl import models
from assembl.models.idea import MessageView
from assembl.models.post import deleted_publication_states
from assembl.models.timeline import Phases
from assembl.graphql.utils import get_root_thematic_for_phase


def format_date(datetime_to_format):
    return datetime_to_format.strftime('%d/%m/%Y')


def get_posts(idea, start=None, end=None, include_deleted=None):
    """
    Get all posts given a given idea filtered by start and end dates.
    @param: idea Idea
    @param: start datetime
    @param: end datetime
    """
    Post = models.Post
    related = idea.get_related_posts_query(True, include_moderating=False, include_deleted=include_deleted)
    query = Post.query.join(
        related, Post.id == related.c.post_id
        ).order_by(desc(Post.creation_date), Post.id
        ).options(subqueryload(Post.creator),
                  subqueryload(Post.creator, models.AgentProfile.accounts))
    if start is not None:
        query = query.filter(Post.creation_date >= start)

    if end is not None:
        query = query.filter(Post.creation_date <= end)

    return query


def get_published_top_posts(idea, start=None, end=None):
    Post = models.Post
    query = get_posts(idea, start, end, include_deleted=False)
    query = query.filter(Post.publication_state == models.PublicationStates.PUBLISHED)
    query = query.filter(Post.parent_id == None)  # noqa: E711
    return query


def get_published_posts(idea, start=None, end=None):
    """Get published posts for the given idea filtered by start and end dates.
    @param: idea Idea
    @param: start datetime
    @param: end datetime
    """
    query = get_posts(idea, start, end, include_deleted=False)
    query = query.filter(models.Post.publication_state == models.PublicationStates.PUBLISHED)
    return query


def get_deleted_posts(idea, start=None, end=None):
    """Get deleted posts for the given idea filtered by start and end dates.
    @param: idea Idea
    @param: start datetime
    @param: end datetime
    """
    # Don't use include_deleted=False here. A post can be deleted (publication_state) but not tombstoned
    query = get_posts(idea, start, end, include_deleted=None)
    query = query.filter(models.Post.publication_state.in_(deleted_publication_states))
    return query


def get_related_extracts(content):
    extracts = content.db.query(models.Extract
        ).filter(models.Extract.content_id == content.id)
    return extracts


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


def get_multicolumns_ideas(discussion, start=None, end=None):
    return get_ideas_for_export(discussion, MessageView.messageColumns.value, start=start, end=end)


def get_survey_ideas(discussion, start=None, end=None):
    return get_ideas_for_export(discussion, MessageView.survey.value, start=start, end=end)


def get_thread_ideas(discussion, start=None, end=None):
    return get_ideas_for_export(discussion, MessageView.thread.value, start=start, end=end)


def get_bright_mirror_ideas(discussion, start=None, end=None):
    return get_ideas_for_export(discussion, MessageView.brightMirror.value, start=start, end=end)


def get_vote_session_ideas(discussion, start=None, end=None):
    return get_ideas_for_export(discussion, MessageView.voteSession.value, start=start, end=end)


def get_ideas_for_export(discussion, module_type=None, start=None, end=None):
    ideas = []
    for phase in discussion.timeline_events:
        # If [start, end] and [phase.start, phase.end] don't overlap,
        # don't export the ideas.
        if phase.end < start or phase.start > end:
            continue

        root_thematic = get_root_thematic_for_phase(phase)
        if root_thematic is not None:
            ideas_query = get_ideas(phase)
            if module_type is None:
                ideas.extend(ideas_query.all())
            else:
                ideas.extend(ideas_query.filter(
                    models.Idea.message_view_override == module_type).all())

    return ideas


def get_ideas(phase, options=None):
    root_thematic = get_root_thematic_for_phase(phase)
    if root_thematic is None:
        return []

    model = models.Idea
    query = model.query
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
