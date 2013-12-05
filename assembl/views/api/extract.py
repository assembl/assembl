import json
import transaction

from cornice import Service
from webob import exc

from pyramid.security import authenticated_userid
from pyramid.httpexceptions import HTTPNotFound, HTTPClientError
from sqlalchemy.orm import aliased, joinedload, joinedload_all, contains_eager

from assembl.views.api import API_DISCUSSION_PREFIX
from assembl.models import (
    get_named_object, get_database_id, Extract, TextFragmentIdentifier,
    AgentProfile, User, Source, Content, Post, Webpage)
from . import acls
from assembl.auth import (
    P_READ, P_ADD_EXTRACT, P_EDIT_EXTRACT, P_DELETE_EXTRACT)
from assembl.auth.token import decode_token


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
    renderer='json', acl=acls, cors_policy=cors_policy
)

extract = Service(
    name='extract',
    path=API_DISCUSSION_PREFIX + '/extracts/{id:.+}',
    description="Manipulate a single extract",
    acl=acls, cors_policy=cors_policy
)

search_extracts = Service(
    name='search_extracts',
    path=API_DISCUSSION_PREFIX + '/search_extracts',
    description="search for extracts matching a URL",
    renderer='json', acl=acls, cors_policy=cors_policy
)


@extract.get(permission=P_READ)
def get_extract(request):
    extract_id = request.matchdict['id']
    extract = Extract.get_instance(extract_id)

    if extract is None:
        raise exc.HTTPNotFound()

    return extract.serializable()


@extracts.get(permission=P_READ)
def get_extracts(request):
    discussion_id = int(request.matchdict['discussion_id'])

    all_extracts = Extract.db.query(Extract).join(
        Content,
        Source
    ).filter(
        Source.discussion_id == discussion_id,
        Content.source_id == Source.id
    )
    # all_extracts = all_extracts.options(joinedload_all(
    #     Extract.source, Content.post, Post.creator))
    all_extracts = all_extracts.options(joinedload_all(
        Extract.creator, AgentProfile.user))
    serializable_extracts = [
        extract.serializable() for extract in all_extracts
    ]

    return serializable_extracts


@extracts.post()  # permission=P_ADD_EXTRACT
def post_extract(request):
    """
    Create a new extract.
    """
    extract_data = json.loads(request.body)
    print "post_extract:", extract_data
    user_id = authenticated_userid(request)
    # TODO: Handle unauthenticated user.
    content = None
    uri = extract_data.get('uri')
    annotation_text = None
    if uri:
        # Straight from annotator
        token = request.headers.get('X-Annotator-Auth-Token')
        if token:
            token = decode_token(
                token, request.registry.settings['session.secret'])
            if token:
                user_id = token['userId']
        annotation_text = extract_data.get('text')
    else:
        target = extract_data.get('target')
        if not (target or uri):
            raise HTTPClientError("No target")

        target_type = target.get('@type')
        if target_type == 'email':
            post_id = target.get('@id')
            post = Post.get_instance(post_id)
            if not post:
                raise HTTPNotFound(
                    "Post with id '%s' not found." % post_id)
            content = post.content
        elif target_type == 'webpage':
            uri = target.get('url')
    if uri and not content:
        content = Webpage.get_instance(uri)
        if not content:
            discussion_id = int(request.matchdict['discussion_id'])
            source = Source.get(name='Annotator', discussion_id=discussion_id)
            if not source:
                source = Source(
                    name='Annotator', discussion_id=discussion_id,
                    type='source')
            content = Webpage(url=uri, source=source)
    extract_body = extract_data.get('quote', '')
    new_extract = Extract(
        creator_id=user_id,
        owner_id=user_id,
        body=extract_body,
        annotation_text=annotation_text,
        source=content
    )
    Extract.db.add(new_extract)

    for range_data in extract_data.get('ranges', []):
        range = TextFragmentIdentifier(
            extract=new_extract,
            xpath_start=range_data['start'],
            offset_start=range_data['startOffset'],
            xpath_end=range_data['end'],
            offset_end=range_data['endOffset'])
        TextFragmentIdentifier.db.add(range)
    Extract.db.flush()

    return {'ok': True, 'id': new_extract.id}


@extract.put()  # permission=P_EDIT_EXTRACT
def put_extract(request):
    """
    Updating an Extract
    """
    extract_id = request.matchdict['id']
    user_id = authenticated_userid(request)

    updated_extract_data = json.loads(request.body)
    extract = Extract.get_instance(extract_id)
    if not extract:
        raise HTTPNotFound("Extract with id '%s' not found." % extract_id)

    extract.owner_id = user_id or get_database_id(extract.owner_id)
    extract.order = updated_extract_data.get('order', extract.order)
    extract.idea_id = get_database_id(updated_extract_data['idIdea'])

    Extract.db.add(extract)
    #TODO: Merge ranges. Sigh.

    return {'ok': True}


@extract.delete()  # permission=P_DELETE_EXTRACT
def delete_extract(request):
    extract_id = request.matchdict['id']
    extract = Extract.get_instance(extract_id)

    if not extract:
        return {'ok': False}

    with transaction.manager:
        Extract.db.delete(extract)

    return {'ok': True}


@search_extracts.get(permission=P_READ)
def do_search_extracts(request):
    uri = request.GET['uri']
    if not uri:
        return HTTPClientError("Please specify a search uri")
    source = Webpage.get(url=uri)
    if source:
        extracts = Extract.db.query(Extract).filter_by(source=source).all()
        return {"total": len(extracts),
                "rows": [extract.serializable() for extract in extracts]}
    return {"total": 0, "rows": []}
