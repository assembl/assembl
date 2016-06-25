.. _classical_api:

Cornice RESTful services
------------------------

Routes begin with ``/api/v1/`` and correspond to :py:mod:`assembl.views.api`.
Each of these routes and the code they contain are
designed manually and have been written with performance in mind, as
they are the most critical ones (they are the first ones called by the
front-end side of the application, or are called often, or require heavy
database work).

.. cornice-autodoc::
  :modules: assembl.views.api
