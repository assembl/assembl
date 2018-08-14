"""Cornice API for extracts"""

import simplejson as json
from cornice import Service
from pyramid.security import Everyone
from pyramid.httpexceptions import (
    HTTPNotFound, HTTPBadRequest, HTTPForbidden, HTTPServerError, HTTPNoContent)
from sqlalchemy import Unicode
from sqlalchemy.sql.expression import cast
from sqlalchemy.orm import joinedload_all

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.auth import (P_READ, P_ADD_EXTRACT, P_EDIT_EXTRACT, P_EDIT_MY_EXTRACT)
from assembl.models import (
    get_database_id, Extract, TextFragmentIdentifier,
    Discussion, AnnotatorSource, Post, Webpage, Idea)
from assembl.auth.util import (get_permissions, user_has_permission)
from assembl.lib.web_token import decode_token
from assembl.lib import sqla

cors_policy = dict(
    enabled=True,
    headers=('Location', 'Content-Type', 'Content-Length'),
    origins=('*',),
    credentials=True,
    max_age=86400)


extracts = Service(
    name='extracts',
    path=API_DISCUSSION_PREFIX + '/extracts',
    description="An extract from Content that is an expression of an Idea",
    renderer='json',
    cors_policy=cors_policy
)

extract = Service(
    name='extract',
    path=API_DISCUSSION_PREFIX + '/extracts/{id:.+}',
    description="Manipulate a single extract",
    renderer='json',
    cors_policy=cors_policy
)

search_extracts = Service(
    name='search_extracts',
    path=API_DISCUSSION_PREFIX + '/search_extracts',
    description="search for extracts matching a URL",
    renderer='json', cors_policy=cors_policy
)


@extract.get(permission=P_READ)
def get_extract(request):
    extract_id = request.matchdict['id']
    extract = Extract.get_instance(extract_id)
    view_def = request.GET.get('view') or 'default'
    discussion_id = int(request.matchdict['discussion_id'])
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, discussion_id)

    if extract is None:
        raise HTTPNotFound(
            "Extract with id '%s' not found." % extract_id)

    return extract.generic_json(view_def, user_id, permissions)


def _get_extracts_real(discussion, view_def='default', ids=None, user_id=None):
    user_id = user_id or Everyone
    all_extracts = discussion.db.query(Extract).filter(
        Extract.discussion_id == discussion.id
    )
    if ids:
        ids = [get_database_id("Extract", id) for id in ids]
        all_extracts = all_extracts.filter(Extract.id.in_(ids))


    all_extracts = all_extracts.options(joinedload_all(
        Extract.content))
    all_extracts = all_extracts.options(joinedload_all(
        Extract.text_fragment_identifiers))
    permissions = get_permissions(user_id, discussion.id)

    return [extract.generic_json(view_def, user_id, permissions)
            for extract in all_extracts]



@extracts.get(permission=P_READ)
def get_extracts(request):
    discussion_id = int(request.matchdict['discussion_id'])
    discussion = Discussion.get(int(discussion_id))
    if not discussion:
        raise HTTPNotFound(
            "Discussion with id '%s' not found." % discussion_id)
    view_def = request.GET.get('view')
    ids = request.GET.getall('ids')

    return _get_extracts_real(
        discussion, view_def, ids, request.authenticated_userid)


@extracts.post()
def post_extract(request):
    """
    Create a new extract.
    """
    extract_data = json.loads(request.body)
    discussion_id = int(request.matchdict['discussion_id'])
    user_id = request.authenticated_userid
    if not user_id:
        # Straight from annotator
        token = request.headers.get('X-Annotator-Auth-Token')
        if token:
            token = decode_token(
                token, request.registry.settings['session.secret'])
            if token:
                user_id = token['userId']
    user_id = user_id or Everyone
    if not user_has_permission(discussion_id, user_id, P_ADD_EXTRACT):
        #TODO: maparent:  restore this code once it works:
        #return HTTPForbidden(result=ACLDenied(permission=P_ADD_EXTRACT))
        return HTTPForbidden()
    if not user_id or user_id == Everyone:
        # TODO: Create an anonymous user.
        raise HTTPServerError("Anonymous extracts are not implemeted yet.")
    content = None
    uri = extract_data.get('uri')
    important = extract_data.get('important', False)
    annotation_text = None
    if uri:
        # Straight from annotator
        annotation_text = extract_data.get('text')
    else:
        target = extract_data.get('target')
        if not (target or uri):
            raise HTTPBadRequest("No target")

        target_class = sqla.get_named_class(target.get('@type'))
        if issubclass(target_class, Post):
            post_id = target.get('@id')
            post = Post.get_instance(post_id)
            if not post:
                raise HTTPNotFound(
                    "Post with id '%s' not found." % post_id)
            content = post
        elif issubclass(target_class, Webpage):
            uri = target.get('url')
    if uri and not content:
        content = Webpage.get_instance(uri)
        if not content:
            # TODO: maparent:  This is actually a singleton pattern, should be
            # handled by the AnnotatorSource now that it exists...
            source = AnnotatorSource.default_db.query(AnnotatorSource).filter_by(
                discussion_id=discussion_id).filter(
                cast(AnnotatorSource.name, Unicode) == 'Annotator').first()
            if not source:
                source = AnnotatorSource(
                    name='Annotator', discussion_id=discussion_id)
            content = Webpage(url=uri, discussion_id=discussion_id)
    extract_body = extract_data.get('quote', '')

    idea_id = extract_data.get('idIdea', None)
    if idea_id:
        idea = Idea.get_instance(idea_id)
        if(idea.discussion.id != discussion_id):
            raise HTTPBadRequest(
                "Extract from discussion %s cannot be associated with an idea from a different discussion." % extract.get_discussion_id())
    else:
        idea = None

    ranges = extract_data.get('ranges', [])
    extract_hash = Extract.get_extract_hash(
        None,
        u"".join([r['start'] for r in ranges]),
        u"".join([r['end'] for r in ranges]),
        u"".join([r['startOffset'] for r in ranges]),
        u"".join([r['endOffset'] for r in ranges]),
        content.id
        )
    new_extract = Extract(
        creator_id=user_id,
        owner_id=user_id,
        discussion_id=discussion_id,
        body=extract_body,
        idea=idea,
        important=important,
        annotation_text=annotation_text,
        content=content,
        extract_hash=extract_hash
    )
    Extract.default_db.add(new_extract)
    for range_data in ranges:
        range = TextFragmentIdentifier(
            extract=new_extract,
            xpath_start=range_data['start'],
            offset_start=range_data['startOffset'],
            xpath_end=range_data['end'],
            offset_end=range_data['endOffset'])
        TextFragmentIdentifier.default_db.add(range)

    Extract.default_db.flush()

    return {'ok': True, '@id': new_extract.uri()}


@extract.put()
def put_extract(request):
    """
    Updating an Extract
    """
    extract_id = request.matchdict['id']
    user_id = request.authenticated_userid
    discussion_id = int(request.matchdict['discussion_id'])

    if not user_id:
        # Straight from annotator
        token = request.headers.get('X-Annotator-Auth-Token')
        if token:
            token = decode_token(
                token, request.registry.settings['session.secret'])
            if token:
                user_id = token['userId']
    user_id = user_id or Everyone

    updated_extract_data = json.loads(request.body)
    extract = Extract.get_instance(extract_id)
    if not extract:
        raise HTTPNotFound("Extract with id '%s' not found." % extract_id)

    if not (user_has_permission(discussion_id, user_id, P_EDIT_EXTRACT)
        or (user_has_permission(discussion_id, user_id, P_EDIT_MY_EXTRACT)
            and user_id == extract.owner_id)):
        return HTTPForbidden()

    extract.owner_id = user_id or get_database_id("User", extract.owner_id)
    extract.order = updated_extract_data.get('order', extract.order)
    extract.important = updated_extract_data.get('important', extract.important)
    idea_id = updated_extract_data.get('idIdea', None)
    if idea_id:
        idea = Idea.get_instance(idea_id)
        if(idea.discussion != extract.discussion):
            raise HTTPBadRequest(
                "Extract from discussion %s cannot be associated with an idea from a different discussion." % extract.get_discussion_id())
        extract.idea = idea
    else:
        extract.idea = None

    Extract.default_db.add(extract)
    #TODO: Merge ranges. Sigh.

    return {'ok': True}


@extract.delete(permission=P_READ)
def delete_extract(request):
    user_id = request.authenticated_userid
    discussion_id = int(request.matchdict['discussion_id'])

    if not user_id:
        # Straight from annotator
        token = request.headers.get('X-Annotator-Auth-Token')
        if token:
            token = decode_token(
                token, request.registry.settings['session.secret'])
            if token:
                user_id = token['userId']
    user_id = user_id or Everyone

    extract_id = request.matchdict['id']
    extract = Extract.get_instance(extract_id)

    if not (user_has_permission(discussion_id, user_id, P_EDIT_EXTRACT)
        or (user_has_permission(discussion_id, user_id, P_EDIT_MY_EXTRACT)
            and user_id == extract.owner_id)):
        raise HTTPForbidden()

    if not extract:
        return HTTPNoContent()

    # TODO: Tombstonable extracts???
    extract.delete()
    return HTTPNoContent()


@search_extracts.get(permission=P_READ)
def do_search_extracts(request):
    uri = request.GET['uri']
    view_def = request.GET.get('view') or 'default'
    discussion_id = int(request.matchdict['discussion_id'])
    user_id = request.authenticated_userid or Everyone
    permissions = get_permissions(user_id, discussion_id)

    if not uri:
        return HTTPBadRequest("Please specify a search uri")
    content = Webpage.get_by(url=uri)
    if content:
        extracts = Extract.default_db.query(Extract).filter_by(content=content).all()
        rows = [
            extract.generic_json(view_def, user_id, permissions)
            for extract in extracts]
        return {"total": len(extracts), "rows": rows}
    return {"total": 0, "rows": []}
