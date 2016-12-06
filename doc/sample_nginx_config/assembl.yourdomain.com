server {
    listen    80;
    #listen   [::]:80;
    #listen   443 ssl;
    #listen   [::]:443 ssl;

    # This is the server name, if you're running multiple servers
    # server_name assembl.yourdomain.com;

    #ssl_certificate     /etc/ssl/assembl.yourdomain.com/assembl.yourdomain.com.crt;
    #ssl_certificate_key /etc/ssl/assembl.yourdomain.com/assembl.yourdomain.com.key;

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

    location /static {
        #Do NOT put something like "expires modified +1h;" here, it WILL cause problems when deploying a new version.
        #Nor will it help your performance after the first hour...
        autoindex on;

        alias /home/assembl_user/assembl/assembl/static;
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


