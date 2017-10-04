#!/bin/sh
mail=assembl@bluenove.com
file=/etc/apt/apt.conf.d/50unattended-upgrades
sed -i "s#^//Unattended-Upgrade::Mail \"root\";\$#Unattended-Upgrade::Mail \"$mail\";#" $file
