Building a docker image
=======================

First the image itself:

.. code:: sh

    docker build --tag assembl docker

Then, create a ``my_docker.rc`` with the following content:

.. code:: ini

    _extends = docker.rc
    docker_assembl_hosts = <public hostnames of your assembl processes>

Look at ``assembl/configs/docker.rc`` for other variables to override, notably mail servers. Decide whether you want to use an in-docker sentry or an external sentry server.

.. code:: sh

    docker build --tag assembl docker
    assembl-ini-files random -o docker_random.ini assembl/configs/docker.rc
    fab -c assembl/configs/docker.rc docker_compose
    docker-compose -f docker/build/docker-compose-stage1.yml up

Go to ``localhost:9000`` to create a token for the admin user (username in ``assembl/configs/docker.rc``, generated password in ``docker_random.ini``). Make sure that token can administer projects (and organizations?). Add ``sentry_api_token = (the token)`` to your ``my_docker.rc``.

Then stop the docker containers (``Ctrl-C`` in the docker-compose window, or ``docker-compose -f docker/build/docker-compose-stage1.yml down``), then:

.. code:: sh

    fab -c assembl/configs/my_docker.rc docker_compose
    docker-compose -f docker/build/docker-compose.yml up

Your admin user for each assembl server will be ``admin@hostname``. Use the password recovery process to set its initial password. (If you want to pshell instead, you can do it from ``docker exec -i -t build_assembl1_1 bash``.)

When developing the docker image, the build can be instructed to use
a git repository different from the official develop branch with:

::

    sudo docker build --build-arg GITREPO=https://github.com/dachary/assembl.git --build-arg GITBRANCH=wip-docker --tag assembl --no-cache docker

Signed-off-by: Marc-Antoine Parent <maparent@acm.org>
Signed-off-by: Loic Dachary <loic@dachary.org>
