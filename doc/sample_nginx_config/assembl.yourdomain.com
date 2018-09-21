server {
    listen   80;
    listen   [::]:80;
    # server_name assembl.yourdomain.com;
    return 301 https://$host$request_uri;
}

upstream urlmetadata {
    server 127.0.0.1:5000;
}

server {
    # listen    80;
    # listen   [::]:80;
    listen   443 ssl http2;
    listen   [::]:443 ssl http2;


    # This is the server name, if you're running multiple servers
    # server_name assembl.yourdomain.com;

    # This assumes usage of letsencrypt.org
    # ssl_certificate     /etc/letsencrypt/live/assembl.yourdomain.com/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/assembl.yourdomain.com/privkey.pem;

    # This corresponds to an intermediate configuration on https://mozilla.github.io/server-side-tls/ssl-config-generator/
    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    # Warning: Setting `ssl_session_tickets` to `off` works only if its value is the same for all `server{}` blocks of all server configurations, or if it is set in an `http{}` block. See https://community.letsencrypt.org/t/errors-from-browsers-with-ssl-session-tickets-off-nginx/18124/5 . It is recommended to either set it to `off` (because implementations are not good enough for the moment), or keep forward secrecy by restarting web servers often enough. See https://github.com/mozilla/server-side-tls/issues/135 and https://wiki.mozilla.org/Security/Server_Side_TLS#TLS_tickets_.28RFC_5077.29
    # ssl_session_tickets off;
    ssl_protocols TLSv1 TLSv1.1 TLSv1.2;
    ssl_ciphers 'ECDHE-ECDSA-CHACHA20-POLY1305:ECDHE-RSA-CHACHA20-POLY1305:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:DHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES128-SHA256:ECDHE-RSA-AES128-SHA256:ECDHE-ECDSA-AES128-SHA:ECDHE-RSA-AES256-SHA384:ECDHE-RSA-AES128-SHA:ECDHE-ECDSA-AES256-SHA384:ECDHE-ECDSA-AES256-SHA:ECDHE-RSA-AES256-SHA:DHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA:DHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA:ECDHE-ECDSA-DES-CBC3-SHA:ECDHE-RSA-DES-CBC3-SHA:EDH-RSA-DES-CBC3-SHA:AES128-GCM-SHA256:AES256-GCM-SHA384:AES128-SHA256:AES256-SHA256:AES128-SHA:AES256-SHA:DES-CBC3-SHA:!DSS';
    ssl_prefer_server_ciphers on;
    add_header Strict-Transport-Security max-age=15768000;
    ssl_stapling on;
    ssl_stapling_verify on;
    ## verify chain of trust of OCSP response using Root CA and Intermediate certs
    # ssl_trusted_certificate /path/to/root_CA_cert_plus_intermediates;

    # resolver <IP DNS resolver>;

    add_header x-xss-protection "1; mode=block" always;
    add_header x-frame-options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    ssl_dhparam /etc/ssl/certs/dhparam.pem;
    server_tokens off;
    # Optional for extra security
    # add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' data: stats.bluenove.com *.facebook.net *.twimg.com *.twitter.com ; frame-src 'self' *.youtube.com *.facebook.com embed.ted.com *.twitter.com twitter.com player.vimeo.com *.motion.ai *.slideshare.net sketchfab.com; connect-src 'self' wss://assembl.yourdomain.com stats.bluenove.com sentry.bluenove.com *.twitter.com; style-src 'self' 'unsafe-inline' fonts.googleapis.com *.twimg.com *.twitter.com; font-src 'self' data: fonts.gstatic.com; img-src 'self' data: stats.bluenove.com www.gravatar.com *.googleusercontent.com *.facebook.com *.twimg.com *.twitter.com framapic.org *.cloudfront.net";

    location /.well-known {
        #This is for domain verification with let's encrypt
        alias /var/www/html/.well-known;
    }

    location /socket {
        proxy_pass http://localhost:8090/socket;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }

    location /urlmetadata/ {
        proxy_http_version 1.1;
        proxy_set_header Host $http_host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Port $server_port;
        proxy_set_header X-Request-Start $msec;
        # we don't want nginx trying to do something clever with
        # redirects, we set the Host: header above already.
        proxy_redirect off;
        rewrite    /urlmetadata/(.*) /$1 break;
        proxy_pass http://urlmetadata;
    }

    location /static {
        #Do NOT put something like "expires modified +1h;" here, it WILL cause problems when deploying a new version.
        #Nor will it help your performance after the first hour...
        autoindex off;

        alias /home/assembl_user/assembl/assembl/static;
    }

    location /static2 {
        #Do NOT put something like "expires modified +1h;" here, it WILL cause problems when deploying a new version.
        #Nor will it help your performance after the first hour...
        autoindex off;

        alias /home/assembl_user/assembl/assembl/static2;
    }

    location /private_uploads {
      internal;
      alias /home/assembl_user/assembl/var/uploads;
    }

    location / {

        include uwsgi_params;
        uwsgi_read_timeout 5m;
        uwsgi_pass unix:///home/assembl_user/assembl/var/run/uwsgi.sock;
    }

# So files uploaded to the database are not artificailly limited by nginx
client_max_body_size 500M;

# Save some bandwidth
gzip on;
gzip_http_version 1.1;
gzip_vary on;
gzip_comp_level 6;
gzip_proxied any;
#text/html is implicit
gzip_types text/plain text/css application/json application/ld+json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/javascript text/x-js image/svg+xml font/truetype font/opentype application/vnd.ms-fontobject;

}
