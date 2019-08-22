#!/bin/bash

# Which directory
PROJECTDIR=$HOME/assembl

# GIT stuff
cd $PROJECTDIR
git fetch
git checkout $1
git reset --hard origin/$1
git pull

# Remove stuff
rm -rf wheelhouse
rm -rf build
rm -rf dist

# go into python
source venv/bin/activate

# React front end
cd $PROJECTDIR/assembl/static2/
rm -rf build
rm -rf node_modules
yarn
yarn build

# Translations
cd $PROJECTDIR
inv build.compile-messages

# Process to create the deployment wheel
inv build.create-wheelhouse
inv build.create-wheel

# Push built themes and wheel (and dependencies) to S3
inv build.push-wheelhouse

# Post to slack
curl -d '{"text":"New wheel for '"$1"' built", "icon_emoji":":ghost:"}' -X POST "https://hooks.slack.com/services/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" -H "Content-Type: application/json"