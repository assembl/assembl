server {
    listen    80;
    #listen    443 ssl;
    
    server_name assembl.yourdomain.com;
    
    #ssl_certificate     /etc/ssl/assembl.yourdomain.com/assembl.yourdomain.com.crt;
    #ssl_certificate_key /etc/ssl/assembl.yourdomain.com/assembl.yourdomain.com.key;
    
    location /something_or_other.html {
        #This is for domain verification
        alias /var/www/assembl/something_or_other.html;
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

        alias /var/www/assembl/assembl/static;    
    }

    location / {

        include uwsgi_params;
        uwsgi_read_timeout 5m;
        uwsgi_pass unix:///var/www/assembl/var/run/uwsgi.sock;
    }

gzip on;
gzip_http_version 1.1;
gzip_vary on;
gzip_comp_level 6;
gzip_proxied any;
#text/html is implicit
gzip_types text/plain text/css application/json application/ld+json application/x-javascript text/xml application/xml application/xml+rss text/javascript application/javascript text/x-js image/svg+xml font/truetype font/opentype application/vnd.ms-fontobject;

}


