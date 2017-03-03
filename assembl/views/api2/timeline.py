from pyramid.view import view_config
from pyramid.httpexceptions import HTTPOk

from assembl.models.timeline import TimelineEvent
from ..traversal import InstanceContext, CollectionContext
from . import (
    FORM_HEADER, JSON_HEADER, instance_put_json, instance_put_form,
    collection_add_json, collection_add_with_params, instance_del)


@view_config(
    context=InstanceContext, request_method='DELETE', renderer='json',
    ctx_instance_class=TimelineEvent)
def event_del(request):
    """Delete a timeline event and adjust the next events's previous_event_id"""
    ctx = request.context
    instance = ctx._instance
    db = instance.db
    next_event = db.query(TimelineEvent).filter_by(
        previous_event_id=instance.id).first()
    previous_id = instance.previous_event_id
    response = instance_del(request)
    if next_event and previous_id:
        db.flush()
        next_event.previous_event_id = previous_id
    return response


@view_config(
    context=InstanceContext, request_method='POST', renderer='json',
    ctx_instance_class=TimelineEvent, name="reorder_up")
def event_reorder_up(request):
    """Switch this event with the previous event
    and adjust the next event's previous_event_id"""
    ctx = request.context
    instance = ctx._instance
    db = instance.db
    next_event = db.query(TimelineEvent).filter_by(
        previous_event_id=instance.id).first()
    previous_event = instance.previous_event
    pre_previous_id = previous_event.previous_event_id
    # clear first to avoid index uniqueness checks
    previous_event.previous_event_id = None
    instance.previous_event_id = None
    if next_event:
        next_event.previous_event_id = None
    db.flush()
    instance.previous_event_id = pre_previous_id
    previous_event.previous_event_id = instance.id
    if next_event:
        next_event.previous_event_id = previous_event.id
    return HTTPOk()
