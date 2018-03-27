from datetime import datetime, timedelta

from pyramid.view import view_config
from pyramid.response import Response, FileIter, _BLOCK_SIZE
from pyramid.httpexceptions import (
    HTTPServerError, HTTPNotAcceptable, HTTPRequestRangeNotSatisfiable)
from pyramid.security import Everyone
from pyramid.settings import asbool
from pyramid.compat import url_quote

from assembl.lib import config
from assembl.auth import P_READ, P_ADD_POST
from assembl.models import File, Document, Discussion
from assembl.auth.util import get_permissions
from assembl.views.traversal import InstanceContext, CollectionContext
from assembl.lib.raven_client import capture_message
from . import MULTIPART_HEADER, update_from_form


@view_config(context=InstanceContext, request_method='DELETE',
             permission=P_READ, ctx_instance_class=Document,
             renderer='json')
def delete_file(request):
    # If there is no attachment, delete it and return positive.
    # Else, just return blank.
    # This API endpoint should never fail
    ctx = request.context
    db = Document.default_db
    document = ctx._instance
    attachments = document.attachments
    identity = None
    if isinstance(document, File):
        identity = document.file_identity
        count = document.count_other_files()
    try:
        if not attachments:
            db.delete(document)
            db.flush()
    except:
        capture_message("[HTTP DELETE] Failed to delete Document %d" %
                        document.id)
    if identity and not count:
        document.delete_file_by_id(identity)

    return {}


@view_config(context=InstanceContext, request_method='HEAD',
             permission=P_READ, ctx_instance_class=File,
             name='data')
def get_file_header(request):
    ctx = request.context
    document = ctx._instance
    f = File.get(document.id)
    if f.infected:
        raise HTTPNotAcceptable("Infected with a virus")
    handoff_to_nginx = asbool(config.get('handoff_to_nginx', False))

    return Response(
        content_length=f.size,
        content_type=str(f.mime_type),
        last_modified=f.creation_date,
        expires=datetime.now()+timedelta(days=365),
        accept_ranges="bytes" if handoff_to_nginx else "none",
    )


@view_config(context=InstanceContext, request_method='GET',
             permission=P_READ, ctx_instance_class=File,
             name='data')
def get_file(request):
    # TODO: Add a route that enables the call to have the filename
    # appended to the end. This is so that gmail can read the services
    # Read more here:
    # http://stackoverflow.com/questions/20903967/gmails-new-image-caching-is-breaking-image-links-in-newsletter
    ctx = request.context
    document = ctx._instance
    f = File.get(document.id)
    if f.infected:
        raise HTTPNotAcceptable("Infected with a virus")
    escaped_double_quotes_filename = (f.title
        .replace(u'"', u'\\"')
        .encode('iso-8859-1', 'replace'))
    url_quoted_utf8_filename = url_quote(f.title.encode('utf-8'))
    handoff_to_nginx = asbool(config.get('handoff_to_nginx', False))
    if handoff_to_nginx:
        kwargs = dict(body='')
    else:
        if 'Range' in request.headers:
            raise HTTPRequestRangeNotSatisfiable()
        fs = open(f.path, 'rb')
        app_iter = None
        environ = request.environ
        if 'wsgi.file_wrapper' in environ:
            app_iter = environ['wsgi.file_wrapper'](fs, _BLOCK_SIZE)
        if app_iter is None:
            app_iter = FileIter(fs, _BLOCK_SIZE)
        kwargs=dict(app_iter=app_iter)

    r = Response(
        content_length=f.size,
        content_type=str(f.mime_type),
        last_modified=f.creation_date,
        expires=datetime.now()+timedelta(days=365),
        accept_ranges="bytes" if handoff_to_nginx else "none",
        content_disposition=
            'attachment; filename="%s"; filename*=utf-8\'\'%s' # RFC 6266
            % (escaped_double_quotes_filename, url_quoted_utf8_filename),
        **kwargs
    )
    if handoff_to_nginx:
        r.headers[b'X-Accel-Redirect'] = f.handoff_url
    return r


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

    # Testing purposes on front-end
    # raise Exception("Upload file exception occured!")

    db = Document.default_db
    ctx = request.context
    user_id = request.authenticated_userid or Everyone
    discusison_id = ctx.get_discussion_id()
    discussion = Discussion.get(discusison_id)
    permissions = get_permissions(user_id, discusison_id)

    mime = request.POST['mime_type']
    file_name = request.POST['name']

    # Check if the file has previously existed, if so, change the name by appending "(n)"
    # to it's name

    try:
        blob = File(discussion=discussion,
                    mime_type=mime,
                    title=file_name)
        db.add(blob)
        with request.POST['file'].file as f:
            blob.add_file_data(f)
        db.flush()
    except Exception as e:
        raise HTTPServerError(e)

    view = 'default'
    return blob.generic_json(view, user_id, permissions)


@view_config(context=InstanceContext, request_method=('PUT', 'PATCH'),
             header=MULTIPART_HEADER, permission=P_ADD_POST,
             ctx_instance_class=Document, renderer='json')
def update_upload_file(request):
    ctx = request.context
    instance = ctx._instance
    user_id = request.authenticated_userid or Everyone
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
