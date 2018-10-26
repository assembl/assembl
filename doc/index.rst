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
   configuration
   backups
   howtoupgrade
   python_requirements
   preprod_update
   install_sentry
   install_matomo

Stack and architecture
----------------------

.. toctree::
   :maxdepth: 2

   tech_stack
   permissions_and_roles
   panel_architecture
   synchronization
* `Target login and authentication flowchart <https://github.com/assembl/assembl/blob/develop/doc/login_flowchart.pdf>`_

Developing and contributing to Assembl
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
   fontello
   flow
   storybook

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
   
   
Consultation Notes
------------------

.. toctree::
  :maxdepth: 1
  
  consultant_notes

Indices and tables
==================

* :ref:`genindex`
* :ref:`modindex`
* :ref:`search`
