#FROM    ubuntu:16.04
FROM    debian:jessie

ENV     DEBIAN_FRONTEND noninteractive
ARG	GITREPO=https://github.com/assembl/assembl.git
ARG	GITBRANCH=composite_ini
ARG DOCKER_RC=configs/docker.rc
ARG BUILDING_DOCKER=true

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
           fab -c $DOCKER_RC install_assembl_server_deps && \
           /etc/init.d/ssh stop
RUN     /etc/init.d/ssh start && \
           ssh-keyscan localhost && \
           fab -c $DOCKER_RC build_virtualenv && \
           fab -c $DOCKER_RC app_update_dependencies && \
           fab -c $DOCKER_RC app_compile_nodbupdate && \
           fab -c $DOCKER_RC set_file_permissions && \
           /etc/init.d/ssh stop
EXPOSE 80
CMD     /etc/init.d/ssh start && \
        . venv/bin/activate && \
        fab -c $DOCKER_RC docker_startup && \
        tail -f /dev/null
