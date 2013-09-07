import json
import transaction

from cornice import Service

from pyramid.security import authenticated_userid

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.db import DBSession
from assembl.synthesis.models import Extract
from . import acls
from assembl.auth import (
    P_READ, P_ADD_EXTRACT, P_EDIT_EXTRACT, P_DELETE_EXTRACT)


extracts = Service(
    name='extracts',
    path=API_DISCUSSION_PREFIX + '/extracts',
    description="An extract from Content that is an expression of an Idea",
    renderer='json', acl=acls
)

extract = Service(
    name='extract',
    path=API_DISCUSSION_PREFIX + '/extracts/{id}',
    description="Manipulate a single extract",
    acl=acls
)


@extract.get()  # permission=P_READ
def get_extract(request):
    extract_id = request.matchdict['id']
    extract = DBSession.query(Extract).get(extract_id)

    return extract.serializable()


@extracts.get()  # permission=P_READ
def get_extracts(request):
    user_id = authenticated_userid(request)

    extracts = DBSession.query(Extract).filter_by(
        owner_id=user_id
    ).order_by(Extract.order.desc())

    serializable_extracts = [
        extract.serializable() for extract in extracts
    ]

    return serializable_extracts


@extracts.post()  # permission=P_ADD_EXTRACT
def post_extract(request):
    """
    Create a new extract.
    """
    extract_data = json.loads(request.body)
    user_id = authenticated_userid(request)

    with transaction.manager:
        new_extract = Extract(
            creator_id=user_id,
            owner_id=user_id,
            body=extract_data.get('text', '').decode('utf-8'),
            source_id=extract_data.get('idPost')
        )

        DBSession.add(new_extract)

    new_extract = DBSession.merge(new_extract)

    return {'ok': True, 'id': new_extract.id}


@extract.put()  # permission=P_EDIT_EXTRACT
def put_extract(request):
    """
    Updating an Extract
    """
    extract_id = request.matchdict['id']
    user_id = authenticated_userid(request)

    updated_extract_data = json.loads(request.body)
    extract = DBSession.query(Extract).get(extract_id)

    with transaction.manager:
        extract.owner_id = user_id or extract.owner_id
        extract.order = updated_extract_data.get('order', extract.order)
        extract.idea_id = updated_extract_data['idIdea']

        DBSession.add(extract)

    return {'ok': True}


@extract.delete()  # permission=P_DELETE_EXTRACT
def delete_extract(request):
    extract_id = request.matchdict['id']
    extract = DBSession.query(Extract).get(extract_id)

    if not extract:
        return {'ok': False}

    with transaction.manager:
        DBSession.delete(extract)

    return {'ok': True}
