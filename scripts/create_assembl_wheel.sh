#!/bin/sh
set -e

# compile v1 stylesheets
cd ${CI_PROJECT_DIR}/assembl/static/js
yarn
./node_modules/.bin/gulp sass
./node_modules/.bin/node-sass --source-map -r -o ../widget/card/app/css --source-map ../widget/card/app/css ../widget/card/app/scss
./node_modules/.bin/node-sass --source-map -r -o ../widget/video/app/css --source-map ../widget/video/app/css ../widget/video/app/scss
./node_modules/.bin/node-sass --source-map -r -o ../widget/session/css --source-map ../widget/session/css ../widget/session/scss

# compile v1 javascript
./node_modules/.bin/gulp libs
./node_modules/.bin/gulp browserify:prod
./node_modules/.bin/gulp build:test

# compile v2 javascript
cd ${CI_PROJECT_DIR}/assembl/static2
PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true yarn
yarn run build
rm -rf node_modules

# compile messages
cd ${CI_PROJECT_DIR}
python setup.py compile_catalog
python assembl/scripts/po2json.py

rm -rf ${CI_PROJECT_DIR}/assembl/static/js/node_modules

# create the wheel and upload to pypi
cd ${CI_PROJECT_DIR}/
rm -rf dist build assembl.egg-info
python setup.py bdist_wheel
