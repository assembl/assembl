#!/bin/sh
echo '.git/config'
cat .git/config
echo 'known_hosts'
cat ~/.ssh/known_hosts
echo 'remotes'
git remote -v
ssh assembl_user@dev-assembl.bluenove.com ls
ssh-keyscan -H github.com >> ~/.ssh/known_hosts
git fetch github
git checkout -b bumpversion
bumpversion minor
git checkout -B ${MASTER_BRANCH} bumpversion
git branch -d bumpversion
git pull --rebase github ${MASTER_BRANCH}
git push github ${MASTER_BRANCH}
git checkout -B ${DEVELOP_BRANCH} --track github/${DEVELOP_BRANCH}
git merge ${MASTER_BRANCH} --no-edit -m "Merge new version"
git push github ${DEVELOP_BRANCH}
