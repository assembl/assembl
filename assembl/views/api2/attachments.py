from pyramid.view import view_config
from pyramid.response import Response
from pyramid.httpexceptions import HTTPServerError, HTTPBadRequest
from pyramid.security import authenticated_userid, Everyone

from assembl.auth import P_READ, P_ADD_POST
from assembl.models import File, Document, Discussion
from assembl.auth.util import get_permissions
from assembl.views.traversal import InstanceContext, CollectionContext
from . import MULTIPART_HEADER, update_from_form


@view_config(context=InstanceContext, request_method='GET',
             permission=P_READ, ctx_instance_class=File,
             name='data')
def get_file(request):
    ctx = request.context
    document = ctx._instance
    f = File.get(document.id)
    return Response(body=f.data, content_type=str(f.mime_type))

# Maybe have a permission for uploading content??


@view_config(context=CollectionContext, request_method='POST',
             header=MULTIPART_HEADER, permission=P_ADD_POST,
             ctx_collection_class=Document, renderer='json')
def upload_file(request):
    """
    POSTing a file upload is very different than any other endpoint in assembl
    API because all of the content will be passed in using a MULTIPART_HEADER,
    with all of data as well as the file (along with its metadata)
    """
    # Any permission checking required here??

    db = Document.default_db
    ctx = request.context
    user_id = authenticated_userid(request) or Everyone
    discusison_id = ctx.get_discussion_id()
    discussion = Discussion.get(discusison_id)
    permissions = get_permissions(user_id, discusison_id)

    mime = request.POST['mime_type']
    file_name = request.POST['name']
    with request.POST['file'].file as f:
        data = f.read()

    # Check if the file has previously existed, if so, change the name by appending "(n)"
    # to it's name

    try:
        blob = File(discussion=discussion,
                    mime_type=mime,
                    title=file_name,
                    data=data)
        db.add(blob)
        db.flush()
    except:
        raise HTTPServerError

    view = 'default'
    return blob.generic_json(view, user_id, permissions)


@view_config(context=InstanceContext, request_method=('PUT', 'PATCH'),
             header=MULTIPART_HEADER, permission=P_ADD_POST,
             ctx_instance_class=Document, renderer='json')
def update_upload_file(request):
    ctx = request.context
    instance = ctx._instance
    user_id = authenticated_userid(request) or Everyone
    try:
        form_data = request.POST
        # form_data['title'] = form_data['name']
        # with request.POST['file'].file as f:
        #     data = f.read()
        # form_data['data'] = data

        # discussion = discussionssion.get(discussion_id)
        # form_data['discussion'] = discussion

        new_form = {
            'title': form_data['name']
        }
        # On a PUT operation, remove all of the keys from the form_data, except for
        # title (the name of the file. That's the only thing that the user can change
        # in the future)
        update_from_form(instance, new_form)
    except:
        raise HTTPServerError
