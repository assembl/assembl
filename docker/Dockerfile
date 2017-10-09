#FROM    ubuntu:16.04
FROM    debian:jessie

ENV     DEBIAN_FRONTEND noninteractive
ARG	GITREPO=assembl/assembl
ARG	GITBRANCH=master
ARG DOCKER_RC=configs/docker.rc
ARG BUILDING_DOCKER=true

RUN     apt-get update && apt-get install -y \
            fabric \
            git \
            openssh-server \
            sudo \
            net-tools \
            monit \
            uwsgi \
            lsb-release \
            curl \
            cron \
            uwsgi-plugin-python
RUN         useradd -m -U -G www-data assembl_user && \
            ssh-keygen -P '' -f ~/.ssh/id_rsa && cat ~/.ssh/id_rsa.pub >> ~/.ssh/authorized_keys && \
            sudo -u assembl_user -i sh -c "cd && mkdir .ssh && ssh-keygen -P '' -f .ssh/id_rsa && cat .ssh/id_rsa.pub >> .ssh/authorized_keys" && \
            cat ~/.ssh/id_rsa.pub >> ~assembl_user/.ssh/authorized_keys
WORKDIR /opt
RUN     /etc/init.d/ssh start && \
           ssh-keyscan localhost && \
           curl -o fabfile.py https://raw.githubusercontent.com/$GITREPO/$GITBRANCH/fabfile.py && \
           touch empty.rc && \
           fab -c empty.rc install_assembl_server_deps && \
           rm fabfile.py empty.rc && \
           /etc/init.d/ssh stop
RUN     cd /opt ; set -x ; git clone -b $GITBRANCH https://github.com/$GITREPO.git
WORKDIR /opt/assembl
RUN     /etc/init.d/ssh start && \
           ssh-keyscan localhost && \
           chown -R assembl_user:assembl_user . && \
           fab -c $DOCKER_RC build_virtualenv && \
           chown assembl_user:assembl_user fabfile.pyc && \
           fab -c $DOCKER_RC app_update_dependencies && \
           fab -c $DOCKER_RC app_compile_nodbupdate && \
           fab -c $DOCKER_RC set_file_permissions && \
           /etc/init.d/ssh stop
CMD     /etc/init.d/ssh start && \
        . venv/bin/activate && \
        fab -c $DOCKER_RC docker_startup && \
        tail -f /dev/null
