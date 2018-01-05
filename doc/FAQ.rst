
Frequently Asked Questions
==========================

When updating Assembl, the database migration process gets stuck and never finishes, what should I do?
------------------------------------------------------------------------------------------------------

Sometimes, the alembic migration process can get stuck.
To solve this, you can open another terminal (and ssh to the remote machine if needed), and run:

.. code:: sh

    cd {your_assembl folder}
    source venv/bin/activate
    supervisorctl status
    supervisorctl stop all
    supervisorctl restart prod: # or supervisorctl restart dev: if you are in development mode
    supervisorctl status
    # You can also run "supervisorctl restart {process}" for each process that was running before

Go back to your initial terminal, and read the rest of the console output to see wether the process continued normally.

When doing a git commit, I got "Error: Cannot find module 'aproba'" with the pre-commit hook
---------------------------------------------------------------------------------------------

It means a js dependency is missing.

To resolve this:

.. code:: sh

    cd assembl/static2
    rm -rf node_modules
    yarn

Why the page is not loading
---------------------------

If the page is not loading, you may have a Python or JavaScript error.

You can look at the console in the browser to see if there is any error.
For some errors, restarting webpack may help:

.. code:: sh

    supervisorctl restart dev:webpack

To view if there is a Python error, execute this command:

.. code:: sh

    supervisorctl tail -f dev:pserve stderr

ImportError: No module named structlog
--------------------------------------

This error means that the structlog package is missing.
This is probably a new dependency added by another developer.
To fix it, you can reexecute:

.. code:: sh

    fab -c configs/local.rc app_compile

or simply:

.. code:: sh

    pip install -r requirements.txt

which is quicker.
