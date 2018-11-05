Setting-up backups for an Assembl server
========================================

Scripts are included to use Borg Backup (en encrypting, deduplicating archiver)

These instructions are for Ubuntu Linux, but Borg is cross-platform

Installing Borg Backup
----------------------

Installing an up to date Borg Backup
(https://borgbackup.github.io/borgbackup/) Ubuntu:

::

    sudo apt-get install python3-pip libacl1-dev liblz4-dev libssl-dev
    sudo pip3 install --upgrade borgbackup

Using
-----

The script is in ``doc/borg_backup_script/assembl_borg_backup.sh``

It assumes:

 - borgbackup is installed on both the assembl server and the backup server
 - The user running the script has access over ssh to the
   backup server with key authentication (no passphrase). Typically, this
   will be the ``www-data`` user.
 - The user running the script has access over ssh to itself 
   with key authentication (no passphrase).
   

The script takes two environment variables:

``ASSEMBL_PATH``: the path to the assembl installation to backup
``REPOSITORY``: the address of the borg backup repository to backup to

Create a script such as:
/home/backups/backup_all_assembl.sh

::
    #!/bin/bash

    export PATH=$PATH:/usr/local/bin
    export ASSEMBL_PATH=/home/www/assembl_discussions_bluenove_com
    export REPOSITORY=www-data@coeus.ca:/media/backup/assembl_backups_bluenove_discussions.borg
    bash ${ASSEMBL_PATH}/doc/borg_backup_script/assembl_borg_backup.sh > $ASSEMBL_PATH/var/log/assembl_backup.log 2>&1


You can then automate with cron. For example:

::

    sudo su - www-data
    crontab -e
    0 3 * * * /bin/bash /home/backups/backup_all_assembl.sh

All backups are encrypted. Make SURE you backup the keys (normally in
``~/.borg/keys/``) somewhere safe, otherwise your backups will be
useless!

To secure the user, use an extemely restricted permission in ~/.ssh/authorized_keys

::

    # Allow an SSH keypair to only run |project_name|, and only have access to /media/backup.
    # This will help to secure an automated remote backup system.
    $ cat ~/.ssh/authorized_keys
    command="borg serve --restrict-to-path /media/backup" ssh-rsa AAAAB3[...]

Restoring
---------

How to backup production servers:
=================================
Our backup process consists of two steps:
1- Our current backup script backs up the production instance in the borg_backups repository located in the project path.

2- Afterwards, this borg repository is copied to an ftp server associated to each production instance.

This FTP server is a free service provided by OVH for each dedicated server and must be manually instanciated via the OVH manager.

TODO: Automate enabling the ftp backup server via OVH APIs.

In order to manually backup a production instance, launch the following::

    fab -c {RC_FILE} execute_backup_borg_repository

In order to set a crontab for a production instance, use this command::

    fab -c {RC_FILE} cron_backup_borg_repository


These two commands use the following pattern:
1. Make sure borg is installed.
2. Put a configuration file on the remote host with the server FTP information.
3. Creates a backup script from template with the appropriate remote host information and puts it on the remote host.
4. For the second host, it sets a cron job to automatically backup the instance daily.


How to list backups on a production server:
===========================================
Use the command::

    fab -c {RC_FILE} list_backups

How to restore a backup on a production instance:
=================================================
Use the command::

    fab -c {RC_FILE} fetch_backup

This command will fetch the backup from the ftp server. If you don't fix the name,
by default it will get the last backup folder. If you want to set the name, it should be given as an argument to the function.

You will have the backup assembl in a newly created `home` folder.

The command `fetch_backup` will also move the backup up assembl to a newly created
folder: assembl_backup.

Run the command `create_backup_rc` in order to get the RC file creating the last configurations for this server. Keep a copy of this RC file on your localhost as well.
The resulting file will be .local.rc. This will be used to restore the backup.

If you want to launch this backup on a new machine, you should just `bootstrap_from_backup` using the backup RC file.

If you want to restore the backup on the server in the newly created `assembl_backup` folder, you have to change _projectpath variable in the RC file to `/home/assembl_user/assembl_backup/assembl/`

If you want this to be your new assembl instance, you have to shut down all supervisor
processes in the usual directory.

If there is a problem with the database restore on the new folder, you might have to do
`service postgresql restart` to shut down all processes if you get the error stating that there are still other processes using the database.

Since you changed the project path you will have to change the paths in the nginx configuration. Then you should restart nginx.
