Database conversion procedure

If you have an existing assembl discussion that was defined using virtuoso, you should now shift to postgresql.
The procedure is as follows:

0. Update your assembl on the virtuoso branch, and run: python setup.py develop
1. Make sure that both postgresql and virtuoso are running. (postgresql is assumed to be controlled by the system, virtuoso by supervisor.) Stop other assembl processes (use supervisorctl status to see which ones are running and then run supervisorctl stop process_name for all the processes one by one except virtuoso).
2. Make sure that your local.ini uses virtuoso. (this means sqlalchemy.url value starts with virtuoso://) (If you were using development.ini or production.ini directly, take a slightly older version from git.)
3. cp local.ini local_virtuoso.ini; cp local.ini local_pg.ini
4. In the local_pg.ini file, change the following parameters:
    1. db_schema = public
    2. db_database should be set to the former value of db_schema
    3. set both instances of sqlalchemy.url (in app:assembl and alembic sections) to the following pattern: postgresql+psycopg2://{db_user}:{db_password}@localhost/{db_database}
    (Make appropriate substitutions! So typically postgresql+psycopg2://assembl:assembl@localhost/assembl )
    4. autostart_virtuoso = false
5. cp local_pg.ini local.ini
6. fab -c assembl/configs/develop.rc check_and_create_database_user
	This may need your root password, as well as the password of user postgres in the postgresql database
7. fab -c assembl/configs/develop.rc database_create
8. assembl-db-manage local_pg.ini bootstrap
9. cp local_virtuoso.ini local.ini
10. python ./assembl/scripts/clone_database.py ./local_virtuoso.ini ./local_pg.ini
11. cp local_pg.ini local.ini
12. assembl-ini-files local.ini
13. fab -c assembl/configs/develop.rc supervisor_restart
14. If all is well, you should be able to get back on the master (or develop) branch and update virtuoso.
