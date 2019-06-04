#!/bin/sh
set -e
eval "$(ssh-agent -s)"
mkdir -p ~/.ssh
chmod -R 700 ~/.ssh
echo "Adding Bluenove Bot's private key in order to access GitHub"
echo "$GITHUB_SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null

if [ -n "$DEPLOYING" ]; then
  print "Adding vaultmaster private keys"
  echo "$VAULT_SSH_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null
  echo $VAULT_SSH_PRIVATE_KEY > ~/.ssh/vaultmaster.pem
  
  print "Adding the assembl_user private keys"
  echo "$ASSEMBL_USER_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null
  echo $ASSEMBL_USER_PRIVATE_KEY > ~/.ssh/assembl_user.pem

  print "Adding the webmaster's private keys"
  echo "$WEBMASTER_USER_PRIVATE_KEY" | tr -d '\r' | ssh-add - > /dev/null
  echo $WEBMASTER_USER_PRIVATE_KEY > ~/.ssh/webmaster_user.pem

  echo -e "Host *\n\tStrictHostKeyChecking no\n\n" > ~/.ssh/config
  # echo "$SSH_KNOWN_HOSTS" > ~/.ssh/known_hosts
  chmod 700 ~/.ssh/vaultmaster.pem
  chmod 700 ~/.ssh/assembl_user.pem
  chmod 700 ~/.ssh/webmaster_user.pem
  chmod 644 ~/.ssh/known_hosts
  ssh-keyscan -H 'dev-assembl.bluenove.com' >> ~/.ssh/known_hosts
fi

