
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

    fab -c assembl/configs/local.rc app_compile

or simply:

.. code:: sh

    pip install -r requirements.txt

which is quicker.


When I run flow, it never finishes and re-initializes infinitely
----------------------------------------------------------------

If you have local code changes, you may have to edit `assembl/static2/flow/object_types.js` accordingly.

For the moment, we use flow version 0.52 which has this issue https://github.com/facebook/flow/issues/3528 . As of today, latest version is 0.67, but we have not updated it yet, because 0.53 introduces some breaking changes.

Sometimes the issue is also fixed after a `fab -c assembl/configs/local.rc app_compile` or a reboot.

A working solution is to run flow from a docker container:

```
docker pull node:6
cd assembl/static2
git checkout develop
yarn install # si on était sur une branche qui avait d'autres versions des dépendances (notamment de flow)
docker run --rm -v $PWD:/app node:6 bash -c "cd /app; npm run flow"
```

And then adapt your `.pre-commit-config.yaml` file.


I want to change the title which shows on a tab of a debate
------------------------------------------------------------
On staging or production instances, you should change the `index_react.jinja2` file to set `block page_title` to the value you want for your debate.

Afterwards you should restart `prod:uwsgi`

I modified a .jinja2 file but the server still shows the old version
--------------------------------------------------------------------

Changes in a .jinja2 file are not visible until you restart the web server process (if `supervisorctl status` shows that `dev:pserve` is running, run `supervisorctl restart dev:pserve`, or same thing for `prod:uwsgi`).
