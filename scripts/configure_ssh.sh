#!/bin/sh
set -e
eval "$(ssh-agent -s)"
mkdir -p ~/.ssh
chmod -R 700 ~/.ssh
echo "$SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null

echo "$VAULT_SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null
echo $VAULT_SSH_PRIVATE_KEY > ~/.ssh/vaultmaster.pem

echo "$ASSEMBL_USER_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null
echo $ASSEMBL_USER_PRIVATE_KEY > ~/.ssh/assembl_user.pem

echo "$WEBMASTER_USER_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null
echo $WEBMASTER_USER_PRIVATE_KEY > ~/.ssh/webmaster_user.pem

echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config
echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
chmod 700 ~/.ssh/vaultmaster.pem
chmod 700 ~/.ssh/assembl_user.pem
chmod 700 ~/.ssh/webmaster_user.pem
chmod 644 ~/.ssh/known_hosts
ssh-keyscan -H 'dev-assembl.bluenove.com' >> ~/.ssh/known_hosts