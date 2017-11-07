#!/bin/sh
set -e
apt-get install unattended-upgrades

mail=assembl@bluenove.com
file=/etc/apt/apt.conf.d/50unattended-upgrades
sed -i "s#^//Unattended-Upgrade::Mail \"root\";\$#Unattended-Upgrade::Mail \"$mail\";#" $file

echo 'APT::Periodic::Update-Package-Lists "1";' > /etc/apt/apt.conf.d/20auto-upgrades
echo 'APT::Periodic::Unattended-Upgrade "1";' >> /etc/apt/apt.conf.d/20auto-upgrades
