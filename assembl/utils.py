# -*- coding: utf-8 -*-
from sqlalchemy import desc
from sqlalchemy.orm import contains_eager, joinedload, subqueryload

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
    Post = models.Post
    related = idea.get_related_posts_query(True)
    query = Post.query.join(
        related, Post.id == related.c.post_id
        ).filter(Post.publication_state == models.PublicationStates.PUBLISHED
        ).order_by(desc(Post.creation_date), Post.id
        ).options(subqueryload(Post.creator),
                  subqueryload(Post.creator, models.AgentProfile.accounts))

    return query


def get_ideas(discussion_id, phase_id):
    model = models.Idea
    query = model.query
    discussion = models.Discussion.get(discussion_id)
    descendants_query = discussion.root_idea.get_descendants_query(
        inclusive=False)
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
