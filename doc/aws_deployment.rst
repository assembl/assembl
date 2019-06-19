Pre-CI/CD process of deployment
===============================

Preface
-------

There is a machine developed in the Sandbox account that is temporarily dedicated to being the "hand-built" assembl solution. Note that when CI/CD is activated, this machine will be removed. In order to get started, first make yours commits in the repository on your local machine. The build machine's default branch is `invoke`, however, this can be changed to whatever you wish. Below are the processes to build:


Entering the Build Machine
--------------------------

The build machine is hosted within the Sandbox VPC (virtual private cloud). This VPC, unlike other clients' VPCs, are NOT peered with the SharedService VPC. As a result, the standard approach of `ssh`'ing into SharedService bastion (`<your-account>@bastion.cloud.bluenove.com`) will not work. There is, however, another Bastion that you can connect to in the Sandbox account.

.. code-block:: sh
	# Sandbox bastion, for example
	ssh aryan.yazdani@bastion-sandbox.cloud.bluenove.com
	# Build machine
	ssh ubuntu@<build-machine-ip>

In order to get the IP addresses above, please consult with the AWS EC2 instances console. The build machine's name is currently `Build Machine`. Currently, the IP address is `10.0.16.56`. Please consult with the console, as this private IP address can change at any time.

Build
-----

The build machine is similar to an assembl box, with the difference of having the correct IAM roles to communicate with several S3 buckets as well as having the git repository of the code.

.. code-block:: sh
	sudo su - assembl_user
	cd assembl
	# If you rebased invoke recently
	git fetch; git reset --hard origin/develop
	# If it was just regular series of commits
	git pull  # Default is invoke
	rm -rf wheelhouse
	rm -rf build
	rm -rf dist # if exists
	source venv/bin/activate

	# Get the latest theme
	cd assembl/static2/css/themes/vendor/assembl2-client-themes
	git pull	
	cd ../../../..

	# Build the static assets (JS/CSS + Themes)
	cd assembl/static2/
	rm -rf build
	npm run build  # Alternatively: yarn build
	cd ../..

	# Build the static translations (used by backend only)
	inv build.compile-messages

	# Process to create the deployment wheel
	inv build.create-wheelhouse
	inv build.create-wheel
	
	# Push built themes and wheel (and dependencies) to S3
	inv build.push-wheelhouse
	inv build.push-built-themes-to-remote-bucket


If the fonts were updated since the last deployment, please upload the latest fonts to the SharedService `s3://bluenove-assembl-fonts` bucket. Note: Ensure that when you're uploading, the font files ACL rule is `public-read`. Default uploading from the console is private.


S3 Contents
-----------

The relevant S3 buckets for the project are noted below. They are hosted in the SharedService account.

	* The assembl wheel and its dependencies are hosted
		* `bluenove-assembl-wheelhouse`
	* The client themes, including the default theme are hosted
		* `bluenove-client-themes`
	* As client themes are loaded from S3, the fonts should also be loaded from S3 as well. They are hosted
		* `bluenove-assembl-fonts`
	* The current CodeDeploy configuration to install assembl with the latest wheel is hosted
		* `bluenove-assembl-deployments`
	* The default configurations for integration testing and a base yaml file for each production machine is hosted
		* `bluenove-assembl-configurations`
	* Terraform, our Infrastructure-as-Code (IaC) language relies on maintaining the total states (all configs across all of AWS) in `tfstate` files. These are hosted
		* `bluenove-tfstates`
		* Never touch this folder by hand. It is automatically updated by Terraform via the console


Deployment By Hand
==================

It is usually frowned upon to deploy by hand. However, at times, it is necessary. For example, when CICD is not yet enabled. Here is how a manual operation can be done, and trade-offs. Firstly, it is important to recognize some basics of Amazon Web Services surrounding our `assembl` instances. Our boxes are sitting behind an Elastic Load Balancer (ELB). Our `assembl` instances are installed on EC2 boxes, configured with an Auto-Scaling Group (ASG) behind the ELB. 

.. code-block:: sh
	ssh <your-account>@bastion.cloud.bluenove.com
	ssh ubuntu@<client>
	sudo su - assembl_user
	cd assembl
	source venv/bin/activate


Now there are two steps. If you'd just like to update the assembl version completely manually, or semi-manually. It depends on the need. Fully manually, is to only update the wheel. No configuration change and no server restart. Semi-manually will reupdate the wheel, the configurations, and restart the servers.

Fully Manual
++++++++++++

.. code-block:: sh
	inv deploy.install-wheel
	
	# if you made LOCAL updates on the account_data.yaml, ensure to save
	# your changes to S3
	
	# get latest config from s3
	inv deploy.get-aws-invoke-yaml
	
	# update configs
	inv deploy.create-local-ini
	inv deploy.generate-nginx-conf

	# restart server yourself
	supervisorctl restart prod:

	# as sudoer user
	sudo /etc/init.d/nginx restart


Semi-Manual
+++++++++++

.. code-block:: sh
	inv deploy.aws-instance-update-and-startup


Configuration-Only
++++++++++++++++++

.. code-block:: sh
	inv deploy.aws-instance-config-update-and-restart

