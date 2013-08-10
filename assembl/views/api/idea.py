import json
import os

from cornice import Service
from pyramid.view import view_config
from pyramid.httpexceptions import HTTPNotFound
from pyramid.i18n import TranslationString as _
from assembl.views.api import FIXTURE_DIR, API_PREFIX

ideas = Service(name='ideas', path=API_PREFIX + '/ideas',
                 description="",
                 renderer='json')
idea = Service(name='idea', path=API_PREFIX + '/ideas/{id}',
                 description="Manipulate a single idea")

    
# Create
@ideas.post()
def create_idea(request):
    #data = json.loads(request.body)

    import time
    return {'id': int(time.time())}


@idea.get()
def get_idea(request):
    id = request.matchdict['id']
    return {'id': id, 'shortTitle': 'from server'}


@ideas.get()
def get_ideas(request):
    path = os.path.join(FIXTURE_DIR, 'ideas.json')
    f = open(path)
    data = json.loads(f.read())
    f.close()

    return data


# Update
@idea.put()
def save_idea(request):
    data = json.loads(request.body)

    return data

# Delete
# WE DON'T DELETE IDEAS. LIVE WITH IT
