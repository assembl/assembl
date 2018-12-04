Bigdatext setup and installation
========================

Install docker
--------------

.. code:: sh

    apt-get install docker
    apt-get install docker-compose


Setup bigdatext
--------------------

.. code:: sh

    fab -c {RC_FILE} install_bluenove_actionable

An error may have happened at Step 15/20 with a `no such file or directory`

You need to copy ``/home/bigdatext/bluenove_actionable_model.pkl`` from ``root@dev-assembl.bluenove.com`` to ``/home/assembl_user/bluenove-actionable/resources`` on your server

.. code:: sh

    scp root@dev-assembl.bluenove.com:/home/bigdatext/bluenove_actionable_model.pkl user@host:/home/assembl_user/bluenove-actionable/resources

You may need some access right to dev-assembl server

ssh in your server as assembl_user

.. code:: sh

    cd ~/bluenove-actionable

On line 32 in ``Dockerfile``, replace 

.. code:: sh

    COPY /home/bigdatext/bluenove_actionable_model.pkl /root/bluenove-actionable/resources
    
by:

.. code:: sh

    COPY resources/bluenove_actionable_model.pkl /root/bluenove-actionable/resources

Then run:

.. code:: sh

    docker-compose build

Start bigdatext
--------------------

From your computer, run:

.. code:: sh

    fab -c {RC_FILE} start_bluenove_actionable

From ssh in your server run:

.. code:: sh

    docker logs -f bluenoveact

if there is no error, run: 

.. code:: sh

    docker container ls

`bluenoveact` should be up