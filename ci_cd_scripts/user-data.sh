#!/bin/bash
set -x

sudo apt-get -y update

sudo apt-get -y install fabric git openssh-server
sudo apt-get -y install nginx uwsgi uwsgi-plugin-python
sudo addgroup assembl_group
sudo useradd --create-home --password password --shell /bin/bash assembl_user
echo -e "password\npassword\n" | sudo passwd assembl_user
sudo usermod -G www-data -G assembl_group assembl_user
sudo useradd --create-home --password password --shell /bin/bash assembl_sudo_user
echo -e "password\npassword\n" | sudo passwd assembl_sudo_user
sudo usermod -aG sudo assembl_sudo_user

su - assembl_sudo_user -c 'echo "\n\n" | ssh-keygen -n 2048 -t rsa -C "assembl_sudo_user@$(hostname -I)" -f /home/assembl_sudo_user/.ssh/id_rsa -q'
su - assembl_sudo_user -c 'cat .ssh/id_rsa.pub >> .ssh/authorized_keys'
su - assembl_sudo_user -c 'eval `ssh-agent -s` && ssh-add'

su - assembl_user -c 'echo "\n\n" | ssh-keygen -n 2048 -t rsa -C "assembl_user@$(hostname -I)" -f /home/assembl_user/.ssh/id_rsa -q'
su - assembl_user -c 'cat .ssh/id_rsa.pub >> .ssh/authorized_keys'
su - assembl_user -c 'eval `ssh-agent -s` && ssh-add'

cp /home/assembl_sudo_user/.ssh/id_rsa /home/assembl_user/.ssh/id_rsa_assembl_sudo_user.pem
chown assembl_user:assembl_user /home/assembl_user/.ssh/id_rsa_assembl_sudo_user.pem
su - assembl_user -c 'ssh-add .ssh/id_rsa_assembl_sudo_user.pem'

su - assembl_user -c "git clone https://github.com/assembl/assembl.git"
echo "_venvpath = /home/assembl_user/assembl/venv" >> /home/assembl_user/assembl/assembl/configs/develop.rc
echo "_sudoer = assembl_sudo_user" >> /home/assembl_user/assembl/assembl/configs/develop.rc
echo "_sudo_password = password" >> /home/assembl_user/assembl/assembl/configs/develop.rc

su - assembl_sudo_user -c "cd /home/assembl_user/assembl && echo " \t " | fab -f assembl/fabfile.py -c assembl/configs/develop.rc install_single_server -p password"
chown -R assembl_user:assembl_user /home/assembl_user/assembl/var/elasticsearch
# su - assembl_user -c "cd /home/assembl_user/assembl && fab -f assembl/fabfile.py -c assembl/configs/develop.rc check_and_create_database_user -p password"

