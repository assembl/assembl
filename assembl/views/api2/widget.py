from simplejson import loads

from pyramid.view import view_config
from pyramid.security import authenticated_userid
from pyramid.httpexceptions import (
    HTTPOk, HTTPNoContent, HTTPNotFound, HTTPUnauthorized)

from assembl.auth import (
    P_READ, P_ADMIN_DISC, P_ADD_POST, Everyone)
from assembl.models import (
    Widget, User, Discussion, Idea, Criterion, IdeaCreatingWidget,
    MultiCriterionVotingWidget)
from assembl.auth.util import get_permissions
from ..traversal import InstanceContext, CollectionContext
from . import FORM_HEADER, JSON_HEADER, instance_put


@view_config(context=InstanceContext, renderer='json', request_method='GET',
             ctx_instance_class_with_exceptions=(
             Widget, (MultiCriterionVotingWidget,)),
             permission=P_READ, accept="application/json")
def widget_view(request):
    if user_id == Everyone:
        return HTTPUnauthorized()
    ctx = request.context
    view = (request.matchdict or {}).get('view', None)\
        or ctx.get_default_view() or 'default'
    json = ctx._instance.generic_json(view)
    user_id = authenticated_userid(request) or Everyone
    user = User.get(id=user_id)
    #json['discussion'] = ...
    json['user'] = user.generic_json(view_def_name=view)
    json['user_permissions'] = get_permissions(
        user_id, ctx._instance.get_discussion_id())
    user_state = ctx._instance.get_user_state(user_id)
    if user_state is not None:
        json['user_state'] = user_state
    target_id = request.GET.get('target', None)
    if target_id:
        idea = Idea.get_instance(target_id)
        json['target'] = idea.generic_json(view_def_name=view)
    return json


@view_config(context=InstanceContext, request_method='PUT', header=FORM_HEADER,
             ctx_instance_class=Widget, permission=P_READ,
             accept="application/json")
def widget_instance_put(request):
    # Deprecated
    user_state = request.POST.get('user_state')
    if user_state:
        del request.POST['user_state']
    response = instance_put(request)
    if user_state:
        user_id = authenticated_userid(request)
        request.context._instance.set_user_state(
            user_state, user_id)
    return response


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Widget, permission=P_READ,
             accept="application/json", name="user_state",
             renderer='json')
def widget_userstate_get(request):
    user_id = authenticated_userid(request)
    if user_id == Everyone:
        raise HTTPUnauthorized()
    return request.context._instance.get_user_state(user_id)


@view_config(context=InstanceContext, request_method='PUT',
             ctx_instance_class=Widget, permission=P_READ,
             # TODO @maparent: with permission=P_ADD_POST we had problems
             header=JSON_HEADER, name="user_state")
def widget_userstate_put(request):
    user_state = request.json_body
    if user_state:
        user_id = authenticated_userid(request)
        if user_id == Everyone:
            raise HTTPUnauthorized()
        request.context._instance.set_user_state(
            user_state, user_id)
    return HTTPOk()  # HTTPNoContent() according to Mozilla


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Widget, permission=P_READ,
             accept="application/json", name="settings",
             renderer='json')
def widget_settings_get(request):
    return request.context._instance.settings_json


@view_config(context=InstanceContext, request_method='PUT',
             ctx_instance_class=Widget, permission=P_ADMIN_DISC,
             header=JSON_HEADER, name="settings")
def widget_settings_put(request):
    request.context._instance.settings_json = request.json_body
    return HTTPOk()


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Widget, permission=P_READ,
             accept="application/json", name="state",
             renderer='json')
def widget_state_get(request):
    return request.context._instance.state_json


@view_config(context=InstanceContext, request_method='PUT',
             ctx_instance_class=Widget, permission=P_ADD_POST,
             header=JSON_HEADER, name="state")
def widget_state_put(request):
    request.context._instance.state_json = request.json_body
    return HTTPOk()


@view_config(
    context=InstanceContext, ctx_instance_class=IdeaCreatingWidget,
    request_method="GET", permission=P_READ,
    renderer="json", name="confirm_ideas")
def view_confirmed_ideas(request):
    ctx = request.context
    return ctx._instance.get_confirmed_ideas()


@view_config(
    context=InstanceContext, ctx_instance_class=IdeaCreatingWidget,
    request_method="POST", permission=P_ADMIN_DISC,
    renderer="json", name="confirm_ideas")
def set_confirmed_ideas(request):
    ids = loads(request.POST['ids'])
    ctx = request.context
    ctx._instance.set_confirmed_ideas(ids)
    return "Ok"


@view_config(
    context=InstanceContext, ctx_instance_class=IdeaCreatingWidget,
    request_method="GET", permission=P_READ,
    renderer="json", name="confirm_messages")
def view_confirmed_messages(request):
    ctx = request.context
    return ctx._instance.get_confirmed_messages()


@view_config(
    context=InstanceContext, ctx_instance_class=IdeaCreatingWidget,
    request_method="POST", permission=P_ADMIN_DISC,
    renderer="json", name="confirm_messages")
def set_confirmed_messages(request):
    ids = loads(request.POST['ids'])
    ctx = request.context
    ctx._instance.set_confirmed_messages(ids)
    return "Ok"


@view_config(
    context=InstanceContext, ctx_instance_class=Idea,
    request_method="GET", permission=P_READ,
    renderer="json", name="criteria")
def get_idea_criteria(request):
    ctx = request.context
    view = (request.matchdict or {}).get('view', None)\
        or ctx.get_default_view() or 'default'
    return [cr.generic_json(view) for cr in
            ctx._instance.get_siblings_of_type(Criterion)]


@view_config(
    context=InstanceContext, ctx_instance_class=Idea,
    request_method="GET", permission=P_READ,
    renderer="json", name="vote_results")
def get_idea_vote_results(request):
    return request.context._instance.get_voting_results()


@view_config(
    context=InstanceContext, ctx_instance_class=Widget,
    request_method="GET", permission=P_READ,
    renderer="json", name="user_states")
def get_all_users_states(request):
    return request.context._instance.get_all_user_states()


@view_config(context=InstanceContext, renderer='json', request_method='GET',
             ctx_instance_class=MultiCriterionVotingWidget, permission=P_READ,
             accept="application/json")
def voting_widget_view(request):
    if user_id == Everyone:
        return HTTPUnauthorized()
    ctx = request.context
    view = (request.matchdict or {}).get('view', None)\
        or ctx.get_default_view() or 'default'
    widget = ctx._instance
    json = widget.generic_json(view)
    user_id = authenticated_userid(request) or Everyone
    user = User.get(id=user_id)
    #json['discussion'] = ...
    json['user'] = user.generic_json(view_def_name=view)
    json['user_permissions'] = get_permissions(
        user_id, widget.get_discussion_id())
    user_state = widget.get_user_state(user_id)
    if user_state is not None:
        json['user_state'] = user_state
    target_id = request.GET.get('target', None)
    if target_id and Idea.get_database_id(target_id):
        json['user_votes_url'] = widget.get_user_votes_url(target_id)
        json['vote_results_url'] = widget.get_vote_results_url(target_id)
        json['voting_urls'] = widget.get_voting_urls(target_id)
    json['criteria'] = [idea.generic_json(view_def_name=view)
                        for idea in widget.criteria]
    return json


@view_config(context=CollectionContext, request_method='POST',
             ctx_named_collection="CriterionCollection.criteria",
             permission=P_ADMIN_DISC, header=FORM_HEADER)
def post_to_vote_criteria(request):
    ctx = request.context
    target_id = request.POST.get('id', None)
    idea = None
    if target_id:
        idea = Idea.get_instance(target_id)
    if not idea:
        raise HTTPNotFound
    widget = ctx.parent_instance
    widget.add_criterion(idea)
    return HTTPOk()  # Not sure this can be called a creation


@view_config(context=CollectionContext, request_method='DELETE',
             ctx_named_collection_instance="CriterionCollection.criteria",
             permission=P_ADMIN_DISC)
def delete_vote_criteria(request):
    ctx = request.context
    idea = ctx._instance
    widget = ctx.__parent__.parent_instance
    widget.remove_criterion(idea)
    return HTTPOk()
