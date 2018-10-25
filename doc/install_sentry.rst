Installing Docker Sentry
========================

Install docker
--------------

Install docker-ce:
~~~~~~~~~~~~~~~~~~

Follow the steps of this link under the `Install Docker CE`_ section


Install docker-compose:
~~~~~~~~~~~~~~~~~~~~~~~

Follow step one on `this link`_

.. code:: sh

    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

Follow the steps under `Up and Running`_ section
and these steps: https://docs.sentry.io/server/installation/docker/

or use these commands:

.. code:: sh

    make build
    sudo docker run   --detach   --name sentry-redis   redis:3.2-alpine
    sudo docker run   --detach   --name sentry-postgres   --env POSTGRES_PASSWORD=secret   --env POSTGRES_USER=sentry   postgres:9.5
    sudo docker run   --detach   --name sentry-smtp   tianon/exim4
    sudo docker run   --rm ${REPOSITORY}   config generate-secret-key

Put the given key to docker-compose.yml and set the correct value 

.. code:: sh

    SENTRY_SECRET_KEY: $(YOUR_KEY)
    extra_hosts:
      - "dockerhost:42.42.42.42" #replace 42.42.42.42 by the server IP

and continue with these

.. code:: sh

    sudo docker run --rm -it sentry-onpremise upgrade
    sudo docker run   --detach   --name sentry-web-01   --publish 9000:9000   sentry-onpremise   run web
    sudo docker run   --detach   --name sentry-worker-01   sentry-onpremise   run worker
    sudo docker run   --detach   --name sentry-cron   sentry-onpremise   run cron


Apache configuration
--------------------

`Secure Apache with Let's encrypt`_

Create a new file in ``/etc/apache2/sites-available/``
Add this to this new file

.. code:: sh

    <VirtualHost *:80>
        ServerName $hostname

        RewriteEngine On
        RewriteCond %{HTTPS} !=on
        RewriteRule ^/?(.*) https://%{SERVER_NAME}/$1 [R,L]
    </VirtualHost>

    <VirtualHost *:443>
        ServerName $hostname

        SSLEngine on
        SSLCertificateFile /etc/letsencrypt/live/$hostname/fullchain.pem
        SSLCertificateKeyFile /etc/letsencrypt/live/$hostname/privkey.pem
        Include /etc/letsencrypt/options-ssl-apache.conf

        ProxyPreserveHost On
        ProxyRequests Off
        # setup the proxy
        <Proxy *>
            Order allow,deny
            Allow from all
        </Proxy>
        ProxyPass / http://localhost:9000/
        ProxyPassReverse / http://localhost:9000/
    </VirtualHost>

apply changes:

.. code:: sh

    sudo a2ensite $hostname.conf 
    sudo /etc/init.d/apache2 restart


Update docker-sentry
--------------------

Follow the steps under `Updating Sentry`_


Mail configuration
------------------

Set your mail configuration in config.yml or do it with the admin UI of sentry at https://$hostname/manage/status/mail/

.. code:: sh

    mail.backend: 'smtp'  # Use dummy if you want to disable email entirely
    mail.host: 'host url'
    mail.port: 25
    mail.username: 'sentry@$hostname'
    mail.password: 'password'
    mail.use-tls: true
    # The email address to send on behalf of
    mail.from: 'example@$hostname'

    # If you'd like to configure email replies, enable this.
    mail.enable-replies: false

.. _`Install Docker CE`: https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-docker-ce
.. _`Up and Running`: https://github.com/getsentry/onpremise/blob/master/README.md#up-and-running
.. _`this link`: https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04#step-1-%E2%80%94-installing-docker-compose
.. _`Secure Apache with Let's encrypt`: https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu-16-04
.. _`Updating Sentry`: https://github.com/getsentry/onpremise/blob/master/README.md#updating-sentry