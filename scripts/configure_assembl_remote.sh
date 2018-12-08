#!/bin/sh
set -e

git config --global user.email "assembl.admin@bluenove.com"
git config --global user.name "Bluenove Bot"
git remote add github git@github.com:assembl/assembl.git
