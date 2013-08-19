import os
import json
import transaction

from cornice import Service

from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound
from pyramid.i18n import TranslationString as _
from pyramid.security import authenticated_userid

from assembl.views.api import FIXTURE_DIR, API_PREFIX
from assembl.db import DBSession
from assembl.synthesis.models import Extract

extracts = Service(
    name='extracts', 
    path=API_PREFIX + '/extracts',
    description="An extract from Content that is an expression of an Idea",
    renderer='json'
)

extract = Service(
    name='extract', 
    path=API_PREFIX + '/extracts/{id}',
    description="Manipulate a single extract"
)

@extract.get()
def get_extract(request):
    extract_id = request.matchdict['id']
    extract = DBSession.query(Extract).get(extract_id)

    return extract.serializable()


@extracts.get()
def get_extracts(request):
    user_id = authenticated_userid(request)

    extracts = DBSession.query(Extract).filter_by(
        owner_id=user_id
    ).order_by(Extract.order.desc())

    serializable_extracts = [
        extract.serializable() for extract in extracts
    ]

    serialized_extracts = json.dumps(serializable_extracts)

    return serialized_extracts


@extract.post()
def post_extract(request):
    """ The client decides the id here, 
    must handle the case where the object does and does not exist"""
    extract_data = json.loads(request.body)
    user_id = authenticated_userid(request)

    with transaction.manager:
        new_extract = Extract(
            creator_id = user_id,
            owner_id = user_id,
            body = extract_body.get('text', '').decode('utf-8'),
            source_id = extract_body.get('idPost')
        )

        DBSession.add(new_extract)

    new_extract = DBSession.merge(new_extract)

    return { 'ok': True, 'id': new_extract.id }


@extract.put()
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

        DBSession.add(extract)

    return { 'ok': True }


@extract.delete()
def delete_extract(request):
    extract_id = request.matchdict['id']
    extract = DBSession.query(Extract).get(extract_id)

    if not extract:
        return { 'ok': False }

    with transaction.manager:
        DBSession.delete(extract)

    return { 'ok': True }
