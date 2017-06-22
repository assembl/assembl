=============
Writing tests
=============

Overview
========

Assembl makes use of both backend and front-end testing technologies in order to
conduct tests. However, historically, the project suffered from the lack of
adoption of modern testing patterns such as TDD_ or BDD_. As a result, it did
not become developer culture to create tests for every new business logic added.
Thankfully, the testing pipeline is fully developed for TDD_ based testing to
be written by developers.

Front-end
=========

Assembl takes advantage of modern javascript testing frameworks in order to run
front-end tests. The front-end test runner is the Mocha_ framework. It is 
understood that Mocha was chosen solely because it allows for the test reporter to
be set to `Nyan Cat`_ colors. Mocha is initalized on Assembl start-up in
`assembl/templates/tests/index.jinja2`.

Firstly, Mocha is loaded in the `tests/index.jinja2` by:

.. code-block:: html

    <script src="assembl/static/js/bower/mocha/mocha.js"></script>

And then instantiated and initialized, Mocha is initalized as such:

.. code-block:: html

    <script> mocha.setup('bdd') </script>
    <script src="../js/build/tests/specs.js"></script>
    <script> mocha.run() </script>

The `tests/specs.js` is the complete test file, built by Gulp_, described below. Mocha
allows for any style of tests to be written. It is up to the developer to decide how many
suites they wish to write. Currently, these are the test suites (specs) written are:

- Context
    * Testing the :js:class:`Context` module
- Langstring
    * Testing the front-end langstring logic
- Models
    * Testing ``Backbone.Model`` logic
- Objects
    * Testing javascript ``Object``\s that are hosted in the ``/js/app/objects/`` directory
- Routes
    * Testing the ``app.router`` module
- Utils
    * Testing the modules in the ``/js/app/utils`` directory
- Views
    * Testing the ``Backbone.View`` objects that are housed in the ``/js/app/views/`` directory 


All tests exist in the ``/static/js/app/tests/`` directory with the pattern::

    testName.spec.js


Mocha Example
-------------

Mocha allows for nested spec descriptions (test suites). An example of a synchronous Mocha test
is:

.. code-block:: javascript

    describe("Test Spec name followed by callback that defines the suite", function(){

        //The specific test
        it("Name of the test case followed by function that is the test itself", function(){

            //..A well thought out test case with an assestion
        });
    });


As most test cases include a setUp and a tearDown, below is a complete example a single test with
setUp and tearDown:

.. code-block:: javascript

    describe("Test Spec name followed by callback that defines the suite", function(){

        var globalVar;

        //Run before each test case
        beforeEach(function(){
            globalVar = 'nyan';
        });

        //Run after each test case
        afterEach(function(){
            globalVar = null;
        });

        //The specific test
        it("Name of the test case followed by function that is the test itself", function(){

            //..A well thought out test case with an assestion
            assert.isEqual(globalVar, 'nyan');
        });
    });


TODO
^^^^

Mocha also allows for asynchronous testing, specifically promisified test cases. As Assembl
heavily uses Bluebird_ promises, it would be ideal to use an assertion library that supports
assertion. Mocha already allows for asynchronous testing (refer to Mocha_ documentation).

A well known and compatible promise-based assertion library is the `Chai as Promised`_, which
should be added to Assembl's package.json once a developer writes asynchronous tests.


Assertion
---------
Javascript allows for many different kinds of assertions. One of the popular packages used by
developers (in 2014) was Chai_. Chai allows for different styles of assertions.

They include BDD style assertions, which has been sprinkled throughout the currently written specs

.. code-block:: javascript

    var expect = require('chai').expect,
        value = 1;

    expect(value).to.be.a('Number');
    expect(value).to.be.ok;

Or TDD style assertions, which are closer to the traditional J-unit style assertions.

.. code-block:: javascript

    var assert = require('chai').assert,
        value = 1;

    assert.isNumber(value, "Value is a number");
    assert.isOK(value, "This should pass");


Mocking
-------
This is not yet implemented. However, the recommended mocking libary is Sinon_. Sinon allows
for natural and simple stubs to be created of core objects which can then be easily
tested. Refer to the Sinon_ documentation for stubs on how to convert a jQuery ajax method
into a stub. This can be used heavily to override an XmlHttpRequest to a server. This, along
with fixtures can be used to test the front-end functionality.

Fixtures
--------
Front-end fixtures currently exist in the ``/js/app/tests/fixtures`` directory. Currently they
are hand-written json files that describe different objects as represented from the back-end.
This is fragile and inefficient. Developers are currently working on adding fixtures from the
backend as json files to be consumed by front-end tests.

Gulp
----
Assembl's front-end tests are divided into multiples files in the ``js/app/tests`` directory.
However, they are served to a single file. This is thanks to a the gulp process ``build:test``
which is used to bundle the tests. This means that Browserify_ can be used in the testing
process as well.

How to Run
----------

Front-end tests can be run for each discussion in the ``/test`` API point. For example, the mocha
tests can be run on the browser at the location::

    https://assembl2.coeus.ca/sandbox/test 

Currently, there is no command-line tool to run the tests on the CLI. This is currently in the works
to be added.


Back-end
========

Back-end testing is carried out via `py\.test`_ Python library. It acts as both the test runner and
the fixture generator. Pytest allows for a level of flexibility in writing tests that the regular
Python unittest_ library simply doesn't have. It allows to write tests similarly to unittest allows,
with a TestCase class created with multiple `test_method`\s written inside.

Assembl uses py.test's fixture's in order to mock objects for testing.

Fixtures
--------
Assembl fixtures are defined in the `/assembl/tests/fixtures/` directory. Fixtures can be divided into
multiple files for ease of use.

The fixtures are read into the py.test test-runner by the use of the ``conftest.py``. All fixtures
are loaded into the runner by importing them. Here is an example of loading `langstring` fixtures:

.. code-block:: python

    from assembl.tests.fixtures.langstring import *

When creating new fixture files, you **must** include them in the ``conftest.py``, otherwise they
will not be available to the test runner.


How To Write A Fixture
^^^^^^^^^^^^^^^^^^^^^^

Writing test fixtures in Assembl is extremely simple. Within the fixture folder, in either a new file or an
existing one, simply create a function with the py.test fixture decorator, like such:

.. code-block:: python

    @pytest.fixture(scope='function')
    def your_new_fixture(dependent_fixture):
        pass

In the example above, the ``dependent_fixture`` is a previously written fixture. The fixture can exist
in either the same file or another; it matters not. The fixtures are not run from that particular file.
They are all loaded into the conftest namespace.

Core Fixtures
^^^^^^^^^^^^^

Assembl has several core fixtures that are important to note, in order to run them.

- default_db_data
    * A fixture that is rarely explicitly called in a test, however, is vital for successfully
      running back-end tests. It is responsible for bootstrapping the test database, creating the
      tables necessary based on the latest models, building the relationships and constraints, etc.
      Without this fixture, back-end tests could not be done.

- test_session
    * Arguably the most important fixture to know. ``test_session`` is the database session
      fixture. It can be used to query the database, push new models, etc. It is an SQLAlchemy
      session maker. A ``test_session`` depends on a ``default_db_data``

- test_server
    * A uWSGI server fixture that refers to an Assembl instance

- test_app
    * An Assembl instance fixture, built on WebTest's TestApp_ testing tool. This fixture
      builds on ``test_app_no_perm`` and gives the ``admin_user`` fixture administrative permissions,
      based on Pyramid's authorization policy. Use this fixture to make API calls, as it best
      mocks an Assembl interface

- admin_user
    * A user fixture that has administrative privileges

- test_adminuser_webrequest
    * A Pyramid GET request to "/", built on WebTest's TestRequest_, that includes an ``admin_user``
      as its ``authenticated_user_id``.

- browser
    * A browser fixture that is built on top of Splinter_ for integration testing. This specific fixture
      is bound to the `phantom\.js`_ driver. To create a different, use this fixture as a template for
      creating other drivers. Splinter has explicit documentation of different driver usages.


Getting Started
^^^^^^^^^^^^^^^

To get started with testing in Assembl, please refer to the :ref:`TestingAnchor`.


For more information regarding testing a Pyramid application, see the `Pyramid Documentation`_ on testing.
Assembl uses WebTest_ to conduct it's integration testing of a Pyramid application.


Authentication Token From Email
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

This is a simple tutorial for sections that are not documented well. In order to test authentication tokens sent
to newly registered users, or users who have forgotten their passwords, the following steps will simplify your job.
It is hardly an automated process, but it is useful to have this knowledge.

First, uncomment the following line from your `local.ini` file

.. code:: ini

    # mail.port = 8025

This will enable you to use a debugging server. Open a new terminal.

.. code:: sh

    source venv/bin/activate
    python -m smtpd -n -c DebuggingServer

Outgoing emails will be viewable in the terminal. To test it, run a local assembl instance.

.. code:: sh

    source venv/bin/activate
    supervisord
    supervisorctl start dev:server

Enter the login page, and choose the option "Forgot my password". Enter your username or email, assuming that you already
have an account in your local Assembl instance. Submit. You should now see the outbound email in your `DebuggingServer` terminal.
In the plaintext section of the email, copy the URL sent to change the password. This URL must, in fact, be altered. Here is a the mapping::

    "=" => line-break
    "%3D" => "="

Replacing those characters, you should have a URL like the following

`http://localhost:6543/debate/sandbox/do_password_change/037672017097193710TvqNU6m5zof0wwK7hpwZkn14-0K9cH8DeHEDtiEy7ASpLdY=`

Viola! You now have a fully formed URL for changing a password, including the authentication token required to do so. 

TODO

.. _Mocha: https://mochajs.org/
.. _Chai: http://chaijs.com/
.. _Pytest: http://pytest.org/latest/
.. _Gulp: http://gulpjs.com/
.. _Sinon: http://sinonjs.org/
.. _Bluebird: http://bluebirdjs.com/docs/getting-started.html
.. _Browserify: http://browserify.org/
.. _TDD: http://agiledata.org/essays/tdd.html
.. _BDD: https://en.wikipedia.org/wiki/Behavior-driven_development
.. _`py\.test`: http://pytest.org/latest/
.. _`Nyan Cat`: http://www.nyan.cat/ 
.. _`Chai as Promised`: https://github.com/domenic/chai-as-promised
.. _unittest: https://docs.python.org/2.7/library/unittest.html
.. _TestApp: http://docs.pylonsproject.org/projects/webtest/en/latest/testapp.html
.. _TestRequest: http://docs.pylonsproject.org/projects/webtest/en/latest/api.html#webtest-app-testrequest
.. _WebTest: http://docs.pylonsproject.org/projects/webtest/en/latest/
.. _`Pyramid Documentation`: http://docs.pylonsproject.org/projects/pyramid/en/latest/narr/testing.html
.. _Splinter: https://splinter.readthedocs.io/en/latest/
.. _`phantom\.js`: http://phantomjs.org/
