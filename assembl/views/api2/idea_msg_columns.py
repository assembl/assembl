from pyramid.view import view_config
from pyramid.httpexceptions import HTTPOk

from assembl.models import IdeaMessageColumn
from ..traversal import InstanceContext, CollectionContext
from . import (
    FORM_HEADER, JSON_HEADER, instance_put_json, instance_put_form,
    collection_add_json, collection_add_with_params, instance_del)


@view_config(
    context=InstanceContext, request_method='DELETE', renderer='json',
    ctx_instance_class=IdeaMessageColumn)
def column_del(request):
    """Delete a column and adjust the next column's previous_column_id"""
    ctx = request.context
    instance = ctx._instance
    db = instance.db
    next_column = db.query(IdeaMessageColumn).filter_by(
        previous_column_id=instance.id).first()
    previous_id = instance.previous_column_id
    response = instance_del(request)
    if next_column and previous_id:
        db.flush()
        next_column.previous_column_id = previous_id
    return response


@view_config(
    context=InstanceContext, request_method='POST', renderer='json',
    ctx_instance_class=IdeaMessageColumn, name="reorder_up")
def column_reorder_up(request):
    """Switch this column with the previous column
    and adjust the next column's previous_column_id"""
    ctx = request.context
    instance = ctx._instance
    db = instance.db
    next_column = db.query(IdeaMessageColumn).filter_by(
        previous_column_id=instance.id).first()
    previous_column = instance.previous_column
    pre_previous_id = previous_column.previous_column_id
    # clear first to avoid index uniqueness checks
    previous_column.previous_column_id = None
    instance.previous_column_id = None
    if next_column:
        next_column.previous_column_id = None
    db.flush()
    instance.previous_column_id = pre_previous_id
    previous_column.previous_column_id = instance.id
    if next_column:
        next_column.previous_column_id = previous_column.id
    return HTTPOk()
