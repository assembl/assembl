Assembl technology stack
========================

These are some of the main elements of the stack used by Assembl. Some of these choices are not always the most mainstream, but were meanstream at the start of the project in mid-2012.

Python and Javascript
---------------------

We use the Python_ language for backend development, because of its flexibility, dynamism and rich ecosystem. Because the project aims to explore new practices, we have given priority to ease of development over absolute performance. The project was started on Python 2.7, and some components are still holding us back from the transition to Python 3.

In the frontend, we have stuck to traditional Javascript (as opposed to various better languages that compile to javascript) to maintain ease of debugging.

Backbone and Marionette
-----------------------

The frontend stack was originally developed in Backbone_ in 2012, because it allowed a transparent mapping of CRUD operations between the backend and frontend. Many of the more popular choices now (Angular, ReactJS, etc.) were not mature at that point, and later on their advantages were not deemed worth the cost of a transition. We have since added the Marionette_ layer above Backbone, which gives us a richer MVC model in the frontend.

Angular for widgets
-------------------

A set of widgets were developed later as part of the Catalyst project; because they were supposed to be generic to the Catalyst ecosystem and independent of Assembl, they were deliberately developed using a different codebase, namely Angular_.

Asynchronicity in the frontend
------------------------------

We are dealing with asynchronicity in the frontend at two levels:

First, we want to update the UI whenever the user takes an action, without blocking on backend requests. The solution has been to use Promises (aka futures) for most API calls, abstracted with the Bluebird_ library.

Second, since the Assembl data model is built collectively, we push all model changes from the backend to the frontend through a websocket using SockJS_, so that Assembl participants get live updates of data.

Asynchronicity in the backend
-----------------------------

The Websocket mentioned previously is served by an independent process using sockjs_tornado_ (forked) and Tornado_. That server receives changed models as JSON, transmitted through ZeroMQ_. Changes are detected upon database commit by a SQLAlchemy_ event handler.

Some other operations are asynchronous and handled by processes. Those that are operations that run and terminate, such as email notifications, are modeled as Celery_ tasks, using Kombu_ and Redis_ for communication. Long-standing tasks, such as IMAP clients, use Kombu_ directly.

Web server
----------

We use Nginx_ as a web server. Nginx is efficient, and could serve the static assets with automatic compression. Nginx talks to Pyramid through the uWSGI_. We have used multiple processes rather than threads.

Pyramid
-------

We have chosen Pyramid_ as the main Web application server. It is both quite complete, more so than some micro-frameworks; and quite configurable, less opinonated than some other frameworks. Notably, it allows either a classical, route-based URL configuration and a data-driven "traversal API"; Assembl uses both in  `hybrid app`_ mode.

In particular, application web pages are defined along classical URL routes; and we have three APIs for data access.

1. :ref:`classical_api`, which allows a stable, well-optimized API.
2. The :ref:`magic_api`, which allows for an API that is always up-to-date with the data model
3. Linked Open Data (currently deactivated) in `JSON-LD`_ based on the traversal API

Sessions are handled by Beaker_ with a Memcached_ backing, and authentication with social services by `Python Social Auth`_.

SQLAlchemy
----------

The data model is expressed as ORM objects using SQLAlchemy_, which is the most popular ORM in Python. Migrations are done with Alembic_. SQLAlchemy allows for very fine control over SQL queries, expressed in Python. The ORM allows many models of mapping class inheritance to database tables; we mostly use the `joined table inheritance`_ pattern. We use introspection extensively to mediate between the JSON representations in the API and the data model.

We also add metadata to the ORM model to map it to a RDF model (using RDFLib_), which was historically done with Virtuoso_'s `Linked Data Views`_, by our `Virtuoso-python`_ module. (Currently deactivated.)

Database layer
--------------

The issue of data storage in Assembl has a long history, which is still being written.

Because of recursive queries on the graph data structure of ideas, we were attracted by graph models. Also, future applications would benefit from a deductive database. Finally, considerations of interoperability with the broader scientific community make us favour Linked Open Data as a primary data publication model. All those considerations point in the direction of a Semantic database.

On the other hand, relational databases are more mature and robust, have better tooling, more developers are familiar with them, and most important good RDBMses can enforce data intergrity constraints. The first development team at Caravan_ choose to use Postgres_ in 2012, a traditional RDBMS, for all those reasons, and and because it has good support for transitive closure using `Common Table Expressions`_.

Nonetheless, handling complex recursive queries in this first system introduced a fair amount of complexity, and the prospect of more complex queries to come made us attempt to reconcile this initial design with the semantic perspective using a hybrid database, OpenLink Virtuoso_ (open-source edition) in 2014, which allowed both a relational model and `Linked Data Views`_ over those models. The Virtuoso-SQLAlchemy driver was dependent on a forked version of PyODBC_. However, we had issues with data integrity and data corruption, and we abandoned that solution in 2016.

Thanks to SQLAlchemy's abstraction layer, it was possible to port our codebase back to Postgres_ for data storage, and we abstracted the complexity of some of the queries by pushing part of the more complex calculations in the application layer (in :py:mod:`assembl.models.path_utils`.)

This was a setback for our Linked Open Data strategy, and does not solve the issue of deductive capacity, and we are now considering the option of moving towards a `polyglot persistence` model.


Operations
----------

Administrative tasks are executed both remotely and locally through Fabric_. The various processes that constitute the backend are kept running by Supervisord_. Those two components are also the ones that are blocking the Python 3 transition.

.. _Marionette: http://marionettejs.com/
.. _Backbone: http://backbonejs.org/
.. _Nginx: http://nginx.org/
.. _Pyramid: http://www.pylonsproject.org/
.. _SQLAlchemy: http://www.sqlalchemy.org/
.. _Postgres: https://postgresql.org
.. _RDFLib: http://rdflib.readthedocs.io/en/stable/
.. _Bluebird: http://bluebirdjs.com/
.. _Alembic: http://alembic.zzzcomputing.com/en/latest/
.. _Angular: https://angularjs.org/
.. _Virtuoso: http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/
.. _Caravan: http://caravan.coop/en/
.. _Python: https://python.org/
.. _SockJS: https://github.com/sockjs/sockjs-client
.. _sockjs_tornado: https://github.com/ImaginationForPeople/sockjs-tornado/
.. _Tornado: http://www.tornadoweb.org/en/stable/
.. _ZeroMQ: http://zeromq.org/
.. _Celery: http://www.celeryproject.org/
.. _Kombu: http://kombu.readthedocs.io/en/latest/
.. _Redis: http://redis.io/
.. _Fabric: http://www.fabfile.org/
.. _Supervisord: http://supervisord.org/
.. _Beaker: http://beaker.readthedocs.io/en/latest/
.. _Memcached: https://memcached.org/
.. _uWSGI: https://uwsgi-docs.readthedocs.io/en/latest/
.. _PyODBC: https://github.com/maparent/pyodbc
.. _`Python Social Auth`: http://psa.matiasaguirre.net/
.. _`Virtuoso-python`: https://github.com/maparent/virtuoso-python
.. _`Linked Data Views`: http://docs.openlinksw.com/virtuoso/rdfviewsrdbms.html
.. _`JSON-LD`: http://json-ld.org/
.. _`hybrid app`: http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/hybrid.html
.. _`joined table inheritance`: http://docs.sqlalchemy.org/en/rel_1_0/orm/inheritance.html#joined-table-inheritance
.. _`Common Table Expressions`: https://www.postgresql.org/docs/9.5/static/queries-with.html
.. _`polyglot persistence`: http://martinfowler.com/bliki/PolyglotPersistence.html

