#!/bin/sh
set -e

apt-get update -qq
# we need to remove cmdtest package as it provides a yarn binary
apt-get remove -yqq cmdtest
curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | apt-key add -
echo "deb https://dl.yarnpkg.com/debian/ stable main" | tee /etc/apt/sources.list.d/yarn.list
wget -qO- https://deb.nodesource.com/setup_8.x | bash -
apt-get install -yqq nodejs yarn
