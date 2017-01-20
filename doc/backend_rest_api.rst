.. _magic_api:

Traversal API
=============

Routes begin with ``/data/`` and correspond to
:py:mod:`assembl.views.api2`. These routes are automatically generated from the
classes which are defined, and their properties can be traversed. The
first element after ``/data/`` is the external name (cf :py:meth:`assembl.lib.sqla.BaseOps.external_typename`)
of a Python class for which we
want to list the instances, or to access a specific instance. It can be
followed by the database `id` of an instance of this class (for example:
``/data/Discussion/6`` ).
Some classes (Discussion, Preferences) also have unique names which can be used in traversal: ``/data/Discussion/slug`` ).

View defs
---------

An API call can contain a parameter "view" (for example:
``/data/Discussion/?view=partial`` ). Its value is the name of a view def.
View defs are JSON files which are defined in :py:mod:`assembl.view_def`.
A view def defines for each class the properties which the server is
allowed to send back to the client, or which are allowed to be modified
by a POST/PUT API call.

Collections
-----------

The API URL of an object instance can be followed by ``/@@collections`` .
This will list all collections available from this instance. A
collection of this list can be one of:

- a relation (in the ORM sense: OneToMany or ManyToOne)
- the backref of a relation (this is an inverse relation, which has been defined in the other class of the relation, not in this one)
- a collection which has been defined via ``extra\_collections``. In this case, the JOIN operation has been coded manually. (:py:meth:`assembl.views.traversal.CollectionDefinition.decorate_query`, :py:meth:`assembl.views.traversal.CollectionDefinition.decorate_instance`, :py:meth:`assembl.views.traversal.CollectionDefinition.contains`).

Notifications
-------------

Uses the generic API.

Get user notifications
~~~~~~~~~~~~~~~~~~~~~~

All notifications, for this user, this discussion:
``/data/Discussion/6/all\_users/2/notification``

A specific notification:
``/data/Discussion/6/all\_users/2/notification/1``

Specific formats, append:

- ``/mail``: Raw email
- ``/mail\_html\_preview``: Preview the html part of the notification mail (if any)
- ``/mail\_text\_preview``: Preview the plain text part of the notification mail (if any)

Actions
~~~~~~~

Those actions are based on pyramid named views. (not strictly REST, but useful for debugging)

``/process\_now``: Notify the celery\_notify celery task to try processing
the notification immediately A global equivalent exists for all
notifications: ``/data/Notification/process\_now``

Examples
--------

Get all posts for a discussion:
    ``/api/v1/discussion/1/posts``
    You can append a view, such as ``?view=id\_only``

Delete a message (Superadmin):
    ``DELETE /data/Content/3244``

Permission lookups:
    ``GET /api/v1/discussion/2/permissions/add\_extract/u/``

Frontend notes: Specific messages are adressed with urls such as
    ``/jacklayton/posts/local%3AContent%2F16``

Metrics and statistics (work in progress, api under flux): Ex:
    ``/data/Discussion/11/time\_series\_analytics?interval=P1M&start=2014-01-01``

Discussion preferences:
    Raw data: (does not include permission cascade, use it to edit)
    ``/data/Discussion/1/preferences``

Discussion preferences:
    Cooked data (includes permission cascade)
    ``/data/Discussion/1/settings(/{key})``
    (In frontend: ``models/discussionPreference.js``)

User Namespaced KV store:
    ``/data/Discussion/1/user\_ns\_kv/{namespace}(/{key})``
    in particular
    ``/data/Discussion/1/user\_ns\_kv/preferences(/{key})``
    which contains the overrides found in user-corrected preference data:
    ``/data/Discussion/1/all\_users/current/preferences(/{key})``
    (In frontend: ``Ctx.getPreferences``, which is taken from a tag.)
