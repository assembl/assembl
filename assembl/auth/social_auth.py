from pyramid.events import subscriber, BeforeRender
from pyramid.security import (
    remember,
    Everyone,
    authenticated_userid)

from social.apps.pyramid_app.utils import backends

from assembl.models import User


def login_user(backend, user, user_social_auth):
    remember(backend.strategy.request, user.id)


def login_required(request):
    logged_in = authenticated_userid(request)
    return logged_in is None


def get_user(request):
    user_id = request.session.get('user_id')
    if user_id:
        user = User.default_db.query(
            User).filter(User.id == user_id).first()
    else:
        user = None
    return user


@subscriber(BeforeRender)
def add_social(event):
    request = event['request']
    event['social'] = backends(request, request.user)

