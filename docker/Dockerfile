FROM    ubuntu:16.04

ENV     DEBIAN_FRONTEND noninteractive
ARG	GITREPO=https://github.com/imaginationforpeople/assembl.git
ARG	GITBRANCH=master

RUN     apt-get update && apt-get install -y \
            fabric \
            git \
            openssh-server \
            pandoc \
            sudo \
            net-tools \
            monit \
            nginx \
            uwsgi \
            uwsgi-plugin-python
RUN     ssh-keygen -P '' -f ~/.ssh/id_rsa && \
            cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
RUN     cd /opt ; set -x ; git clone -b $GITBRANCH $GITREPO
WORKDIR /opt/assembl
RUN     /etc/init.d/ssh start && \
           ssh-keyscan localhost && \
           cp production.ini local.ini && \
           sed -i 's/accept_secure_connection = true/accept_secure_connection = false/' local.ini && \
           fab devenv install_single_server && \
           cp docker/nginx_config_docker/default /etc/nginx/sites-enabled/ && \
           /etc/init.d/ssh stop
RUN     /etc/init.d/ssh start && \
           ssh-keyscan localhost && \
           /etc/init.d/postgresql start && \
           /etc/init.d/redis-server start && \
           chgrp www-data -R var && \
           chmod g=u -R var && \
           fab devenv bootstrap_from_checkout && \
           . venv/bin/activate && \
           assembl-add-user --email root@localhost --name "Admin" --username admin --password admin local.ini && \
           supervisorctl shutdown && \
           /etc/init.d/postgresql stop && \
           /etc/init.d/redis-server stop && \
           /etc/init.d/ssh stop
EXPOSE 80
CMD     /etc/init.d/ssh start && \
        /etc/init.d/redis-server start && \
        /etc/init.d/memcached start && \
        /etc/init.d/postgresql start && \
        /etc/init.d/nginx start && \
        . venv/bin/activate && \
        supervisord && \
        supervisorctl start prod: && \
        tail -f /dev/null
