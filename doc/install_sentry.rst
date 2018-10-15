Installing Docker Sentry
========================

Install docker
--------------

Install docker-ce:
Follow the steps of this link under the **Install Docker CE** section
https://docs.docker.com/install/linux/docker-ce/ubuntu/#install-docker-ce

Install docker-compose:
Follow step one
https://www.digitalocean.com/community/tutorials/how-to-install-docker-compose-on-ubuntu-16-04#step-1-%E2%80%94-installing-docker-compose

.. code:: sh

    sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

Follow the steps under **Up and Running** section
https://github.com/getsentry/onpremise/blob/master/README.md#up-and-running

Follow this steps:
https://docs.sentry.io/server/installation/docker/
or use this commands:

.. code:: sh

    make build
    sudo docker run   --detach   --name sentry-redis   redis:3.2-alpine
    sudo docker run   --detach   --name sentry-postgres   --env POSTGRES_PASSWORD=secret   --env POSTGRES_USER=sentry   postgres:9.5
    sudo docker run   --detach   --name sentry-smtp   tianon/exim4
    sudo docker run   --rm ${REPOSITORY}   config generate-secret-key

put the given key to docker-compose.yml and set the correct value 
.. code:: sh

    SENTRY_SECRET_KEY: $(YOUR_KEY)
    extra_hosts:
      - "dockerhost:42.42.42.42" #replace 42.42.42.42 by the server IP

.. code:: sh

    sudo docker run --rm -it sentry-onpremise upgrade
    sudo docker run   --detach   --name sentry-web-01   --publish 9000:9000   sentry-onpremise   run web
    sudo docker run   --detach   --name sentry-worker-01   sentry-onpremise   run worker
    sudo docker run   --detach   --name sentry-cron   sentry-onpremise   run cron


Apache configuration
--------------------

Secure Apache with Let's encrypt:
https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu-16-04

.. code:: conf

    <VirtualHost *:80>
        ServerName sentry.bluenove.com

        RewriteEngine On
        RewriteCond %{HTTPS} !=on
        RewriteRule ^/?(.*) https://%{SERVER_NAME}/$1 [R,L]
    </VirtualHost>

    <VirtualHost *:443>
        ServerName sentry.bluenove.com

        SSLEngine on
        SSLCertificateFile /etc/letsencrypt/live/sentry.bluenove.com/fullchain.pem
        SSLCertificateKeyFile /etc/letsencrypt/live/sentry.bluenove.com/privkey.pem
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

    sudo a2ensite sentry.bluenove.com.conf 
    sudo /etc/init.d/apache2 restart


Update docker-sentry
--------------------

Follow the steps under **Updating Sentry**
https://github.com/getsentry/onpremise/blob/master/README.md#updating-sentry


Mail configuration
------------------

set your mail configuration in config.yml or do it with the admin UI of sentry at https://your.url/manage/status/mail/

.. code:: sh

    mail.backend: 'smtp'  # Use dummy if you want to disable email entirely
    mail.host: 'host url'
    mail.port: 25
    mail.username: 'sentry@stats.bluenove.com'
    mail.password: 'password'
    mail.use-tls: true
    # The email address to send on behalf of
    mail.from: 'sentry@stats.bluenove.com'

    # If you'd like to configure email replies, enable this.
    mail.enable-replies: false