#!/bin/sh

#You need to set these two environment variables, for example:
#ASSEMBL_PATH=/home/benoitg/development/assembl
#REPOSITORY=www-data@coeus.ca:/media/backup/assembl_backups.borg

BORG_PASSPHRASE='' borg init --encryption=keyfile $REPOSITORY || true
echo "Do not worry if the above command fails, it is expected to fail except the first time it is run"

cd $ASSEMBL_PATH
#In case the virtuoso file backup fails
fab env_dev database_dump
#Make sure we back up the database dump from the last deployment:
cp --dereference $ASSEMBL_PATH/assembl-virtuoso-backup.bp $ASSEMBL_PATH/assembl-virtuoso-backup-real.bp
NAME="`hostname`-`basename $ASSEMBL_PATH`-`date --iso-8601='minutes'`"
set -x
borg create                             \
    $REPOSITORY::$NAME      \
    $ASSEMBL_PATH                               \
    --exclude $ASSEMBL_PATH/src                             \
    --exclude $ASSEMBL_PATH/venv                            \
    --exclude $ASSEMBL_PATH/vendor                            \
    --exclude $ASSEMBL_PATH/node_modules                            \
    --exclude $ASSEMBL_PATH/assembl/static/js/bower                            \
    --exclude $ASSEMBL_PATH/assembl/static/*/bower_components \
    --exclude $ASSEMBL_PATH/.git \
    --exclude '*.sass-cache' \
    --exclude $ASSEMBL_PATH/assembl_dumps \
    --exclude '*.pyc' \
    --progress
    --stats
#    --verbose

rm $ASSEMBL_PATH/assembl-virtuoso-backup-real.bp
# Use the `prune` subcommand to maintain 7 daily, 4 weekly
# and 6 monthly archives.
borg prune -v $REPOSITORY --keep-daily=7 --keep-weekly=4 --keep-monthly=6
