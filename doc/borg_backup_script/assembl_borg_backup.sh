#!/bin/sh

#You need to set these two environment variables, for example:
#ASSEMBL_PATH=/home/benoitg/development/assembl
#REPOSITORY=www-data@coeus.ca:/media/backup/assembl_backups.borg

set -x BORG_RELOCATED_REPO_ACCESS_IS_OK=yes
BORG_PASSPHRASE='' borg init --encryption=keyfile $REPOSITORY || true
echo "Do not worry if the above command fails, it is expected to fail except the first time it is run"

cd $ASSEMBL_PATH
#In case the database backup fails
$ASSEMBL_PATH/venv/bin/assembl-db-manage local.ini backup
#Make sure we back up the database dump from the last deployment:
cp --dereference $ASSEMBL_PATH/assembl-backup.pgdump $ASSEMBL_PATH/assembl-backup-real.pgdump
NAME="`hostname`-`basename $ASSEMBL_PATH`-`date --iso-8601='minutes'`"
#set -x
borg create \
    $REPOSITORY::$NAME \
    $ASSEMBL_PATH \
    --exclude $ASSEMBL_PATH/src \
    --exclude $ASSEMBL_PATH/venv \
    --exclude $ASSEMBL_PATH/vendor \
    --exclude $ASSEMBL_PATH/var/run \
    --exclude $ASSEMBL_PATH/var/db \
    --exclude $ASSEMBL_PATH/var/log \
    --exclude $ASSEMBL_PATH/var/sessions \
    --exclude $ASSEMBL_PATH/var/esdata \
    --exclude $ASSEMBL_PATH'/var/elasticsearch*' \
    --exclude $ASSEMBL_PATH/assembl/static/js/bower \
    --exclude $ASSEMBL_PATH'/assembl/static/widget/*/bower_components' \
    --exclude $ASSEMBL_PATH/assembl/static/js/node_modules \
    --exclude $ASSEMBL_PATH/assembl/static2/node_modules \
    --exclude '*.sass-cache' \
    --exclude $ASSEMBL_PATH/assembl_dumps \
    --exclude '*.pyc' \
    --progress \
    --stats
#    --verbose

rm $ASSEMBL_PATH/assembl-backup-real.pgdump
# Use the `prune` subcommand to maintain 7 daily, 4 weekly
# and 6 monthly archives.
borg prune --info --list --stats $REPOSITORY --keep-daily=7 --keep-weekly=4 --keep-monthly=6
