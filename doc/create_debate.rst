Create a debate
=============

Create the email:
-----------------

Add your domain to bluehost:
~~~~~~~~~~~~~~~~~~~~~~~~~~~~

Go to `bluehost`_ and log in.

Go to `Assign a domain`_

Choose the option: ``Use a domain that is not already associated with your account.`` and set your domain

You will be then asked to verify your ownership of the domain. 

You should connect via ssh to your server

Create a file in ``/var/www/html`` named ``{hash}.html`` with the `hash` being given to you by bluehost under ``step 2``. Write the second given hash in this file.

Now you should set an endpoint to it in the nginx file. In your nginx file config, you should add the block:

.. code:: sh

    location /{hash}.html {
        autoindex on;
        expires modified +1h;
        alias /var/www/html/{hash}.html;
    }

Restart nginx

.. code:: sh

    /etc/init.d/nginx restart

Under step 3 select ``Parked Domain``

Clic on ``assign this domain`` button


Create email:
~~~~~~~~~~~~~

In `email account`_, clic ``Create an Email Account``

* Fill ``Enter name``
* Select your domain in the dropdown menu
* Fill ``Enter password`` and ``Retype password``. This password is needed in the next step.
* Clic ``Create`` button

Create Debate:
--------------

* Fill ``Topic`` and ``Slug``
* Fill ``Host``
* Port must be 143
* ``Username`` and ``Password`` are the one you wrote in bluehost email creation
* Clic ``Create`` button


.. _`bluehost`: https://www.bluehost.com/
.. _`Assign a domain`: https://my.bluehost.com/cgi/hosting/assign
.. _`email account`: https://my.bluehost.com/hosting/email_manager