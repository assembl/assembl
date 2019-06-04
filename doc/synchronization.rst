Data interdependence in the frontend
------------------------------------

Assembl is characterized by highly interdependent data, and allowing for live updates incurs significant complexity. The most complex issues revolve around the Idea-Post relationship, where each idea is connected to a subset of all posts. Here is how this relationship is handled as of 2016/08.

In general, we have tended to load model collections in the frontend, in the :js:class:`CollectionManager`. Those collections can be kept up-to-date with the WebSocket (see :py:mod:`assembl.processes.changes_router` and :py:func:`assembl.lib.sqla.before_commit_listener`), and views can listen to backbone add/update events normally. However, various linking objects are not handled by the :js:class:`CollectionManager`, and the information is put in the objects that are linked.

If the websocket is disconnected, we need to re-fetch the model collections; this is currently only implemented for the message structure collection. See :js:func:`getAllMessageStructureCollectionPromise`.

First, these are collections that the are maintained up-to-date through the WebSocket:

1. The collection of all extracts (loaded with the page)
2. The collection of all participants (loaded with the page)
3. The collection of all Ideas, each of which knows its parent and children, and the number of total and read posts. (loaded at application start.)
4. The collection of Post structure, i.e. their Id, type and parentId. (loaded when the message panel is first displayed.)

When the message panel is loaded, the full information for the posts that will be displayed is loaded, including the list of applicable ``IdeaContentLinks`` for each post. We do not expect the frontend to be able to load all the post information in memory. New and modified messages are pushed, even if irrelevant in the frontend view; but those events are deemed rare enough that we can accept the added memory pressure. (We load the full structure so we can show threading structure and levels appropriately, even taking out-of-scope messages into account.)

When any of the following is created or modified, the backend broadcasts the data to the frontend:

* :py:class:`assembl.models.idea.Idea`
* :py:class:`assembl.models.generic.Content` (including :py:class:`assembl.models.post.Post`)
* :py:class:`assembl.models.idea_content_link.Extract`

When ``Idea`` are added or modified, the frontend will update live, currently at the cost of some interface jerkiness.

When ``Post`` are added, the frontend will generally not update live, but warn the user that new messages have come, and offer to reload the view. (This was done to avoid frequent loss of context, but could be improved.) Message counts are updated on the fly through sending ideas on the socket in :py:func:`assembl.views.api.post.create_post`.

Similarly, adding or editing an ``Extract`` will change message counts on the fly, but will not update the message panel. This is again done by sending ideas on the socket, in :py:func:`assembl.models.idea_content_link.idea_content_link_idea_set_listener`

The following links are handled indirectly, and link modification currently requires re-sending at least one of the objects linked.

* :py:class:`assembl.models.idea_content_link.IdeaContentLink` (other than ``Extract``.) We do not keep a global collection, but we keep an ad-hoc per-Post collection (called ``indirect_idea_content_links``; see :js:func:`getIdeaContentLinkCollectionOnMessage`.) As a consequence, new top posts will not be seen in the MessageList, but they will encourage a reload due to being new messages. (in :js:func:`showPendingMessages`) (Again, related message count will update.) As for :py:class:`assembl.models.idea_content_link.IdeaContentNegativeLink` (thread breaks), they not yet handled.
* :py:class:`assembl.models.action.ViewPost` will send back updated post count information for all affected ``Idea`` (the socket is not involved: see :py:meth:`assembl.models.idea.Idea.idea_read_counts` and :py:func:`assembl.views.api.post.mark_post_read`)
* :py:class:`assembl.models.idea.IdeaLink` are expressed in ideas with the ``parentId``, ``parents`` and ``numChildIdea`` attributes. Changes cause all affected ideas to be sent to the socket. (see :py:func:`assembl.views.api.idea.save_idea`)
* :py:class:`assembl.models.idea_graph_view.SubGraphIdeaAssociation` and :py:class:`assembl.models.idea_graph_view.SubGraphIdeaLinkAssociation` are respectively expressed in the ``ideas`` and ``idea_links`` attributes of ``ExplicitSubGraphView`` objects (such as the ``Synthesis``). Changes trigger sending the view on the socket: see :py:func:`assembl.views.api2.synthesis.add_idea_to_synthesis` and :py:func:`assembl.views.api2.synthesis.remove_idea_from_synthesis`.



Future work
===========

Generally:

Our state is kept consistent by a WebSocket triggering Backbone global model events, which our views watch. This is fine for the main objects, but the links and counters require finer, value-level changes. It would be nice to be able to send those on the WebSocket. (It is already possible to send a Websocket message for a specific user.)

In the short run:

We need to leave the Idea-centric view and keep a separate collection of ``IdeaLink``. This will make for more focused view updates: the table of idea's children collection could only watch the ``IdeaLink`` collection. Similarly, we might want to keep a collection of ``IdeaContentLink`` instead of only ``Extract``.

Mid-term changes:

In most cases, views watch generic changes in the idea and update globally; it would be nice to have more specific bindings.

For example, we update message counts in the table of ideas, but the underlying dependencies are not updated in the :js:class:`IdeaClassificationNameListView`.

We may want to not load the entire message structure someday, but then the backend would need another means to calculate the hierarchy (this may not be so difficult.)

More long-term:

we have chosen to not update the :js:class:`MessageList` view to decrease changes, but that should be revisited. It would be nice to give an idea of where incoming messages would load (whether new messages or newly classified messages.) In the meantime, we should detect when a new message would not even appear in the current view, and not invite a reload.

We may want to separate changes to the data from changes to the various item counts (posts, actions, etc.) associated with an idea, so those could update independently. Some of those changes in derived data are costly to compute, and should be left to a separate (micro-)service. We could also store standing queries in those services. (as in Data Stream Management Systems or (better) Complex Event Processing.)
