#!/bin/sh
set -e

cd ${CI_PROJECT_DIR}/
git fetch github
git checkout -b bumpversion
bumpversion minor
git checkout -B $MASTER_BRANCH bumpversion
git branch -d bumpversion
git pull --rebase github $MASTER_BRANCH
git push github $MASTER_BRANCH
git checkout -B $DEVELOP_BRANCH --track github/$DEVELOP_BRANCH
git merge $MASTER_BRANCH --no-edit -m "Merge new version"
git push github $DEVELOP_BRANCH
