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

Firstly, Mocha is loaded in the `tests/index.jinja2` by::

    <script src="assembl/static/js/bower/mocha/mocha.js"></script>

And then instantiated and initialized, Mocha is initalized as such::

    <script> mocha.setup('bdd') </script>
    <script src="../js/build/tests/specs.js"></script>
    <script> mocha.run() </script>

The `tests/specs.js` is the complete test file, built by Gulp_, described below. Mocha
allows for any style of tests to be written. It is up to the developer to decide how many
suites they wish to write. Currently, these are the test suites (specs) written are:

- Context
    * Testing the ``app.common.context`` module
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
is::

    describe("Test Spec name followed by callback that defines the suite", function(){

        //The specific test
        it("Name of the test case followed by function that is the test itself", function(){

            //..A well thought out test case with an assestion
        });
    });


As most test cases include a setUp and a tearDown, below is a complete example a single test with
setUp and tearDown::

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

::
    var expect = require('chai').expect,
        value = 1;

    expect(value).to.be.a('Number');
    expect(value).to.be.ok;

Or TDD style assertions, which are closer to the traditional J-unit style assertions.

::
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



Integration
===========

TODO

.. _Mocha: https://mochajs.org/
.. _Chai: http://chaijs.com/
.. _Pytest: http://pytest.org/latest/
.. _Gulp: http://gulpjs.com/
.. _Sinon: http://sinonjs.org/
.. _Bluebird: http://bluebirdjs.com/docs/getting-started.html
.. _Browserify: http://browserify.org/
.. _`Nyan Cat`: http://www.nyan.cat/ 
.. _`Chai as Promised`: https://github.com/domenic/chai-as-promised
