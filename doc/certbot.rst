How to set https on production servers:
=======================================

Set the proper domain name in RC file.

Install certbot

.. code-block:: sh

    fab -c {RC_FILE} install_certbot


Generate https certificate and set crontab to generate them automatically

.. code-block:: sh

    fab -c {RC_FILE} generate_certificate

In your local.ini file. if `require_secure_connection` or `accept_secure_connection` is set to false, set it to true. Then restart production with

.. code-block:: sh

    supervisorctl restart prod:

Then you must update your nginx configuration file. You can use the command

.. code-block:: sh

    fab -c {RC_FILE} setup_nginx_file


