#FROM    ubuntu:16.04
FROM    debian:jessie

ENV     DEBIAN_FRONTEND noninteractive
ARG	GITREPO=https://github.com/assembl/assembl.git
ARG	GITBRANCH=composite_ini

RUN     apt-get update && apt-get install -y \
            fabric \
            git \
            openssh-server \
            pandoc \
            sudo \
            net-tools \
            monit \
            uwsgi \
            uwsgi-plugin-python
RUN     ssh-keygen -P '' -f ~/.ssh/id_rsa && \
            cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys
RUN     cd /opt ; set -x ; git clone -b $GITBRANCH $GITREPO
WORKDIR /opt/assembl
RUN     /etc/init.d/ssh start && \
           ssh-keyscan localhost && \
           fab -c configs/docker.rc install_assembl_server_deps && \
           /etc/init.d/ssh stop
RUN     /etc/init.d/ssh start && \
           ssh-keyscan localhost && \
           fab -c configs/docker.rc build_virtualenv && \
           fab -c configs/docker.rc app_update_dependencies && \
           fab -c configs/docker.rc app_compile_nodbupdate && \
           fab -c configs/docker.rc set_file_permissions && \
           /etc/init.d/ssh stop
# RUN     /etc/init.d/ssh start && \
#            ssh-keyscan localhost && \
#            /etc/init.d/postgresql start && \
#            /etc/init.d/redis-server start && \
#            fab -c configs/docker.rc bootstrap_from_checkout && \
#            fab -c configs/docker.rc set_file_permissions && \
#            . venv/bin/activate && \
#            assembl-add-user --email root@localhost --name "Admin" --username admin --password admin local.ini && \
#            supervisorctl shutdown && \
#            /etc/init.d/postgresql stop && \
#            /etc/init.d/redis-server stop && \
#            /etc/init.d/ssh stop
EXPOSE 80
CMD     /etc/init.d/ssh start && \
        . venv/bin/activate && \
        supervisord && \
        supervisorctl start prod: && \
        tail -f /dev/null
