
Frequently Asked Questions
==========================

When updating Assembl, the database migration process gets stuck and never finishes, what should I do?
------------------------------------------------------------------------------------------------------

Sometimes, the alembic migration process can get stuck.
To solve this, you can open another terminal (and ssh to the remote machine if needed), and run:

.. code:: sh

    cd {your_assembl folder}
    source venv/bin/activate
    supervisorctl stop all
    supervisorctl restart prod: # or supervisorctl restart dev: if you are in development mode

Go back to your initial terminal, and read the rest of the console output to see wether the process continued normally.



