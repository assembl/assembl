#!/bin/bash
set -x

sudo apt-get -y update

sudo apt-get -y install fabric git openssh-server
sudo apt-get -y install nginx uwsgi uwsgi-plugin-python
sudo addgroup assembl_group
sudo useradd --create-home --password password --shell /bin/bash assembl_user
sudo usermod -G www-data -G assembl_group assembl_user
sudo useradd --create-home --password password --shell /bin/bash assembl_sudo_user
sudo usermod -aG sudo assembl_sudo_user

su - assembl_sudo_user -c 'echo "\n\n" | ssh-keygen -n 2048 -t rsa -C "assembl_sudo_user@$(hostname -I)" -f /home/assembl_sudo_user/.ssh/id_rsa -q'
su - assembl_sudo_user -c 'cat .ssh/id_rsa.pub >> .ssh/authorized_keys'
su - assembl_sudo_user -c 'eval `ssh-agent -s` aa ssh-add'

su - assembl_user -c "git clone https://github.com/assembl/assembl.git"

su - assembl_sudo_user -c "cd /home/assembl_user/assembl && fab -f assembl/fabfile.py -c assembl/configs/develop.rc install_single_server -p password"