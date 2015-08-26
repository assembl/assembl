from pyramid.view import view_config

from assembl.auth import P_READ
from assembl.models import Content
from ..traversal import InstanceContext


@view_config(context=InstanceContext, request_method='GET',
             ctx_instance_class=Content, permission=P_READ,
             accept="application/json", name="similar",
             renderer='json')
def show_similar_posts(request):
    ctx = request.context
    post = ctx._instance
    from assembl.nlp.clusters import get_similar_posts
    similar = get_similar_posts(post.discussion, post.id)
    view = (request.matchdict or {}).get('view', None)\
        or ctx.get_default_view() or 'default'
    if view == 'id_only':
        return similar
    post_ids = [x[0] for x in similar]
    posts = post.db.query(Content).filter(Content.id.in_(post_ids))
    posts = {post.id: post for post in posts}
    results = [posts[post_id].generic_json(view)
               for (post_id, score) in similar]
    for n, (post_id, score) in enumerate(similar):
        results[n]['score'] = float(score)
    return results
