# -*- coding: utf-8 -*-
from sqlalchemy import desc

from assembl import models


def format_date(datetime_to_format):
    return datetime_to_format.strftime('%d/%m/%Y %H:%M')


def get_thematics(discussion_id, phase_id):
    """Get thematics."""
    model = models.Thematic
    query = model.query.filter(
        model.discussion_id == discussion_id
        ).filter(model.identifier == phase_id
        ).filter(model.hidden == False
        ).filter(model.tombstone_date == None
        ).order_by(model.id)

    return query


def get_question_posts(question):
    """Get posts for given question."""
    model = models.Post
    related = question.get_related_posts_query(True)
    query = model.query.join(
        related, model.id == related.c.post_id
        ).filter(model.publication_state == models.PublicationStates.PUBLISHED
        ).order_by(desc(model.creation_date), model.id)

    return query
