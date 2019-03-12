
def find_discussion_from_slug(request, slug, session=None):
    from assembl.models import Discussion, OldSlug
    db = session or Discussion.default_db
    old_slugs = {o.slug: o for o in db.query(OldSlug)}
    if slug in old_slugs:
        found = False
        while not found:
            redirection_slug = old_slugs[slug].redirection_slug
            if redirection_slug in old_slugs:
                del old_slugs[redirection_slug]
            else:
                found = True
                discussion = db.query(Discussion).filter_by(slug=redirection_slug).first()
                return discussion
    else:
        return db.query(Discussion).filter_by(slug=slug).first()

def includeme(config):
    config.include('.views')
