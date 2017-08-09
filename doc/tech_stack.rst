The Assembl technology stack
============================

These are some of the main elements of the stack used by Assembl. Some of these 
choices are not always the most mainstream, but were meanstream at the start of 
the project in mid-2012.

Backend
-------

Python
^^^^^^
We use the Python_ language for backend development, because of its flexibility, 
dynamism and rich ecosystem. Because the project aims to explore new practices, 
we have given priority to ease of development over absolute performance. 

The project was started on Python 2.7, and some components are still holding us 
back from the transition to Python 3.

Packages and libraries we use directly
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

This is a list of every backend dependency used *directly* in assembl code.
The packages you would need to know about first are described in subsequent paragraphs.

This comes from :file:`requirements.txt`, but indirect dependencies are not listed.

Alembic_
  Database schema migration

anyjson_
  JSON parsing

Babel_
  localization and internationalization: extract strings from source files and compile translated files.

Beaker_
  Web sessions (uses Memcached_)

beautifulsoup4_
  HTML parsing

celery_
  Tasks running in another process

colander_
  Data validation (not used)

cornice_
  RESTful APIs in Pyramid_. Used for the :ref:`classical_api`

dogpile_
  Allows to cache and share the results of a long calculation. Was used for CIF caching.

enum34_
  Python3 enums backported to Python2

facebook_sdk_
  Facebook SDK, allows us to query facebook, post messages to it and retrieve comments.

feedparser_
  Used by :py:class:`assembl.models.feed_parsing.FeedSourceReader` to read Atom feeds.

gensim_
  Used by :py:mod:`assembl.nlp.cluster` to find clusters of similar posts.

google_api_python_client_
  Used in :py:class:`assembl.nlp.translation_service.GoogleTranslationService` to communicate with the google translation service and translate messages

imaplib2_
  Used to retrieve messages from an IMAP server, through the :py:mod:`assembl.tasks.imap` celery process or the :py:class:`assembl.tasks.imaplib2_source_reader.IMAPReader`.

iso639_
  Translate between ISO-639-1 and ISO-639-2 language codes.

isodate_
  Parse dates in ISO-8601 format to python datetime objects.

Jinja2_
  Our main templating mechanism.

jwzthreading_
  Used to deduce thread order of imported mail messages

kombu_
  Inter-process messaging. Uses Redis_. Used by Celery_ and directly by the :py:mod:`assembl.tasks.source_reader`

langdetect_
  Guess the original language of a message. Used in :py:mod:`assembl.nlp.translation_service`

lxml_
  Parse XML directly. Also used by beautifulsoup4_.

nodeenv_
  Standardized NodeJS_ environment, coordinated with Virtualenv_

premailer_
  flatten the CSS of HTML, for sending as email in notifications.

psycopg2_
  Connect to Postgres_ database

pygraphviz_
  Create graph images with Graphviz_. Used in :py:func:`assembl.views.api2.discussion.as_mind_map`.

pyIsEmail_
  Validate whether an input value is a valid email.

PyJWT_
  JSON web tokens, allows to use Annotator_ from a bookmarklet.

Pyramid_
  Our Web framework.

pyramid_dogpile_cache_
  Use dogpile_ from Pyramid_

pyramid_jinja2_
  Use Jinja2_ from Pyramid_

pyramid_mailer_
  Send emails from within a Pyramid transaction. The email will only be sent if the transaction succeeds. Used for invitations and password resets in :py:mod:`assembl.views.auth.views` until we refactor this with notifications.

pyramid_beaker_
  Use Beaker_ sessions from Pyramid_

PyStemmer_
  The snowball stemmer will convert words to their stem, erasing flexions. Used in :py:mod:`assembl.nlp`

python_social_auth_
  Allows us to use social network identities for single-sign-on

pytz_
  Convert local time to UTC and back.

pyzmq_
  Use the ZeroMQ_ messaging bus from python. Used for the :py:mod:`assembl.tasks.changes_router`.

raven_py_
  Send error reports to Sentry_.

RDFLib_
  Library to handle RDF data, used for `Catalyst interoperability`_.

rdflib_jsonld_
  Formats RDF data as `JSON-LD`_.

requests_
  Obtain data from a URL

scikit_learn_
  Machine learning algorithms, used in :py:mod:`assembl.nlp.cluster`

simplejson_
  Parse JSON data as Python objects and vice-versa

six_
  Abstract some of the differences between Python2 and Python3

sockjs_tornado_
  Serve a websocket connection using Tornado_. Used by the :py:mod:`assembl.tasks.changes_router`.

SQLAlchemy_
  The Object-Relational Mapper; allows us to use Python classes backed by database storage.

tornado_
  Another Web server, used by the :py:mod:`assembl.tasks.changes_router`.

transaction_
  An abstraction for atomic transactions, most Pyramid web requests are wrapped in a transaction.

zope_interface_
  Allows to define interfaces (aka protocols, i.e. purely abstract classes), and retrieve a concrete class that fulfills this protocol by configuration. Used in the :py:mod:`assembl.lib.model_watcher`.

.. _backend_test_libraries:

Testing
^^^^^^^

pytest_
  Our main testing framework. One feature we use a lot is `pytest fixtures`_, in :py:mod:`assembl.tests.fixtures`. Front-end tests are run by the backend, thanks to splinter_.

Mocha_
  Our frontend testing framework

Chai_
  BDD and TDD assertions in front-end tests

coverage_
  Verify the coverage of back-end tests

jasmine_splinter_runner_
  Run the Mocha_ tests from pytest and collect test results.

mock_
  Mock objects and monkey-patch python modules.

splinter_
  Drive the PhantomJS_ web browser through selenium_ for front-end tests.

flaky_
  Allows to define some tests as flaky, i.e. attempt them a few times before declaring failure.

WebTest_
  Encapsulate the Pyramid_ WSGI_ server for testing purposes.


Debugging
^^^^^^^^^

ipython_
  Improved Python shell

pyramid_debugtoolbar_
  Debug toolbar in the web page

pyramid_debugtoolbar_ajax_
  Monitor AJAX calls in the debug toolbar

pyramid_ipython_
  Access Pyramid_ from ipython_

sqltap_
  Monitor SQLAlchemy_ requests from the web application

uwsgitop_
  Monitor UWSGI_

flower_
  Monitor Celery_ tasks

PdbSublimeTextSupport_
  Shows debug code location in Sublime Text

waitress_
  A simple WSGI_ web server for development use. (The pyramid ``pserve`` command uses this.)


Pyramid
^^^^^^^

We have chosen Pyramid_ as the main Web application server. It is both quite 
complete, more so than some micro-frameworks; and quite configurable, less 
opinonated than some other frameworks. Notably, it allows either a classical, 
route-based URL configuration and a data-driven "traversal API"; Assembl uses 
both in  `hybrid app`_ mode.

In particular, application web pages are defined along classical URL routes; 
and we have three APIs for data access.

1. :ref:`classical_api`, which allows a stable, well-optimized API.

2. The :ref:`magic_api`, which allows for an API that is always up-to-date with 
   the data model

3. Linked Open Data (currently deactivated) in `JSON-LD`_ based on the 
   traversal API

Sessions are handled by Beaker_ with a Memcached_ backing, and authentication 
with social services by `Python Social Auth`_.

SQLAlchemy
^^^^^^^^^^

The data model is expressed as ORM objects using SQLAlchemy_, which is the most 
popular ORM in Python. Migrations are done with Alembic_. SQLAlchemy allows for 
very fine control over SQL queries, expressed in Python. The ORM allows many 
models of mapping class inheritance to database tables; we mostly use the 
`joined table inheritance`_ pattern. We use introspection extensively to 
mediate between the JSON representations in the API and the data model.

We also add metadata to the ORM model to map it to a RDF model (using RDFLib_), 
which was historically done with Virtuoso_'s `Linked Data Views`_, by our 
`Virtuoso-python`_ module. (Currently deactivated.)

Database layer
^^^^^^^^^^^^^^

The issue of data persistence in Assembl has a long history, which is still 
being written.

Because of recursive queries on the graph data structure of ideas, we were 
attracted by graph models. Also, future applications would benefit from a 
deductive database. Finally, considerations of interoperability with the 
broader scientific community make us favour Linked Open Data as a primary data 
publication model. All those considerations point in the direction of a 
Semantic database.

On the other hand, relational databases are more mature and robust, have better 
tooling, more developers are familiar with them, and most important good 
RDBMses can enforce data intergrity constraints. The first development team at 
Caravan_ choose to use Postgres_ in 2012, a traditional RDBMS, for all those 
reasons, and and because it has good support for transitive closure using 
`Common Table Expressions`_.

Nonetheless, handling complex recursive queries in this first system introduced 
a fair amount of complexity, and the prospect of more complex queries to come 
made us attempt to reconcile this initial design with the semantic perspective 
using a hybrid database, OpenLink Virtuoso_ (open-source edition) in 2014, 
which allowed both a relational model and `Linked Data Views`_ over those 
models. The Virtuoso-SQLAlchemy driver was dependent on a forked version of 
PyODBC_. However, we had issues with data integrity and data corruption, and we 
abandoned that solution in 2016.

Thanks to SQLAlchemy's abstraction layer, it was possible to port our codebase 
back to Postgres_ for data storage, and we abstracted the complexity of some of 
the queries by pushing part of the more complex calculations in the application 
layer (in :py:mod:`assembl.models.path_utils`.)

This was a setback for our Linked Open Data strategy, and does not solve the 
issue of deductive capacity, and we are now considering the option of moving 
towards a `polyglot persistence`_ model.

Asynchronicity in the backend
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

The Websocket mentioned previously is served by an independent process using 
sockjs_tornado_ (forked) and Tornado_. That server receives changed models as 
JSON, transmitted through ZeroMQ_. Changes are detected upon database commit by 
a SQLAlchemy_ event handler.

Some other operations are asynchronous and handled by processes. Those that are 
operations that run and terminate, such as email notifications, are modeled as 
Celery_ tasks, using Kombu_ and Redis_ for communication. Long-standing tasks, 
such as IMAP clients, use Kombu_ directly.


Frontend
--------

Overview
^^^^^^^^

Javascript
^^^^^^^^^^

In the frontend, we have stuck to traditional Javascript (as opposed to various 
languages that compile to javascript) to maintain ease of debugging.

The frontend stack was originally developed in Backbone_ in 2012, because it 
allowed a transparent mapping of CRUD operations between the backend and 
frontend. Many of the more popular choices now (Angular, ReactJS, etc.) were 
not mature at that point, and later on their advantages were not deemed worth 
the cost of a transition. We have since added the Marionette_ layer above 
Backbone_, which gives us a richer MVC model in the frontend.


Furthermore, we are currently embarking on a redesign of the entire front-end
architecture! The initial phase of the development is nearly complete. Further
information can be found below. See section `New Frontend`_

Packages and libraries we use directly
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

This is a list of every frontend dependency used *directly* in the frontend
code.  Indirect dependencies are not listed.
test libraries are described in the backend :ref:`backend_test_libraries` section.

Essentially, this comes from :file:`package.json` and :file:`bower.json`, as 
well as the content of js/app/lib

Underscore_
  The basis of backbone, but also used extensively in assembl code.  
  It is a very useful Javascript utility library

Backbone_
  An unopinionated Model-Collection-View Javascript framework

Marionette_
  A thicker framework built on top of backbone.

Annotator_
  A fundamental dependency of Assembl, included in the git of Assembl in 
  js/lib.
  
  Actually generated from our own fork of annotator available at
  https://github.com/assembl/annotator

`Backbone Subset`_
  A backbone model to allow manipulating subsets of collections anywhere one 
  can use a collection.

`Backbone Modal`_
  A backbone view extension to implement modal interface elements in a backbone 
  or marionette frontend.

Ink_
  Allows generating responsive emails from templates.  We intend to replace
  it with `Foundation for Emails 2`_, by the same authors.

`jquery-oembed-all`_
  A jquery plugin to implement the oembed protocol completely
  client side.  Allow embeedin g or previewing arbitrary URLs without hitting
  the backend.
  
  *Note:* As of 2016-06-29, we use our own fork of jquery-oembed-all, with several 
  new features  

`jquery.dotdotdot`_
  A jquery plugin that allows implementing a "Read More" 
  interface depending on the height of an element.
  
  *Note:* As of 2016-06-29, we use our own fork of jquery.dotdotdot, to work
  around a bug.  It should be possible to go back now that this is almost 
  totally abstracted out in CKEditorField

`jquery-autosize`_
  A jquery plugin that allows textarea to automatically
  expand as the user types.  Used in the message editor.

bootstrap_growl_
  Jquery plugin used to implement "Growl-like" notifications

CKEditor_
  For WYSIWYG editing in various parts of the interface

Hopscotch_
  A framework to build guided tours in one page applications

Bluebird_
  Used to implement promises, which we use extensively to deal with
  asynchronicity in the frontend

D3_
  Used to implement data visualisations

Jed_
  Used to implement gettext api in the frontend

Moment_
  Date calculation and logalized textual display in javascript

raven_js_
  Used to send client-side errors to Sentry_ in production

sockjs_client_
  Used for websocket communication on the frontend

linkifyjs_
  Used to highlight hyperlinks in text-only content.  Used in the 
  messagelist

`Bootstrap dropdown <http://getbootstrap.com/javascript/#dropdowns>`_
  Used in the messagelist header and attachment view to implement dropdown.  
  Included in Assembl source code in js/lib/bootstrap-dropdown.js. Deprecated.

`Bootstrap tooltip <http://getbootstrap.com/javascript/#tooltips>`_
  Used everywhere to implement tooltips

  Included in Assembl source code in js/lib/bootstrap-tooltip.js.



Angular for widgets
^^^^^^^^^^^^^^^^^^^

A set of widgets were developed later as part of the Catalyst_ project; because 
they were supposed to be generic to the Catalyst ecosystem and independent of 
Assembl, they were deliberately developed using a different codebase, namely 
Angular_.

Asynchronicity in the frontend
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

We are dealing with asynchronicity in the frontend at two levels:

First, we want to update the UI whenever the user takes an action, without 
blocking on backend requests. The solution has been to use Promises (aka 
futures) for most API calls, abstracted with the Bluebird_ library.

Second, since the Assembl data model is built collectively, we push all model 
changes from the backend to the frontend through a websocket using SockJS_, so 
that Assembl participants get live updates of data.


.. _`New Frontend`:

New Front-end
^^^^^^^^^^^^^

The new front-end will be based on Facebook_ technologies, as we feel that this
is the technology that the market is converging towards. We use React_, alongside
its ecosystem of tooling. Furthermore, we have made the decision to migrate away
from RESTful_ APIs in favour of new GraphQL_ methodologies as much of our data
can be labeled in graph form.

New Front-end Stack
~~~~~~~~~~~~~~~~~~~

React_:
  The underbelly of our new front-end. We use component based approach in order to
  simplify the development and comprehension of views throughout Assembl.

`React Router`_:
  The defacto router for React. We use declarative approach to match routes to views,
  and to maintain a history stack.

`React Bootstrap`_:
  The `Assembl Styleguide`_ is based strongly on this package, as it converts typically
  Bootstrap_ related CSS/JS items into React-based components.

Redux_:
  The popular Flux implementation that is often coupled with React. Our state management
  library for components

Apollo_:
  A popular and future-thinking GraphQL_ library to manage calls to our graphQL server as
  well as managing the state of responses within components. It is a Provider-wrapper around
  Redux_.

lodash_:
  The lightweight alternative to Underscore_.

BabelJS_:
  The new codebase will utilize the latest in `ECMAScript 6`_ standard. Babel will be used
  to transpile the modern code to currently compatible javascript versions used by
  popular browsers today.

Webpack_:
  The new front-end's asset management library will be Webpack instead of Gulp_. Webpack offers
  more flexibility in managing the pipleline and the modern front-end stack is converging to this
  tool.

ESLint_:
  The new front-end will use AirBnb_ as it's Javascript coding standard. As a result, this linter
  is chosen in order for all developers to be on the same page in terms of development.

Flow_:
  The new front-end uses flow for static type checking. The linting rules used for flow types is
  eslint-plugin-flowtype_ with its recommended configuration.

New Front-end's Backend Stack
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

There are not many changes in the backend for the new front-end, technology wise. The notable exception
is the migration away from RESTful APIs in Pyramid_ towards GraphQL_.

Graphene_:
  The GraphQL implementation for Python that is widely used.

`Graphene SQLAlchemy`_:
  A further wrapper for Graphene_ that will enable the use SQLAlchemy_ models to be used to generate a
  schema for GraphQL.


Templating, HTML and CSS
------------------------

Assembl is unusual in that the template files are double-compiled.
They are first compiled by Jinja2_ and subsquently by Underscore_ templates.


SASS
^^^^

We use SASS for CSS generation, using `Libsass http://sass-lang.com/libsass` 
and Bourbon_

Bourbon_
  A mixin library for Sass, to avoid vendor prefixes and the like

Grid system: 

**TODO**

Styleguide: 

**TODO**

Build system
------------
Fabric_:
  Used as main orchestrator of the build.  To see available commands, 
  type ``fab --list`` for the assembl virtualenv

Pip_:
  Used for python package management

Setuptools_:
  Used for python package building

npm_:
  User for Javascript package management

Bower_:
  Javascript package management (being phased out in favor of npm)

Gulp_:
  Used for Javascript and Sass code generation.  Configured in 
  :file:`assembl/gulpfile.js`

Translation
-----------

Assembl uses a gettext style translation pipeline.  It goes through the pyramid 
machinery to extract the stransatable strings, including the strings from the 
frontend in ``fab -c configs/develop.rc make_messages``

Python gettext https://docs.python.org/2/library/gettext.html , 

This is setup in ``setup.cfg`` and ``message-extraction.ini``

The po files are subsequently converted to JSON usable from Jed_ in the 
frontend.  This happens in ``po2json.py`` called by ``fab -c configs/develop.rc compile_messages``

See :doc:`localization`


Operations
----------

Administrative tasks are executed both remotely and locally through Fabric_. 
The various processes that constitute the backend are kept running by 
Supervisord_. Those two components are also the ones that are blocking the 
Python 3 transition.

Supervisord_

Sentry_

Piwik_

`Borg Backup`_
  See :doc:`backups`

Web server
^^^^^^^^^^

We use Nginx_ as a web server. Nginx is efficient, and could serve the static 
assets with automatic compression. Nginx talks to Pyramid through the uWSGI_. 
We have used multiple processes rather than threads.


.. _`Backbone Modal`: http://awkward.github.io/backbone.modal/
.. _`Backbone Subset`: https://github.com/masylum/Backbone.Subset
.. _`Borg Backup`: https://borgbackup.readthedocs.io/en/stable/
.. _`Common Table Expressions`: https://www.postgresql.org/docs/9.5/static/queries-with.html
.. _`Foundation for Emails 2`: http://foundation.zurb.com/emails.html
.. _`hybrid app`: http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/hybrid.html
.. _`joined table inheritance`: http://docs.sqlalchemy.org/en/rel_1_0/orm/inheritance.html#joined-table-inheritance
.. _`jquery-autosize`: http://www.jacklmoore.com/autosize/
.. _`jquery-oembed-all`: https://github.com/nfl/jquery-oembed-all
.. _`jquery.dotdotdot`: http://dotdotdot.frebsite.nl/
.. _`JSON-LD`: http://json-ld.org/
.. _`Linked Data Views`: http://docs.openlinksw.com/virtuoso/rdfviewsrdbms.html
.. _`polyglot persistence`: http://martinfowler.com/bliki/PolyglotPersistence.html
.. _`Python Social Auth`: http://psa.matiasaguirre.net/
.. _`Virtuoso-python`: https://github.com/maparent/virtuoso-python
.. _Apollo: http://dev.apollodata.com/
.. _AirBnb: https://github.com/airbnb/javascript
.. _Alembic: http://alembic.zzzcomputing.com/en/latest/
.. _Angular: https://angularjs.org/
.. _Annotator: http://annotatorjs.org/
.. _`Assembl Styleguide`: https://dev-assembl.bluenove.com/styleguide
.. _anyjson: http://bitbucket.org/runeh/anyjson/
.. _Babel: http://pythonhosted.org/Babel/
.. _BabelJS: https://babeljs.io/
.. _Backbone: http://backbonejs.org/
.. _Beaker: http://beaker.readthedocs.io/en/latest/
.. _Beaker: http://beaker.readthedocs.io/en/latest/
.. _beautifulsoup4: http://www.crummy.com/software/BeautifulSoup/bs4/
.. _Bluebird: http://bluebirdjs.com/
.. _bootstrap_growl: http://ifightcrime.github.io/bootstrap-growl/
.. _Bourbon: http://bourbon.io/
.. _Bower: https://bower.io/
.. _Caravan: http://caravan.coop/en/
.. _Catalyst: http://catalyst-fp7.eu/
.. _`Catalyst interoperability`: http://projects.sigma-orionis.com/catalyst/wp-content/uploads/2014/03/D3.1-Software-Architecture-and-Cross-Platform-Interoperability-Specification.pdf
.. _Celery: http://www.celeryproject.org/
.. _Chai: http://chaijs.com/
.. _CKEditor: http://ckeditor.com/
.. _colander: http://docs.pylonsproject.org/projects/colander/en/latest/
.. _cornice: http://cornice.readthedocs.org/
.. _coverage: https://coverage.readthedocs.io/
.. _D3: https://d3js.org/
.. _dogpile: http://pythonhosted.org/dogpile/
.. _ESLint: http://eslint.org/
.. _`ECMAScript 6`: http://es6-features.org/
.. _enum34: https://bitbucket.org/stoneleaf/enum34
.. _eslint-plugin-flowtype: https://www.npmjs.com/package/eslint-plugin-flowtype
.. _Fabric: http://www.fabfile.org/
.. _Facebook: https://developers.facebook.com/products/
.. _facebook_sdk: https://facebook-sdk.readthedocs.io/en/latest/
.. _feedparser: http://pythonhosted.org/feedparser/
.. _flaky: https://github.com/box/flaky
.. _Flow: https://flow.org
.. _flower: http://flower.readthedocs.io/en/latest/index.html
.. _gensim: http://pythonhosted.org/gensim/
.. _google_api_python_client: http://github.com/google/google-api-python-client/
.. _Graphene: http://graphene-python.org/
.. _`Graphene SQLAlchemy`: http://docs.graphene-python.org/projects/sqlalchemy/en/latest/
.. _GraphQL: http://graphql.org/learn/
.. _Graphviz: http://www.graphviz.org/
.. _Gulp: http://gulpjs.com/
.. _Hopscotch: http://linkedin.github.io/hopscotch/
.. _imaplib2: http://github.com/bcoe/imaplib2
.. _Ink: http://zurb.com/ink/index.php
.. _ipython: http://ipython.org/
.. _iso639: https://github.com/janpipek/iso639-python
.. _isodate: http://cheeseshop.python.org/pypi/isodate
.. _jasmine_splinter_runner: https://github.com/cobrateam/jasmine-splinter-runner
.. _Jed: https://slexaxton.github.io/Jed/
.. _Jinja2: http://jinja.pocoo.org/
.. _jwzthreading: http://www.amk.ca/python/code/jwz.html
.. _Kombu: http://kombu.readthedocs.io/en/latest/
.. _langdetect: https://github.com/Mimino666/langdetect
.. _lodash: https://lodash.com/
.. _linkifyjs: http://soapbox.github.io/linkifyjs/
.. _lxml: http://lxml.de/
.. _Marionette: http://marionettejs.com/
.. _Memcached: https://memcached.org/
.. _Memcached: https://memcached.org/
.. _Mocha: https://mochajs.org/
.. _mock: https://docs.python.org/dev/library/unittest.mock.html
.. _Moment: http://momentjs.com/
.. _Nginx: http://nginx.org/
.. _nodeenv: https://github.com/ekalinin/nodeenv
.. _NodeJS: https://nodejs.org/en/
.. _npm: https://www.npmjs.com/
.. _PdbSublimeTextSupport: http://pypi.python.org/pypi/PdbSublimeTextSupport
.. _PhantomJS: http://phantomjs.org/
.. _Pip: https://pip.pypa.io/en/stable/#
.. _Piwik: https://piwik.org/
.. _Postgres: https://postgresql.org
.. _premailer: http://github.com/peterbe/premailer
.. _psycopg2: http://initd.org/psycopg/
.. _pygraphviz: http://pygraphviz.github.io/
.. _pyIsEmail: https://github.com/michaelherold/pyIsEmail
.. _PyJWT: http://github.com/jpadilla/pyjwt
.. _PyODBC: https://github.com/maparent/pyodbc
.. _PyODBC: https://github.com/maparent/pyodbc
.. _Pyramid: https://trypyramid.com/
.. _pyramid_beaker: http://docs.pylonsproject.org/projects/pyramid_beaker/en/latest/
.. _pyramid_debugtoolbar: http://docs.pylonsproject.org/projects/pyramid-debugtoolbar/en/latest/
.. _pyramid_debugtoolbar_ajax: https://github.com/jvanasco/pyramid_debugtoolbar_ajax
.. _pyramid_dogpile_cache: https://github.com/moriyoshi/pyramid_dogpile_cache
.. _pyramid_ipython: https://github.com/Pylons/pyramid_ipython
.. _pyramid_jinja2: https://github.com/Pylons/pyramid_jinja2
.. _pyramid_mailer: http://docs.pylonsproject.org/projects/pyramid-mailer/en/latest/
.. _pyramid_mako: https://github.com/Pylons/pyramid_mako
.. _PyStemmer: http://snowball.tartarus.org/
.. _pytest: http://pytest.org/latest/contents.html
.. _`pytest fixtures`: http://pytest.org/latest/fixture.html
.. _Python: https://python.org/
.. _python_social_auth: https://github.com/omab/python-social-auth
.. _pytz: http://pythonhosted.org/pytz
.. _pyzmq: https://pyzmq.readthedocs.org/
.. _raven_js: https://github.com/getsentry/raven-js
.. _raven_py: https://github.com/getsentry/raven-python
.. _RDFLib: https://rdflib.readthedocs.io/en/stable/
.. _rdflib_jsonld: https://github.com/RDFLib/rdflib-jsonld
.. _React: https://facebook.github.io/react/
.. _`React Bootstrap`: https://react-bootstrap.github.io/
.. _`React Router`: https://reacttraining.com/react-router/web/guides/quick-start
.. _Redis: http://redis.io/
.. _Redux: http://redux.js.org/
.. _RESTful: https://en.wikipedia.org/wiki/Representational_state_transfer
.. _requests: http://python-requests.org/
.. _scikit_learn: http://scikit-learn.org/
.. _selenium: http://www.seleniumhq.org/
.. _Sentry: https://github.com/getsentry/sentry
.. _Setuptools: http://pythonhosted.org/setuptools/
.. _simplejson: http://github.com/simplejson/simplejson
.. _six: https://pythonhosted.org/six/
.. _SockJS: https://github.com/sockjs/sockjs-client
.. _sockjs_client: https://github.com/sockjs/sockjs-client
.. _sockjs_tornado: https://github.com/assembl/sockjs-tornado/
.. _splinter: https://github.com/cobrateam/splinter
.. _SQLAlchemy: http://www.sqlalchemy.org/
.. _sqltap: http://sqltap.inconshreveable.com/
.. _Supervisord: http://supervisord.org/
.. _Tornado: http://www.tornadoweb.org/en/stable/
.. _transaction: http://transaction.readthedocs.org/en/latest
.. _Underscore: http://underscorejs.org/
.. _uWSGI: https://uwsgi-docs.readthedocs.io/en/latest/
.. _uWSGI: https://uwsgi-docs.readthedocs.io/en/latest/
.. _uwsgitop: http://projects.unbit.it/uwsgi/wiki/StatsServer
.. _Virtuoso: http://virtuoso.openlinksw.com/dataspace/doc/dav/wiki/Main/
.. _Virtualenv: https://virtualenv.pypa.io/en/stable/
.. _waitress: https://github.com/Pylons/waitress
.. _WebOb: http://webob.readthedocs.org/
.. _WebTest: https://webtest.readthedocs.org/en/latest/
.. _Webpack: https://webpack.github.io/
.. _Werkzeug: http://werkzeug.pocoo.org/
.. _WSGI: https://www.python.org/dev/peps/pep-0333/
.. _ZeroMQ: http://zeromq.org/
.. _zope_interface: http://docs.zope.org/zope.interface/
