"""Workaround for bugs that introduced extra links between entities."""
import traceback
import pdb
import sys
import logging.config

from pyramid.paster import get_appsettings

import assembl
from assembl.lib.sqla import (configure_engine, get_session_maker)
from assembl.lib.zmqlib import configure_zmq
from assembl.indexing.changes import configure_indexing
from assembl.lib.config import set_config


def kill_weird_links(db=None):
    from assembl.models import (
        IdeaWidgetLink, IdeaLink, IdeaContentLink,
        SubGraphIdeaLinkAssociation, SubGraphIdeaAssociation)
    db = db or IdeaLink.default_db
    for link in db.query(IdeaLink):
        if link.source_ts.discussion_id != link.target_ts.discussion_id:
            link.delete()
    for link in db.query(IdeaWidgetLink):
        if link.widget.discussion_id != link.idea.discussion_id:
            link.delete()
    for link in db.query(IdeaContentLink):
        if not link.idea:
            continue
        if link.content.discussion_id != link.idea.discussion_id:
            link.delete()
    for link in db.query(SubGraphIdeaAssociation):
        if link.sub_graph.discussion_id != link.idea.discussion_id:
            link.delete()
    for link in db.query(SubGraphIdeaLinkAssociation):
        if (link.sub_graph.discussion_id
                != link.idea_link.source_ts.discussion_id):
            link.delete()

if __name__ == '__main__':
    configuration = sys.argv[1]
    settings = get_appsettings(configuration, 'assembl')
    set_config(settings)
    logging.config.fileConfig(configuration)
    configure_zmq(settings['changes_socket'], False)
    configure_indexing()
    configure_engine(settings, True)
    session = get_session_maker()()
    try:
        kill_weird_links(session)
    except Exception as e:
        traceback.print_exc()
        pdb.post_mortem()
