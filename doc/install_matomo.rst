Install Matomo
==============

Download and preparation
-----------------------

Access your server via SSH and then run these commands to download Matomo

.. code:: sh

    wget https://builds.piwik.org/piwik.zip && unzip piwik.zip
    sudo mkdir /var/www/piwik
    sudo mv piwki /var/www/piwik/

You should have something like this

.. code:: sh

    |-- /
        |-- var/
            |-- www/
                |-- piwki/
                    |-- piwki/
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