import os
import json

from cornice import Service
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound
from pyramid.i18n import TranslationString as _
from colander import Invalid
from assembl.views.api import FIXTURE_DIR, API_PREFIX
from assembl.synthesis.models import Extract
from assembl.db import DBSession

extracts = Service(name='extracts', path=API_PREFIX + '/extracts',
                 description="An extract from Content that is an expression of an Idea",
                 renderer='json')
extract = Service(name='extract', path=API_PREFIX + '/extracts/{id}',
                 description="Manipulate a single extract")

@extracts.get()
def get_extract(request):
    id = request.matchdict['id']
    return {'id': id, 'text': 'from server'}


@extracts.get()
def get_extracts(request):
    # path = os.path.join(FIXTURE_DIR, 'segments.json')
    # f = open(path)
    # data = json.loads(f.read())
    # f.close()

    query = DBSession.query(Extract)
    ca = Extract.__colanderalchemy__
    return [ca.serialize(ca.dictify(x)) for x in query]


# @extract.put(validator=Extract.__colanderalchemy__)
@extract.put()
def save_extract(request):
    """ The client decides the id here, 
    must handle the case where the object does and does not exist"""
    import bpdb; bpdb.set_trace()
    data = json.loads(request.body)
    ca = Extract.__colanderalchemy__
    try:
        data = ca.deserialize(data)
    except Invalid, e:
        return e.asdict()
    else:
        return data


@extract.delete()
def delete_extract(request):
    #data = json.loads(request.body)

    return {'ok': True}
