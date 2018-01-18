# -*- coding: utf-8 -*-
from sqlalchemy import desc
from sqlalchemy.orm import contains_eager, joinedload

from assembl import models


def format_date(datetime_to_format):
    return datetime_to_format.strftime('%d/%m/%Y %H:%M')


def get_thematics(discussion_id, phase_id):
    """Get thematics."""
    model = models.Thematic
    query = model.query.filter(
        model.discussion_id == discussion_id
        ).filter(model.identifier == phase_id
        ).filter(model.hidden == False  # noqa: E712
        ).filter(model.tombstone_date == None
        ).order_by(model.id)

    return query


def get_published_posts(idea):
    """Get published posts for given idea."""
    model = models.Post
    related = idea.get_related_posts_query(True)
    query = model.query.join(
        related, model.id == related.c.post_id
        ).filter(model.publication_state == models.PublicationStates.PUBLISHED
        ).order_by(desc(model.creation_date), model.id)

    return query


def get_ideas(discussion_id, phase_id):
    model = models.Idea
    query = model.query
    discussion = models.Discussion.get(discussion_id)
    root_idea_id = discussion.root_idea.id
    descendants_query = model.get_descendants_query(
        root_idea_id, inclusive=False)
    query = query.outerjoin(
            models.Idea.source_links
        ).filter(model.id.in_(descendants_query)
        ).filter(
            model.hidden == False,  # noqa: E712
            model.sqla_type == 'idea',
            model.tombstone_date == None  # noqa: E711
        ).options(
            contains_eager(models.Idea.source_links),
            joinedload(models.Idea.title).joinedload("entries"),
            joinedload(models.Idea.description).joinedload("entries"),
        ).order_by(models.IdeaLink.order, models.Idea.creation_date)
    if phase_id == 'multiColumns':
        # Filter out ideas that don't have columns.
        query = query.filter(
            models.Idea.message_view_override == 'messageColumns')
    return query
