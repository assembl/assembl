Assembl Configuration files
===========================

Rationale and history
---------------------

Assembl is composed of many components, most of which rely on ``.ini`` files. But setting up those components is done using Fabric, which natively relies on ``.rc`` files, which are a simplified ``.ini`` format with a single section and no multiline values. This system is used both for generic setup information, and to set instance-specific variables, so we want to use information layers, so we can change a common variable globally, in the most generic layers, and set specific variables in specific layers.

Because fabric is the root process, we decided that all information would be set in ``.rc`` files, and the ``local.ini`` file would be generated from those files; but we added a layering mechanism to ``.rc`` files, so each file could be said to ``_extend`` another ``.rc`` file. But because the ``.rc`` file format is so simplistic, we also layer ``.ini`` files, in a stack that can be specified in the ``.rc`` files.

Earlier, the fabfile.py would itself contain instance-specific information (as environments) and read some more instance-specific information from the ``local.ini`` file itself. This meant there were multiple sources of truth, and consistency of ``local.ini`` files had to be maintained by hand, with uneven results. Migrating from hand-maintained local.ini files to generated local.ini files will be explained further.

The enriched .rc file format
----------------------------

``.rc`` file, in the ``configs`` directory, are a series of ``key=value`` pairs, with some keys having special meaning for fabric. The ``_extends`` key, if present, gives the relative path of another ``.rc`` file, whose values will be injected in the fabfile's ``env``, unless overridden by the current ``.rc`` file; this is done in :py:func:`fabfile.combine_rc`, called through the ``@task`` decorator. The keys are further filtered so ``*`` and ``_`` prefixes are eliminated from keys, and so are values of ``__delete_key__``. So, for example, if we have the following two files:

code:: ini
    configs/instance.rc:
    _extends = base_env.rc
    _user = assembl
    *db_user = assembl_user
    hosts = myinstance.example.com
    *db_password = __delete_key__
    _projectpath = /home/assembl_user/assembl

    configs/base_env.rc:
    ini_file = local.ini
    ini_files = production.ini RANDOM RC_DATA
    hosts = localhost
    *db_user = assembl
    *db_password = assembl
    supervisor__autostart_changes_router = true

And fabric is called with ``fab -c configs/instance.rc``, then its ``env`` would contain the following:

code:: py
    {
      "user": "assembl",
      "db_user": "assembl_user",
      "hosts": "myinstance.example.com",
      "projectpath": "/home/assembl_user/assembl",
      "ini_file": "local.ini",
      "ini_files": "production.ini RANDOM RC_DATA",
      "supervisor__autostart_changes_router": "true",
    }

The same dictionary composition method is used to compose the ``local.ini`` file, in :py:func:`assembl.scripts.ini_files.compose`. The basis is the ``ini_files`` variable: each ``.ini`` file mentioned (path relative to project root) is combined in turn, with values overriding the previous one in the sequence, and the resulting combination file is written out to ``local.ini`` in the ``create_local_ini`` fab task. There are two magic values that can be used in the ``ini_files`` list: ``RANDOM`` and ``RC_DATA``. Those are mostly useful when creating the ``local.ini`` file used by pyramid.

``RC_DATA`` corresponds to the data from the `.rc` files itself. Most of key-value pairs will be in the ``app:assembl`` section by default. A key-value pair can be assigned to any section if the key follows the ``section_name__key_name`` format. If the key was preceded by a ``_``, it is not injected in the ``.ini`` file at all (this is for fabric-only values). Similarly, if the value is ``__delete_key__``, it is not injected in the ``.ini`` file. (This can allow to mask a value from an inherited ``.rc`` file, and use the value from the ``.ini`` file that precedes the ``RC_DATA`` step in the ``ini_files`` chain.) If the key was preceded by a ``*``, it goes in the ``DEFAULT`` section, and its value is available in all sections. This is useful for cross-section variable interpolation, as described in :py:mod:`ConfigParser`.

``RANDOM`` will use data from the ``random.ini`` file, but will first ensure that it is populated with random values generated with the ``assembl-ini-files random ...rc`` subcommand. That subcommand will generate the ``random.ini`` file from ``random.ini.tmpl`` if it does not exist. If a value is already set, it is preserved, but missing (new) values will still be added. The codes for random generation are the following: ``{random66}``, for example, will create a random string of length (4/3)66 (rounded up). ``{saml_key}`` will create a X509 key (without its armour) and ``{saml_crt}`` will create a self-signed certificate using data from ``saml_...`` keys and the ``public_hostname``. Those have to be set in keys following the ``XXX_PRIVATE_KEY`` and ``XXX_PUBLIC_CERT`` pattern respectively.


specific .rc file keys
~~~~~~~~~~~~~~~~~~~~~~

Many keys are defined and documented in the ``production.ini`` file, we focus here on keys that fabric expects to find.

_hosts:
    The host name(s) to which this ``.rc`` file applies.

public_hostname:
    The host name of the assembl server, as it will be exposed. Will often correspond to ``hosts`` after setup, but maybe not initially.

_user:
    The user that will be used to run remote fab commands (current user if undefined.)

ini_files:
    The sequence of .ini files used for ``local.ini`` construction, as described above.

_projectpath:
    The directory path to the assembl installation

_venvpath:
    The directory path to the python virtualenv used by the assembl installation, usually ``<projectpath>/venv``

_dbdumps_dir:
    The directory path to the database backup directory, usually ``<projectpath>/assembl_dumps``

_ini_file:
    The name of the ``local.ini`` file used by pyramid.

saml_country:
    The country of your organization, exposed in the saml key.

saml_state:
    The state of your organization, exposed in the saml key.

saml_locality:
    The locality of your organization, exposed in the saml key.

saml_org:
    The name of your organization, exposed in the saml key.

saml_email:
    The contact email of your organization, exposed in the saml key.

piwik_host:
    The host of your piwik installation, if any.

*db_host:
    The host of your postgres database

*db_database:
    The postgres database used

*db_user:
    The postgres user for connection to the database

*db_password:
    The password of that postgres user

*sentry_host:
    The host of your Sentry installation, if any.

theme_repositories__git-urls:
    TODO

uwsgi__uid:
    TODO

login_providers:
    TODO

_gitbranch:
    TODO

_is_production_env:
    TODO

_postgres_db_user:
    TODO

_sentry_db_host:
    TODO

_uses_apache:
    TODO

_uses_ngnix:
    TODO

_uses_memcache:
    TODO

_uses_ngnix:
    TODO

_wsginame:
    TODO

*sentry_id:
    TODO

*sentry_key:
    TODO

*sentry_secret:
    TODO

*sentry_host:
    TODO

*sentry_scheme:
    TODO


(to be continued)

Migrating to the new configuration system
-----------------------------------------

If you have a hand-written ``local.ini`` on a server, and you want to make sure that you do not lose information when generating a new one, here is how to proceed:

1. If the local.ini file is on a remote server, create a skeleton ``configs/myinstance.rc`` file with at least the following information:

code:: ini
    _extends = base_env.rc
    _user = assembl
    hosts = myinstance.example.com
    public_hostname = myinstance.example.com

Note that you can extend another ``.rc`` file, with more specific information, such as company information in _saml keys.

If upgrading a local development environment, you would probably name your file ``configs/local.rc`` instead of ``configs/myinstance.rc``, and start with a one-line seed file:

code:: ini
    _extends = develop.rc

(Do not set hosts or _user.)

2. run ``fab -c configs/myinstance.rc migrate_local_ini`` locally. (Or ``develop.rc`` appropriately.)

This will create a remote ``random.ini`` file with information pulled from the remote ``local.ini`` file, and create a ``configs/myinstance.rc.NNNNNNN`` file (where NNNNNN is a timestamp), containing any value that diverges between your current remote ``local.ini`` file and the one that would be automatically generated using the specifications in ``configs/myinstance.rc``. There will be warnings about multi-line values; they will be made single-line in the generated ``.rc`` file, but that is not always appropriate. In some cases, it is worth creating a new ``.ini`` file for those multi-line values, and add them in the stack in a local ``ini_files`` value in your ``.rc`` file.

3. Some of the lines in the resulting ``.rc.NNNNNNN`` file will reflect historical artefacts in the construction of your ``local.ini`` file; exercice judgement, migrate key-value pairs to your ``myinstance.rc`` file and repeat the migration step until the contents of the migration-generated file are insignificant.

Also, many lines will differ that are built with interpolation; for example, ``production.ini`` contains the following line:

code:: ini
    sqlalchemy.url = postgresql+psycopg2://%(db_user)s:%(db_password)s@%(db_host)s/%(db_database)s?sslmode=disable

Ideally, you would set the values of ``*db_user``, ``*db_password``, ``*db_host``, ``*db_database`` in your ``myinstance.rc`` file until the ``sqlalchemy.url`` key disappears from migration, without overriding the ``sqlalchemy.url`` key itself. A similar process applies to ``sentry_...`` variables.

