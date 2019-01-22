Setting up Dovecot and VMM
==========================

This allows to set up assembl so email accounts for discussion are auto-created when a discussion is created.

Principles
----------

Dovecot is the IMAP server. Vmm configures a user data model in
Postgres. We will tell dovecot and postfix to look for users there. We
will mostly follow the installation and configuration instructions steps
in http://vmm.localdomain.org/install.html We are installing Dovecot
2.x, so choose sections appropriately.

The instructions mention ``/path/to/vmm-0.6.2/pgsql``, those files are
put in ``/usr/share/doc/vmm/examples/pgsql`` by ``apt-get``. Here are further
instructions for specific steps.

Installation prerequisites
--------------------------

.. code-block:: sh

    fab -c assembl/configs/develop.rc install_dovecot_vmm
    fab -c assembl/configs/develop.rc install_postfix

If the postgres database is local, and that step has not been done:

.. code-block:: sh

    fab devenv install_postgres

Make sure your (full) hostname is set in ``/etc/hostname`` and ``/etc/mailname``.

PostgreSQL configuration
------------------------

Please ensure you have a the psycopg2 driver installed when you continue with the permission setup. This can be done in two different ways. The recommended way is to use the system repository, like shown below.

.. code-block:: sh

    sudo apt-get install python-psycopg2

Another way is to use the global ``pip`` system. This is the less recommended way.

.. code-block:: sh

    pip install psycopg2

``pg_hba.conf`` is in ``/etc/postgresql/9.5/main/``.

We did not bother to create a mailsys entry since ``all`` already has
``md5`` login permissions. Make sure to note the passwords. TODO: We
need to put them in some config files.

Dovecot configuration
---------------------

Remember to use the Dovecot 2.x section. We did not set up sieve or
quotas.

In ``dovecot.conf``, we have the line

.. code-block:: ini

    protocols = imap lmtp

This might also be handled by ``!include_try /usr/share/dovecot/protocols.d/*.protocol`` in the same file. Look in that directory.

Note that the path for ``dovecot-sql.conf.ext`` is
``/etc/dovecot/dovecot-sql.conf.ext`` and not
``/usr/local/etc/dovecot/dovecot-sql.conf.ext``.

Do not forget this "otherwise uncomment the following user_query":

..code:: ini

    user_query = SELECT home, uid, gid, mail FROM dovecotuser('%Ln', '%Ld')


In ``/etc/dovecot/conf.d/10-auth.conf``, also put the following:

.. code-block:: ini

    disable_plaintext_auth = yes
    !include auth-sql.conf.ext

In ``/etc/dovecot/conf.d/10-ssl.conf``, you could use the same keys as for https (provided you use the same server name.)
You can uncomment ``ssl = yes``.

Postfix configuration
---------------------

In ``/etc/postfix/main.cf`` , add

.. code-block:: ini

    mydestination = localhost

Also set your ssl key in those variables:

.. code-block:: ini

    smtpd_tls_cert_file=/path/to/fullchain.pem
    smtpd_tls_key_file=/path/to/privkey.pem
    smtp_tls_cert_file=/path/to/fullchain.pem
    smtp_tls_key_file=/path/to/privkey.pem

and add the following:

.. code-block:: ini

    smtp_tls_CApath = /etc/ssl/certs
    smtp_tls_CAfile =  /etc/ssl/certs/ca-certificates.crt
    smtp_tls_loglevel = 1
    smtp_tls_session_cache_database = btree:${data_directory}/smtp_scache
    smtp_tls_security_level = may
    
    smtpd_relay_restrictions = permit_mynetworks permit_sasl_authenticated defer_unauth_destination
    smtpd_tls_security_level = may
    smtpd_tls_mandatory_ciphers = medium
    smtpd_tls_mandatory_exclude_ciphers = aNULL, MD5
    smtpd_tls_mandatory_protocols = !SSLv2, !SSLv3
    smtpd_tls_received_header = yes
    smtpd_tls_session_cache_timeout = 3600s
    tls_random_source = dev:/dev/urandom

Make sure that `relayhost =` is empty

VMM configuration
-----------------

Wo don't have ``install.sh``. Instead:

.. code-block:: sh

    cp /usr/share/doc/vmm/examples/postfix/* /etc/postfix

and adjust passwords (and host) by hand in those files.

In ``/etc/vmm/vmm.cfg``:

.. code-block:: diff

    135c136
    < password_scheme = SHA512-CRYPT
    ---
    > password_scheme = CRAM-MD5

(This is weak, but not sure that ``scram-sha1`` in
http://wiki2.dovecot.org/Authentication/Mechanisms is the same.)

In ``/etc/vmm/vmm-db.cfg``:

Adjust password, host and:

.. code-block:: ini

    ; Database name (String)
    name = mailsys


Use VMM
-------

Explore vmm commands at http://vmm.localdomain.org/howto.html

Basically, you need to create the base domain, a postmaster account, and
an account for the assembl instance, possibly ``assembl@example.domain``
(added to ``local.ini`` below, with its appropriate password). Other
users will be created automatically by vmm.

sudoer
------

If you have many assembl instances on the server, you may want to create
an assembls group instead of giving permissions to each. I will assume
that there is an ``assembls`` group and that users are members of that
group.

.. code-block:: sh

    addgroup assembls
    usermod -a -G assembls assembl_user

Use ``visudo`` to edit ``/etc/sudoer``.

Then give permissions to that group to execute the vmm ua command:

::

    %assembls ALL=NOPASSWD: /etc/init.d/nginx restart , /etc/init.d/nginx reload , /etc/init.d/nginx stop , /etc/init.d/nginx start, /usr/sbin/vmm ua *

Assembl adjustments
-------------------

In ``local.ini``

.. code-block:: ini

    assembl.admin_email = assembl@example.domain
    mail.host = localhost
    mail.username = assembl@example.domain
    mail.password = (password of the assembl user.)
    mail.tls = true
    imap_domain = ...
    discussion_callbacks =
        assembl.processes.create_vmm_source.CreateVMMMailboxAtDiscussionCreation


Testing
-------

Restart dovecot and postfix (``/etc/init.d/postfix restart`` and ``/etc/init.d/dovecot restart``), and look for any startup error in ``/var/log/mail.log``.

to test postfix, start a ``pshell`` in assembl, and try the following with a real recipient:

.. code-block:: python

    from pyramid_mailer import get_mailer
    from pyramid_mailer.message import Message
    from assembl.lib import config

    mailer = get_mailer(request)
    message = Message(subject="hello world",
       sender=config.get('assembl.admin_email'),
       recipients=["test_recipient@example.com"],body="test")
    mailer.send_immediately(message)

(Testing dovecot todo.)
