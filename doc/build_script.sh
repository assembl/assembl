#!/bin/bash

# Which directory
TARGETDIR=$HOME/assembl

# GIT stuff
cd $TARGETDIR
git fetch
git checkout $1
git reset --hard origin/$1
git pull

# Remove stuff
rm -rf assembl/wheelhouse
rm -rf assembl/assembl/wheelhouse
rm -rf build
rm -rf dist

# go into python
source venv/bin/activate

# React front end
cd $TARGETDIR/assembl/static2/
rm -rf build
rm -rf node_modules
yarn
yarn build

# Translations
cd $TARGETDIR
inv build.compile-messages

# Process to create the deployment wheel
inv build.create-wheelhouse
inv build.create-wheel

# Push built themes and wheel (and dependencies) to S3
inv build.push-wheelhouse

# Post to slack
curl -d '{"text":"New wheel for '"$1"' built", "icon_emoji":":ghost:"}' -X POST "https://hooks.slack.com/services/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" -H "Content-Type: application/json"