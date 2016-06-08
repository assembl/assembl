
Assembl's routes and APIs
=========================

Assembl has 2 APIs.

- The "classic" API, based on `Cornice <https://cornice.readthedocs.io/en/latest/>`.
Routes begin with `http://localhost:6543/api/v1/` and correspond to :py:mod:`assembl.views.api`.
Each of these routes and the code they contain are
designed manually and have been written with performance in mind, as
they are the most critical ones (they are the first ones called by the
front-end side of the application, or are called often, or require heavy
database work).

- The "traversal" or "magical" or "generic" API. Routes
begin with `http://localhost:6543/data/` and correspond to
:py:mod:`assembl.views.api2`. These routes are automatically generated from the
classes which are defined, and their properties can be traversed. The
first element after `/data/` is the external name (cf :py:meth:assembl.lib.sqla.BaseOps.external_typename)
of a Python class for which we
want to list the instances, or to access a specific instance. It can be
followed by the database `id` of an instance of this class (for example:
`http://localhost:6543/data/Discussion/6` ).


.. toctree::
   :maxdepth: 1

   services
   backend_rest_api
   routes
