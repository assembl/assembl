Updating the preprod Server
===========================

This method is a temporary method in order to quickly update the preprod server with the latest version of the code.

Preprod server has an assembl instance running on different containers. The whole instance is run via a .yml file run with docker-compose


Note: To get the identity of the container running the image assembl:develop run ``docker ps | grep assembl``

Local machine::

	git checkout master
	git pull
	git checkout preprod
	git rebase master
	git push --force


On the preprod instance:

Connect to the preprod server with ``ssh admin@preprod-assembl.bluenove.com``

Go to the assembl new folder to get on preprod branch::
	cd assembl_new

Connect to the docker container using::
	docker exec -it 6f41608ee826 /bin/bash

On the container::

	git fetch
	git reset -- hard origin/preprod
	git pull


If there are failing app_compile due to permission issues::

	fab -c /var/docker_data/assembl1.rc set_file_permissions 

This command should be done for the whole folder. This should take a long time.

This can also be done manually for only the folders that are naughty, like::

	sudo chown -R assembl_user:assembl_user .git

You can now do your app_compile::

	fab -c /var/docker_data/assembl1.rc app_compile


This brings the entire dependency up to latest.
However, for ngnix, you have to copy/paste the static folders to a volumne that can be shared with other containers.

Nginx container::

	cd /opt/assembl_static
	./update.sh
	rm -rf static_backup
	exit

You are now outside the container and on the preprod server again.

Connect to the nginx container.

On the nginx container::

	cd conf.d
	nginx -s reload

If you want to debug your nginx configuration::
	nginx -t