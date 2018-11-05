#!/bin/sh
set -e

cd ${CI_PROJECT_DIR}/
git fetch github
git checkout -b bumpversion
bumpversion minor
git checkout -b $MASTER_BRANCH github/$MASTER_BRANCH
git merge --no-ff bumpversion $MASTER_BRANCH
git branch -d bumpversion
git push github $MASTER_BRANCH
git checkout -b github_$DEVELOP_BRANCH github/$DEVELOP_BRANCH
git merge $MASTER_BRANCH --no-edit -m "Merge new version"
git push github $DEVELOP_BRANCH
