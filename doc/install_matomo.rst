Install Matomo
==============

Download and preparation
-----------------------

Access your server via SSH and then run these commands to download Matomo

.. code:: sh

    wget https://builds.piwik.org/piwik.zip && unzip piwik.zip
    sudo mkdir /var/www/piwik
    sudo mv piwik /var/www/piwik/

You should have something like this

.. code:: sh

    |-- /
        |-- var/
            |-- www/
                |-- piwik/
                    |-- piwik/
                        |-- config/

                        |-- misc/

                        |-- README.md

                        |-- ...    

Configure Apache2
-----------------

Create a new file in ``/etc/apache2/sites-available/`` and add the following configuration to this new file.

.. code:: sh

    <VirtualHost *:80>
        ServerName $hostname
        Redirect / https://$hostname/
    </VirtualHost>

    <VirtualHost *:443>
        ServerName $hostname

        ServerAdmin assembl.admin@bluenove.com
        DocumentRoot /var/www/piwik/piwik

        SSLEngine on
        # Path to use letsencrypt with apache2
        SSLCertificateFile /etc/letsencrypt/live/$hostname/cert.pem
        SSLCertificateKeyFile /etc/letsencrypt/live/$hostname/privkey.pem
        SSLCertificateChainFile /etc/letsencrypt/live/$hostname/chain.pem

        ErrorLog ${APACHE_LOG_DIR}/piwik_error.log
        CustomLog ${APACHE_LOG_DIR}/piwik_access.log combined

        Alias /custom/ "/var/www/custom/"
        <Directory "/var/www/custom/">
            Options FollowSymLinks
        </Directory>
    </VirtualHost>

For the SSL lines, you should follow this gide to secure Apache with let's encrypt:
https://www.digitalocean.com/community/tutorials/how-to-secure-apache-with-let-s-encrypt-on-ubuntu-16-04

Apply changes:

.. code:: sh

    sudo a2ensite /etc/apache2/sites-available/sentry.bluenove.com.conf
    sudo /etc/init.d/apache2 restart

The website should be accessible with the given ServerName URL

You can now follow the configuration steps.

Documentation: https://matomo.org/docs/installation/#getting-started

Set GeoIP2
----------

Download **GeoLite2 City**: https://dev.maxmind.com/geoip/geoip2/geolite2/#Downloads

Copy it to your server:

.. code:: sh
    
    tar -xzf GeoLite(...).tar.gz
    scp GeoLite(...)/GeoLite2-City.mmdb $piwik_user@$hostname:/var/www/piwik/piwik/misc/

Then go to your matomo website

Settings > System > Geolocation

**GeoIP Legacy (PECL)** should be accessible. Select it and you are done.


Install via Docker
------------------

Installation via docker can be much simpler than the above for remote services. This form of installation is best suited for
private enterprises who do not desire to share analytics data with other servics on a centralized service. Whilst Matomo does
not track user information and anonymizes on IP address, enterprise security policies of enterprises will force data
segregation on 3rd party tools.

To start, git clone the recommended repository_ from the official Matomo docker repository. The commit which this documentation
is based on is '01fd77b_'

There will be several changes that you will be making.


::

    networks:
        lb_web:
            external: true
        back:
            driver: bridge
            internal: true


::
    
    # Ensure that the $ROOT_PASSWORD is set as environment variable. If not, put it directly in this file. This is
    # highly discouraged, however. Tread cautiously.
    services:
      db:
        environment:
          - MYSQL_ROOT_PASSWORD=$ROOT_PASSWORD


::

    # Ensure to change the piwik:fpm image to matomo:fpm
    app:
        image: matomo:fpm
        ...
    cron:
        image: matomo:fpm
        ...

::

    # Make sure that $EXTERNAL_PORT is set appropriately. If the machine is solely used for Matomo,
    # set $EXTERNAL_PORT=80. If this installation is behind another proxy, then set $EXTERNAL_PORT=9005
    # or an available port. Ensure that the host reverse proxy routes requests to $EXTERNAL_PORT
    web:
        image: nginx
        ...
        ports:
            - $EXTERNAL_PORT:80


In order to allow redirections from host proxy to docker proxy (web), below is a sample NGINX configuration.

.. code-block:: shell

    server {
        ...

        location / {
            proxy_pass http://localhost:$EXTERNAL_PORT/;
            proxy_set_header        Host               $host;
            proxy_set_header        X-Real-IP          $remote_addr;
            proxy_set_header        X-Forwarded-Host   $host:443;
            proxy_set_header        X-Forwarded-For    $proxy_add_x_forwarded_for;
            // Only in case the host service will manage TLS certificates
            proxy_set_header        X-Forwarded-Port   443;
        }    
    }

.. warning::

    Docker directly manipulates iptables. Under most secure machines, UFW of Ubuntu is installed, which does not see
    the modifications made by the iptables. As a result, communicating with the docker web service becomes impossible.
    In order to disable this, the docker deamon must be reconfigured and restarted. Often, the code block below is
    sufficient. For more information, see here_ and more information can be `found here`_.


    # Add this to /etc/default/docker file && services docker restart
    ``DOCKER_OPTS="--dns 8.8.8.8 --dns 8.8.4.4 --iptables=false"``

    Of course, these options can also be manually added to the `docker run` commands


.. _repository: https://github.com/libresh/compose-matomo
.. _01fd77b: https://github.com/libresh/compose-matomo/blob/01fd77bb50f1bcad81663f0fb3bbf81cb29c6e43/docker-compose.yml
.. _here: https://blog.viktorpetersson.com/2014/11/03/the-dangers-of-ufw-docker.html
.. _`found here`: https://forums.docker.com/t/running-multiple-docker-containers-with-ufw-and-iptables-false/8953/8