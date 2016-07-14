.. Assembl documentation master file, created by
   sphinx-quickstart on Tue Apr  8 17:15:05 2014.
   You can adapt this file completely to your liking, but it should at least
   contain the root `toctree` directive.

Welcome to Assembl's documentation!
===================================

Installation and administration
-------------------------------
.. toctree::
   :maxdepth: 2

   INSTALL
   backups

Stack and architecture
----------------------

.. toctree::
   :maxdepth: 2

   tech_stack
   permissions_and_roles
   panel_architecture
   synchronization
* `Target login and authentication flowchart <https://github.com/assemblers/assembl/blob/develop/doc/login_flowchart.pdf>`_

Developping and contributing to Assembl
---------------------------------------

.. toctree::
   :maxdepth: 2

   developper_tasks
   documenting
   localization
   docker
   testing
   example_debate
   new_class

APIs
----

.. toctree::
   :maxdepth: 2

   endpoints
   analytics/piwik_reporting_api
   analytics/events
* `The CATALYST Interchange format (CIF) <http://catalyst-fp7.eu/wp-content/uploads/2014/03/D3.1-Software-Architecture-and-Cross-Platform-Interoperability-Specification.pdf>`_ (not currently functional since the migration to postgres 2016-06-30)

Backend class reference
-----------------------
.. toctree::
   :maxdepth: 4

   autodoc/modules

Frontend class reference
------------------------
.. toctree::
   :maxdepth: 3

   jsdoc/index

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
