from __future__ import print_function

import os
import sys
import re
import json
import time
from hashlib import sha256
from os.path import join, normpath
from gzip import GzipFile
from shutil import copyfileobj
from cStringIO import StringIO

from semantic_version import Version

from .common import (
    venv, task, exists, is_integration_env, fill_template, configure_github_user,
    get_s3_file, delete_foreign_tasks, as_bool, supervisor_process_stop, supervisor_process_start)
from .sudoer import (
    install_build_dependencies, install_node_and_yarn, clear_aptitude_cache,
    install_chrome_dependencies)


def get_node_base_path(c):
    return normpath(join(
        c.projectpath, 'assembl', 'static', 'js'))


def get_new_node_base_path(c):
    return normpath(join(
        c.projectpath, 'assembl', 'static2'))


def get_node_modules_path(c):
    return normpath(join(
        get_node_base_path(c), 'node_modules'))


def get_new_node_modules_path(c):
    return normpath(join(
        get_new_node_base_path(c), 'node_modules'))


@task()
def install_bower(c):
    with c.cd(get_node_base_path(c)):
        with venv(c):
            c.run('npm install bower po2json requirejs')


@task()
def update_bower(c):
    with c.cd(get_node_base_path(c)):
        with venv(c):
            c.run('npm update bower po2json')


def get_node_bin_path(c):
    return normpath(join(
        get_node_modules_path(c), '.bin'))


def bower_cmd(c, cmd, relative_path='.'):
    with c.cd(c.config.projectpath):
        bower_cmd = normpath(join(get_node_bin_path(c), 'bower'))
        po2json_cmd = normpath(join(get_node_bin_path(c), 'po2json'))
        if not exists(c, bower_cmd) or not exists(c, po2json_cmd):
            print('Bower not present, installing ...')
            install_bower()
        with c.cd(relative_path):
            with venv(c):
                c.run(' '.join(("node", bower_cmd, '--allow-root', cmd)))


def _bower_foreach_do(c, cmd):
    bower_cmd(c, cmd)
    bower_cmd(c, cmd, 'assembl/static/widget/card')
    bower_cmd(c, cmd, 'assembl/static/widget/session')
    bower_cmd(c, cmd, 'assembl/static/widget/video')
    bower_cmd(c, cmd, 'assembl/static/widget/vote')
    bower_cmd(c, cmd, 'assembl/static/widget/creativity')
    bower_cmd(c, cmd, 'assembl/static/widget/share')


def separate_pip_install(c, package, wrapper=None):
    cmd = 'pip install'
    if wrapper:
        cmd = wrapper % (cmd,)
    context_dict = dict(c.config)
    cmd = cmd % context_dict
    cmd = "egrep '^%(package)s' %(projectpath)s/requirements-prod.frozen.txt | sed -e 's/#.*//' | xargs %(cmd)s" % dict(
        cmd=cmd, package=package, **context_dict)
    with venv(c):
        c.run(cmd)


@task()
def update_bower_requirements(c, force_reinstall=False):
    """ Normally not called manually """
    _bower_foreach_do(c, 'prune')
    if force_reinstall:
        _bower_foreach_do(c, 'install --force')
    else:
        _bower_foreach_do(c, 'update')


@task()
def update_node(c, force_reinstall=False):
    """
    Install node and npm to latest version specified. This is done inside of a virtual environment.
    """
    from sudoer import upgrade_yarn
    n_version = c.config._internal.node.version
    npm_version = c.config._internal.node.npm
    node_version_cmd_regex = re.compile(r'v' + n_version.replace('.', r'\.'))
    with venv(c, True):
        node_version_cmd_result = c.run('node --version', echo=True).stdout
    match = node_version_cmd_regex.match(str(node_version_cmd_result))
    if not match or force_reinstall:
        # Stop gulp and webpack because otherwise node may be busy
        # TODO: Implement supervisor_process_stop
        # supervisor_process_stop('dev:gulp')
        # supervisor_process_stop('dev:webpack')
        with venv(c, True):
            c.run("rm -rf venv/lib/node_modules/")
            c.run("rm -f venv/bin/npm")  # remove the symlink first otherwise next command raises OSError: [Errno 17] File exists
            c.run("nodeenv --node=%s --npm=%s --python-virtualenv assembl/static/js" % (n_version, npm_version))
        upgrade_yarn(c)
        with c.cd(get_node_base_path(c)):
            with venv(c):
                c.run("npm install reinstall -g")

        update_npm_requirements(force_reinstall=True)
    else:
        print("Node version OK")


@task()
def update_npm_requirements(c, install=False, development_mode=False, force_reinstall=False):
    """Normally not called manually"""
    dev_command = '--production=false' if development_mode else ''
    with venv(c):
        with c.cd(get_node_base_path(c)):
            if install:
                c.run('yarn --non-interactive %s' % dev_command)
            elif force_reinstall:
                c.run('reinstall')
            else:
                c.run('npm update')

        static2_path = get_new_node_base_path(c)
        with c.cd(static2_path):
            if install or force_reinstall:
                print('Removing node_modules directory...')
                c.run('rm -rf {}'.format(os.path.join(static2_path, 'node_modules')))
            c.run('yarn --non-interactive %s' % dev_command)


@task()
def clone_repository(c, reset=False):
    """
    Clone repository
    """
    print('Cloning Git repository')

    # Remove dir if necessary
    path = c.config.projectpath
    if exists(c, os.path.join(path, ".git")):
        print("%s/.git already exists" % path)
        if reset:
            c.run("rm -rf %s/.git" % path)
        else:
            return

    # Clone
    branch = c.config.get('gitbranch', 'master')
    repo = c.config.get('gitrepo', 'https://github.com/assembl/assembl.git')
    with c.cd(path):
        c.run("git clone --branch {0} {1} {2}".format(
            branch, repo, os.path.join(path, 'assembl')))


@task()
def updatemaincode(c):
    """
    Update code and/or switch branch
    """
    print('Updating Git repository')
    with c.cd(c.config.projectpath):
        c.run('git fetch')
        c.run('git checkout %s' % c.config._internal.gitbranch)
        c.run('git pull %s %s' % (c.config._internal.gitrepo, c.config._internal.gitbranch))


@task()
def update_pip_requirements(c, force_reinstall=False):
    """
    Update external dependencies on remote host.
    """
    with venv(c):
        c.run('pip install -U setuptools "pip<10" ')

    if force_reinstall:
        with venv(c):
            c.run("pip install --ignore-installed -r %s/requirements.txt" % (c.config.projectpath))
    else:
        specials = [
            # setuptools and lxml need to be installed before compiling dm.xmlsec.binding
            ("lxml", None),
            # Thanks to https://github.com/pypa/pip/issues/4453 disable wheel separately.
            ("dm.xmlsec.binding", "%s --install-option='-q'"),
            ("pycurl", None),
            ("psycopg2", "%s --install-option='-q'")
        ]
        for package, wrapper in specials:
            separate_pip_install(c, package, wrapper)
        cmd = "pip install -r %s/requirements.txt" % (c.config.projectpath)
        with venv(c):
            c.run("yes w | %s" % cmd)


@task()
def app_update_dependencies(c, force_reinstall=False):
    """
    Updates all python and javascript dependencies.  Everything that requires a
    network connection to update.
    """
    update_pip_requirements(c, force_reinstall=force_reinstall)
    update_node(c, force_reinstall=force_reinstall)
    update_bower(c)
    update_bower_requirements(c, force_reinstall=force_reinstall)
    update_npm_requirements(c, force_reinstall=force_reinstall)


@task()
def compile_stylesheets(c):
    """
    Generate *.css files from *.scss
    """
    project_path = os.getenv('CI_PROJECT_DIR', c.config.projectpath)
    with venv(c):
        with c.cd(project_path):
            with c.cd('assembl/static/js'):
                c.run('./node_modules/.bin/gulp sass')
            c.run('./assembl/static/js/node_modules/.bin/node-sass --source-map ' +
                  '-r -o assembl/static/widget/card/app/css --source-map assembl/static/widget/card/app/css assembl/static/widget/card/app/scss')
            c.run('./assembl/static/js/node_modules/.bin/node-sass --source-map ' +
                  '-r -o assembl/static/widget/video/app/css --source-map assembl/static/widget/video/app/css assembl/static/widget/video/app/scss')
            c.run('./assembl/static/js/node_modules/.bin/node-sass --source-map ' +
                  '-r -o assembl/static/widget/session/css --source-map assembl/static/widget/session/css assembl/static/widget/session/scss')


@task()
def compile_messages_catalog(c):
    """
    Run compile *.mo file from *.po
    """
    with venv(c, True):
        c.run('python2 setup.py compile_catalog')


@task(compile_messages_catalog)
def compile_messages(c):
    """
    Run compile *.mo file from *.po and v1 po2json
    """
    with venv(c, True):
        c.run("python2 assembl/scripts/po2json.py")


@task()
def compile_javascript(c):
    """
    Generates and minifies javascript
    """
    project_path = os.getenv('CI_PROJECT_DIR', c.config.projectpath)
    with venv(c):
        with c.cd(project_path):
            with c.cd('assembl/static/js'):
                c.run('./node_modules/.bin/gulp libs')
                c.run('./node_modules/.bin/gulp browserify:prod')
            with c.cd('assembl/static2'):
                c.run('yarn run build')


@task(install_chrome_dependencies)
def prepare_integration_tests(c):
    """
    Prepares the environment for running Assembl's integration tests. Fully assumes to be run in CI/CD env
    """
    c.run('git clone https://github.com/bluenove/assembl-tests')
    yarn = c.run('which yarn')
    with c.cd('assembl-tests'):
        c.run('{}'.format(yarn))
        # fetch data required for e2e tests
        get_s3_file('bluenove-assembl-configurations', 'integrationTestConfig.js', 'data.js', c.config.aws_shared_region)


@task()
def compile_static_assets(c):
    """Separated mostly for tests, which need to run alembic manually"""
    compile_stylesheets(c)
    compile_messages(c)
    compile_javascript(c)


def psql_command(c, command, use_db_user=True, database=None):
    if use_db_user:
        database = database or c.config.DEFAULT.db_database
        pypsql = join(c.config.projectpath, 'assembl', 'scripts', 'pypsql.py')
        result = c.run('python2 {pypsql} -1 --autocommit -u {user} -p {password} -n {host} -d {database} "{command}"'.format(
            command=command, pypsql=pypsql, password=c.config.DEFAULT.db_password,
            database=database, host=c.config.DEFAULT.db_host, user=c.config.DEFAULT.db_user
        ), warn=True, echo=False)
    else:
        database = database or 'postgres'
        if c.config._internal.mac:
            result = c.run('psql -t %s -c "%s"' % (database, command), warn=True)
        else:
            result = c.sudo('psql -t %s -c "%s"' % (database, command), user='postgres', warn=True)
    if result.failed:
        return False
    return result.stdout.strip()


@task()
def check_and_create_database_user(c, user=None, password=None):
    """
    Create a user and a DB for the project.
    Mostly used in development or testing.
    """
    user = user or c.config.DEFAULT.db_user
    password = password or c.config.DEFAULT.db_password
    checkUser = psql_command(c, "SELECT 1 FROM pg_roles WHERE rolname='%s'" % (user), False)
    if not checkUser:
        print("User does not exist, let's try to create it. (The error above is not problematic if the next command which is going to be run now will be successful. This next command tries to create the missing Postgres user.)")
        assert psql_command(c, "CREATE USER %s WITH CREATEDB ENCRYPTED PASSWORD '%s'" % (
            user, password), False
        ) is not False, "Could not create user"
        print("Created user")
    else:
        print("User exists and can connect")


def check_if_database_exists(c):
    return psql_command(c, "SELECT 1 FROM pg_database WHERE datname='%s'" % (
        c.config.DEFAULT.db_database), True, 'postgres')


def check_if_db_tables_exist(c):
    with venv(c):
        checkDatabase = c.run('assembl-pypsql -1 -u {user} -p {password} -n {host} -d {database} "{command}"'.format(
            command="SELECT count(*) from permission", database=c.config.db_database,
            password=c.config.db_password, host=c.config.db_host, user=c.config.db_user), warn=True)
        return not checkDatabase.failed and int(checkDatabase.strip('()L,')) > 0


def check_if_first_user_exists(c):
    with venv(c):
        checkDatabase = c.run('assembl-pypsql -1 -u {user} -p {password} -n {host} -d {database} "{command}"'.format(
            command="SELECT count(*) from public.user", database=c.config.db_database,
            password=c.config.db_password, host=c.config.db_host, user=c.config.db_user), warn=True)
        return not checkDatabase.failed and int(checkDatabase.strip('()L,')) > 0


@task(check_and_create_database_user)
def database_create(c):
    """Create the database for this assembl instance"""

    if not check_if_database_exists(c):
        print("Cannot connect to database, trying to create")
        assert psql_command(
            c, "CREATE DATABASE {database} WITH OWNER = {user} TEMPLATE = template0 ENCODING = UNICODE".format(
                user=c.config.DEFAULT.db_user, password=c.config.DEFAULT.db_password,
                host=c.config.DEFAULT.db_host, database=c.config.DEFAULT.db_database), True, 'postgres'
            ) is not False, "Could not create database"
        print("Database created successfully!")
    else:
        print("Database exists and user can connect")


@task()
def create_wheelhouse(c, dependency_links=None):
    project_root = c.config.projectpath
    if not dependency_links:
        dependency_links = c.run('grep "git+http" %(here)s/requirements-dev.frozen.txt > %(here)s/deps.txt' % {
                                 'here': project_root})
        dependency_links = 'deps.txt'
    tmp_wheel_path = os.path.join(project_root, 'wheelhouse')
    cmd = 'pip wheel --wheel-dir=%s --process-dependency-links -r %s' % (tmp_wheel_path, dependency_links)
    try:
        if is_integration_env(c):
            c.run(cmd)
        else:
            with venv(c, True):
                c.run(cmd)
    finally:
        if exists(c, os.path.join(project_root, 'deps.txt')):
            c.run('rm -f %(here)s/deps.txt' % {'here': project_root})


def create_wheel_name(version, num=0, commit_hash=None, branch=None, tag=None):
    """
    Follows the recommended naming scheme of PEP 491 (https://www.python.org/dev/peps/pep-0491/#file-name-convention)
    """
    if not num:
        # CI condition of a tag (which should only ever be put on master)
        long_version = version
    elif branch:
        long_version = '%s.dev%d+%s' % (version, num, branch)
    elif tag:
        long_version = '%s.dev%d+%s' % (version, num, tag.split('-').join('_'))
    else:
        long_version = '%s.dev%d+%s' % (version, num, commit_hash)

    return "assembl-{version}-py{python_major}-none-any.whl".format(
        version=long_version,
        python_major=sys.version_info.major)


def git_version_data(c):
    # Take the latest HEAD
    branch = c.run('git symbolic-ref --short HEAD').stdout.strip()
    latest_tag_desc = c.run('git describe').stdout.strip()
    annotated_tag_desc = c.run('git describe --tags HEAD').stdout.strip()
    parts = re.match(r"([\d\.]+)(-(\d+)-g([0-9a-f]+))?$", annotated_tag_desc)
    # Git flow uses annotated tags based on the branch names for hotfixes, will break this.
    # TODO: Add loop to go back in time to find the other tags
    assert parts, "annotated tag %s is not a version tag" % (annotated_tag_desc.split('-')[0])
    if not parts.group(2):
        version = annotated_tag_desc
        commit_tag = None
        commit_hash = c.run('git rev-parse --short HEAD').stdout.strip()
        num = 0
    else:
        # The commit is not an official tagged version
        (version_tag, _, num, commit_hash) = parts.groups()
        num = int(num)
        version = str(Version(version_tag).next_patch())
        if not re.match(r".+-\d+-g[0-9a-f]+$", latest_tag_desc):
            commit_tag = latest_tag_desc.rsplit('-', 2)[0]
        else:
            commit_tag = None
    return (version, num, commit_hash, commit_tag, branch)


def update_wheels_json_data(c, json_data):
    (version, num, commit_hash, commit_tag, branch) = git_version_data(c)
    base_name = create_wheel_name(version, num, commit_hash=commit_hash)
    if commit_tag and commit_tag not in json_data:
        json_data[commit_tag] = {
            'sha1': commit_hash,
            'link_name': create_wheel_name(version, num, commit_hash, tag=commit_tag),
            'wheel_name': base_name
        }
    # update the links for the branches
    json_data[branch] = {
        'sha1': commit_hash,
        'link_name': create_wheel_name(version, num, commit_hash, branch=branch),
        'wheel_name': base_name
    }
    return json_data


@task()
def create_wheel(c, house=None):
    tmp_wheel_path = house if house else os.path.join(c.config.projectpath, 'wheelhouse')
    (version, num, commit_hash, commit_tag, branch) = git_version_data(c)
    c.run("python setup.py bdist_wheel -d " + tmp_wheel_path)


def write_update_json_data(c, json_filepath):
    if exists(c, json_filepath):
        with open(json_filepath) as fp:
            json_data = json.load(fp)
    else:
        json_data = {}
    json_data = update_wheels_json_data(c, json_data)
    with open(json_filepath, 'w+') as fp:
        json.dump(json_data, fp)
    return json_data


@task()
def push_wheelhouse(c, house=None):
    """
    Push dependency links wheelhouse to either:
    A) an S3 bucket
    B) a remote folder via SSH
    C) a local folder
    Checks for zero bytes files to avoid pushing rubbish to S3 and the creation of a bad index.html
    """
    tmp_wheel_path = house or os.path.join(c.config.projectpath, 'wheelhouse')

    # Check assembl wheel is not zero bytes - don't push this!!
    (version, num, commit_hash, commit_tag, branch) = git_version_data(c)
    base_name = create_wheel_name(version, num, commit_hash=commit_hash)

    assembl_wheel = os.path.join(tmp_wheel_path, base_name)
    assembl_wheel_size = os.path.getsize(assembl_wheel)

    if assembl_wheel_size == 0:
        raise RuntimeError("Created wheel not good. Bad dog. Cannot continue...")

    wheel_path = os.getenv('ASSEMBL_WHEELHOUSE', c.config.get(
        'wheelhouse', 's3://bluenove-assembl-wheelhouse'))
    json_filename = 'special-wheels.json'
    if not wheel_path:
        raise RuntimeError("No wheelhouse location was defined in configuration. Cannot continue...")
    elif not tmp_wheel_path:
        raise RuntimeError("There is no local wheelhouse to push. Quitting...")

    if wheel_path.strip().startswith('s3://'):
        # S3
        try:
            import botocore
            import boto3
        except ImportError:
            raise RuntimeError("AWS CLI and Boto3 have to be installed to push to s3. Quitting...")

        s3 = boto3.resource('s3')
        bucket_name = wheel_path[5:]
        bucket = s3.Bucket(bucket_name)
        exists = True
        try:
            s3.meta.client.head_bucket(Bucket=bucket_name)
        except botocore.exceptions.ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                exists = False
        if not exists:
            raise RuntimeError("The Bluenove wheelhouse bucket does not exist on S3. Please create it before continuing...")

        # There must exist a JSON file which holds links to the latest wheels on various branches, along with version tags
        json_filepath = os.path.join(tmp_wheel_path, json_filename)
        try:
            bucket.download_file(json_filename, json_filepath)
        except:
            pass

        indexable_names = {json_filename, 'index.html'}
        wheel_hashes = {}
        existing_wheels = set()
        old_links = set()
        for filename in os.listdir(tmp_wheel_path):
            indexable_names.add(filename)
            with open(os.path.join(tmp_wheel_path, filename), 'rb') as f:
                m = sha256()
                m.update(f.read())
            wheel_hashes[filename] = m.hexdigest()
        for summary in bucket.objects.all():
            if summary.key in (json_filename, 'error.html'):
                # Don't add the JSON file to the indexable list
                continue
            if summary.size == 0:
                old_links.add(summary.key)
                continue
            existing_wheels.add(summary.key)
            if summary.key not in wheel_hashes:
                indexable_names.add(summary.key)
                wheel_hashes[summary.key] = ''  # temporary for testing

        json_data = write_update_json_data(c, json_filepath)

        # put empty objects for S3-redirections (https://docs.aws.amazon.com/AmazonS3/latest/dev/how-to-page-redirect.html)
        for value in json_data.itervalues():
            name = value['link_name']
            if name in old_links:
                old_links.remove(name)
            bucket.put_object(Key=name, ACL='public-read', Body='',
                              WebsiteRedirectLocation='/%s' % value['wheel_name'])
            indexable_names.add(name)

        if old_links:
            bucket.delete_objects(Delete={"Objects": [{"Key": l} for l in old_links]})
        indexable_names = list(indexable_names)
        indexable_names.sort()

        output = os.path.join(tmp_wheel_path, 'index.html')
        fill_template(c, 'wheelhouse_index.jinja2', output, {'wheelhouse': indexable_names, 'hashes': wheel_hashes})
        with open(output) as fp:
            bucket.put_object(Body=fp, Key='index.html', ContentType='text/html', ACL='public-read')

        with open(json_filepath) as fp:
            bucket.put_object(Body=fp, Key=json_filename, ContentType='application/json', ACL='public-read')

        for file in os.listdir(tmp_wheel_path):
            # The hash of created wheels change due to wheel metadata, therefore existing wheels should be overwritten
            # to maintain hash integrity
            if file not in ('index.html', json_filename):
                with open(os.path.join(tmp_wheel_path, file)) as fp:
                    bucket.put_object(Body=fp, Key=file, ACL='public-read')

    elif wheel_path.strip().startswith('local://'):
        c.run('cp -r %s %s' % (tmp_wheel_path, wheel_path.split('local://')[1]))
    else:
        c.run('cp -r %s %s' % (tmp_wheel_path, wheel_path))


@task(
    install_build_dependencies,
    install_node_and_yarn,
    configure_github_user,
    clear_aptitude_cache)
def prepare_cicd_build(c):
    """
    There is full assumption of being in CI/CD environment when calling this function
    """
    project_path = os.getenv('CI_PROJECT_DIR', c.config.projectpath)
    # add github.com as known host
    c.run('ssh-keyscan -t rsa github.com >> ~/.ssh/known_hosts')
    c.run('ssh-keyscan -t rsa gitlab.com >> ~/.ssh/known_hosts')

    with c.cd(os.path.join(project_path, 'assembl/static/css/themes/vendor')):
        c.run('git clone git@github.com:bluenove/assembl-client-themes.git')

    with c.cd(os.path.join(project_path, 'assembl/static2/css/themes/vendor')):
        c.run('git clone git@github.com:bluenove/assembl2-client-themes.git')

    # Build JS dependencies for V1 and V2
    install_bower(c)
    update_bower_requirements(c, force_reinstall=True)
    update_npm_requirements(c, install=True, development_mode=True)
    if is_integration_env(c):
        # This has to be added to actually checkout a branch because gitlab runs its runner
        # in detached HEAD state. This is mostly fine, however, building the wheel names requires
        # access to the branch's history. This is a workaround instead of setting hard depths on
        # shallow cloning.
        c.run('git checkout -B "$CI_BUILD_REF_NAME" "$CI_BUILD_REF"')


@task()
def start_deploy_on_client(c, client_id, region=None):
    import boto3
    assert client_id, "No client-id was passed"
    sts_client = boto3.client('sts')
    response = sts_client.assume_role(
        RoleArn='arn:aws:iam::%s:role/CICD-Role' % (client_id,),
        RoleSessionName='cicd')
    credentials = response['Credentials']
    # we are running on shared, so this will be = aws_shared_region
    region = region or c.config.aws_region
    cd_client = boto3.client(
        'codedeploy',
        aws_access_key_id=credentials['AccessKeyId'],
        aws_secret_access_key=credentials['SecretAccessKey'],
        aws_session_token=credentials['SessionToken'],
        region_name=region)

    response = cd_client.create_deployment(
        applicationName='assembl',
        deploymentGroupName='assembl-deploymentgroup',
        revision={
            'revisionType': 'S3',
            's3Location': {
                'bucket': 'bluenove-assembl-deployments',
                'key': 'code_deploy_test.zip',
                'bundleType': 'zip'
            }
        })
    deploymentId = response['deploymentId']
    while True:
        time.sleep(30)
        deploymentInfo = cd_client.get_deployment(deploymentId=deploymentId)
        deploymentInfo = deploymentInfo['deploymentInfo']
        status = deploymentInfo['status']
        if status == 'Succeeded':
            return
        assert status not in ('Failed', 'Stopped'), "Status of %s is %s: %s\n%s" % (
            deploymentId, status,
            deploymentInfo['errorInformation']['code'],
            deploymentInfo['errorInformation']['message'])
        print(status)


@task()
def get_deployment_clients(c):
    """
    Fetches the list of accounts available to deploy to from a remote bucket
    Assume CI/CD Environment at all times
    """
    get_s3_file('bluenove-assembl-deployments', 'clients.json', 'clients.json')


@task(get_deployment_clients)
def deploy_to_sandbox(c):
    with open('clients.json') as f:
        data = json.load(f)
    client_info = data.get('sandbox', None)
    start_deploy_on_client(c, client_info['id'], client_info.get('region', None))


@task()
def install_url_metadata_source(c):
    "Install url_metadata in venv3 as source, for development"
    if not exists(c, "%s/../url_metadata" % c.config.projectpath):
        print("Cloning git repository")
        with c.cd("%s/.." % c.config.projectpath):
            c.run('git clone git://github.com/assembl/url_metadata.git')
    else:
        print("Url Metadata service being updated...")
        with c.cd("%s/.." % c.config.projectpath):
            c.run('git pull')
    with venv_py3(c):
        c.run('pip install -e ../url_metadata')


@task()
def app_db_update(c):
    """
    Migrates database using alembic
    """
    print('Migrating database')
    with venv(c):
        result = c.run('alembic -c %s heads' % (c.config._internal.ini_file))
        if result.stdout.count('head') > 1:
            raise Exception('Multiple heads detected')
        else:
            c.run('alembic -c %s upgrade head' % (c.config._internal.ini_file))


@task()
def set_file_permissions(c):
    """Set file permissions for an isolated platform environment"""
    setup_var_directory(c)
    webgrp = '_www'
    # This should cover most cases.
    if webgrp not in c.run('groups').stdout.split():
        username = c.run("whoami").stdout.replace('\n', '')
        c.run('sudo dseditgroup -o edit -a {user} -t user {webgrp}'.format(
            webgrp=webgrp, user=username))
    with c.cd(c.config.projectpath):
        upload_dir = get_upload_dir(c)
        project_path = c.config.projectpath
        code_path = os.getcwd()
        c.run('chmod -R o-rwx ' + project_path)
        c.run('chmod -R g-rw ' + project_path)
        chgrp_rec(c, project_path, webgrp)
        chgrp_rec(c, upload_dir, webgrp, project_path)

        if not (code_path.startswith(project_path)):
            c.run('chmod -R o-rwx ' + code_path)
            c.run('chmod -R g-rw ' + code_path)
            chgrp_rec(c, code_path, webgrp)

        c.run('chgrp {webgrp} . {path}/var {path}/var/run {path}/var/share'.format(webgrp=webgrp, path=project_path))
        c.run('chgrp -R {webgrp} {path}/assembl/static {path}/assembl/static2'.format(webgrp=webgrp, path=code_path))
        c.run('chgrp -R {webgrp} {uploads}'.format(webgrp=webgrp, uploads=upload_dir))
        c.run('chmod -R g+rxs {path}/var/run {path}/var/share'.format(path=project_path))
        c.run('chmod -R g+rxs ' + upload_dir)
        c.run('find {path}/assembl/static -type d -print0 |xargs -0 chmod g+rxs'.format(path=code_path))
        c.run('find {path}/assembl/static -type f -print0 |xargs -0 chmod g+r'.format(path=code_path))
        c.run('find {path}/assembl/static2 -type d -print0 |xargs -0 chmod g+rxs'.format(path=code_path))
        c.run('find {path}/assembl/static2 -type f -print0 |xargs -0 chmod g+r'.format(path=code_path))
        # allow postgres user to use pypsql
        c.run('chmod go+x {path}/assembl/scripts'.format(path=code_path))
        c.run('chmod go+r {path}/assembl/scripts/pypsql.py'.format(path=code_path))


@task()
def reindex_elasticsearch(c, bg=False):
    "Rebuild the elasticsearch index"
    cmd = "assembl-reindex-all-contents " + c.config._internal.ini_file
    if bg:
        cmd += "&"
    with venv(c):
        c.run(cmd)


@task()
def rotate_database_dumps(c, dry_run=False):
    """Rotate database backups for real"""
    try:
        from executor.contexts import LocalContext, RemoteContext
        from rotate_backups import RotateBackups, Location
        import rotate_backups
        import coloredlogs
    except ImportError:
        print("This fab command should be run within the venv.")
        return
    rotate_backups.TIMESTAMP_PATTERN = re.compile(
        r'(?P<year>\d{4})(?P<month>\d{2})(?P<day>\d{2})')
    coloredlogs.increase_verbosity()
    rotation_scheme = {
        # same as doc/borg_backup_script/assembl_borg_backup.sh
        'daily': 7, 'weekly': 4, 'monthly': 6,
        # Plus yearly for good conscience
        'yearly': 'always'
    }
    dir = c.config.dbdumps_dir
    if running_locally(c):
        ctx = LocalContext()
        dir = os.path.realpath(dir)
    else:
        ctx = RemoteContext(ssh_alias=c.config.host_string, ssh_user=c.config.user)
    location = Location(context=ctx, directory=dir)
    backup = RotateBackups(rotation_scheme, include_list=['db_*.sql.pgdump', 'db_*.bp'], dry_run=dry_run)
    backup.rotate_backups(location, False)


@task()
def rotate_database_dumps_dry_run(c):
    """Rotate database backups dry run"""
    rotate_database_dumps(c, True)


@task()
def database_dump(c):
    """
    Dumps the database on remote site
    """

    if not exists(c, c.config._dbdumps_dir):
        run('mkdir -m700 %s' % c.config._dbdumps_dir)

    filename = 'db_%s.sql' % time.strftime('%Y%m%d')
    compressed_filename = '%s.pgdump' % filename
    absolute_path = os.path.join(c.config._dbdumps_dir, compressed_filename)

    # Dump
    with venv(c):
        with c.cd(c.config.projectpath):
            c.run('PGPASSWORD=%s pg_dump --host=%s -U%s --format=custom -b %s > %s' % (
                c.config.DEFAULT.db_password,
                c.config.DEFAULT.db_host,
                c.config.DEFAULT.db_user,
                c.config.DEFAULT.db_database,
                absolute_path))

    # Make symlink to latest
    with c.cd(c.config._dbdumps_dir):
        c.run('ln -sf %s %s' % (absolute_path, remote_db_path(c)))


@task()
def database_download(c):
    """
    Dumps and downloads the database from the target server
    """
    destination = join('./', get_db_dump_name())
    if os.path.islink(destination):
        print('Clearing symlink at %s to make way for downloaded file' % (destination))
        c.run('rm %s' % (destination))
    database_dump(c)
    #TODO: fix with download from remote server
    """
    get(remote_db_path(c), destination)
    remote_path = get_upload_dir(c)
    rsync_path = "%s@%s:%s" % (c.config.user, c.config.host_string, remote_path)
    local_venv = c.config.get("local_venv", "./venv")
    local_path = get_upload_dir(c, 'var/uploads')
    c.run("rsync -a %s/ %s" % (rsync_path, local_path), env={'host_string': "localhost", 'venvpath': local_venv,
                                                            'user': getuser(), 'projectpath': os.getcwd()})
    """


@task()
def database_upload(c):
    """
    Uploads a local database backup to the target environment's server
    """
    if(c.config.wsginame != 'dev.wsgi'):
        #TODO: fix with upload from remote server
        """
        put(get_db_dump_name(), remote_db_path(c))
        remote_path = get_upload_dir(c)
        rsync_path = "%s@%s:%s/" % (c.config.user, c.config.host_string, remote_path)
        local_venv = c.config.get("local_venv", "./venv")
        local_path = get_upload_dir(c, 'var/uploads')
        c.run("rsync -a %s/ %s" % (local_path, rsync_path), env={'host_string': "localhost", 'venvpath': local_venv,
                                                        'user': getuser(), 'projectpath': os.getcwd()})
        """


@task()
def database_delete(c):
    """
    Deletes the database instance
    """
    if(c.config.is_production_env is True):
        print(
            "You are not allowed to delete the database of a production " +
            "environment.  If this is a server restore situation, you " +
            "have to temporarily declare env.is_production_env = False " +
            "in the environment")
    else:
        check_and_create_database_user(c)

        with venv(c):
            checkDatabase = c.run('assembl-pypsql -1 -u {user} -p {password} -n {host} "{command}"'.format(
                command="SELECT 1 FROM pg_database WHERE datname='%s'" % (c.config.DEFAULT.db_database),
                password=c.config.DEFAULT.db_password, host=c.config.DEFAULT.db_host, user=c.config.DEFAULT.db_user))

        if not checkDatabase.failed and checkDatabase == '1':
            print("Cannot connect to database, trying to create")
            deleteDatabase = c.run('PGPASSWORD=%s dropdb --host=%s --username=%s %s' % (
                c.config.DEFAULT.db_password, c.config.DEFAULT.postgres_db_host, c.config.DEFAULT.db_user, c.config.DEFAULT.db_database))
            if deleteDatabase.succeeded:
                print("Database deleted successfully!")
        else:
            print("Database does not exist")


def remote_db_path(c):
    return os.path.join(c.config.projectpath, get_db_dump_name())


@task()
def postgres_user_detach(c):
    """Terminate the PID processes owned by the assembl user"""
    process_list = c.run(
        'psql -U %s -h %s -d %s -c "SELECT pid FROM pg_stat_activity where pid <> pg_backend_pid()" ' % (
            c.config.DEFAULT.db_user,
            c.config.DEFAULT.db_host,
            c.config.DEFAULT.db_database))

    pids = process_list.split("\r\n")[2:-1:]
    for pid in pids:
        c.run('psql -U %s -h %s -d %s -c "SELECT pg_terminate_backend(%s);"' % (
            c.config.DEFAULT.db_user,
            c.config.DEFAULT.db_host,
            c.config.DEFAULT.db_database,
            pid))


@task()
def flushmemcache(c):
    """
    Resetting all data in memcached
    """
    if c.config.uses_memcache:
        print('Resetting all data in memcached :')
        wait_str = "" if c.config._mac else "-q 2"
        c.run('echo "flush_all" | nc %s 127.0.0.1 11211' % wait_str)


@task()
def set_ssl_certificates(c):
    "Create stapled SSL certificates"
    if c.config.ocsp_path:
        root_certificate = c.run('curl https://letsencrypt.org/certs/isrgrootx1.pem.txt')
        intermediate_certificate_1 = c.run('curl https://letsencrypt.org/certs/lets-encrypt-x3-cross-signed.pem.txt')
        intermediate_certificate_2 = c.run('curl https://letsencrypt.org/certs/letsencryptauthorityx3.pem.txt')
        with open(c.config.ocsp_path, 'w') as certificates_file:
            for certificate_file in (root_certificate, intermediate_certificate_1, intermediate_certificate_2):
                certificates_file.write(certificate_file)
                certificates_file.write('\n')
    else:
        print("Can't set ssl certificates, env.ocsp_path is not set")


@task()
def create_clean_crontab(c, migrate=False):
    """
    Start with a clean crontab for the assembl user, or migrate by adding email at top
    """
    admin_email = c.config.admin_email
    if not admin_email:
        if not migrate:
            c.run("echo '' | crontab -")
    else:
        cron_command = "MAILTO=%s" % (admin_email)
        if not migrate:
            c.run('echo %s | crontab -' % cron_command)
        else:
            c.run('(echo %s; crontab -l) | crontab -' % cron_command)


@task()
def create_alert_disk_space_script(c):
    """Generates the script to alert on disk space limit and sets cron job for it."""
    with NamedTemporaryFile(delete=False) as f:
        alert_disk_space = f.name
    fill_template('assembl/templates/system/alert_disk_space_template.jinja2', c.config, alert_disk_space)
    put(alert_disk_space, '/home/%s/alert_disk_space.sh' % (c.config.user))
    c.run('chmod +x alert_disk_space.sh')
    cron_command = "0 5 * * * /home/" + c.config.user + "/alert_disk_space.sh"
    c.run(create_add_to_crontab_command(cron_command))


def create_add_to_crontab_command(crontab_line):
    """Generates a shell command that makes sure that a cron won't be added several times (thanks to sort and uniq). This makes sure adding it several times is idempotent."""
    return "(crontab -l | grep -Fv '{cron}'; echo '{cron}') | crontab -".format(cron=crontab_line)


def app_db_install(c):
    """
    Install db the first time and fake migrations
    """
    database_create(c)
    with venv(c):
        c.run('assembl-db-manage %s bootstrap' % (c.config._internal.ini_file))

@task()
def docker_startup(c):
    """Startup assembl from within a docker environment.

    Verify if your database environment exists, and create it otherwise."""
    if as_bool(os.getenv("BUILDING_DOCKER", True)):
        return
    if not exists(c.config._internal.ini_file):
        create_local_ini(c)
    if not exists("supervisord.conf"):
        with venv(c):
            c.run('assembl-ini-files populate %s' % (c.config._internal.ini_file))
    # Copy the static file. This needs improvements.
    copied = False
    if not exists("/opt/assembl_static/static"):
        c.run("cp -rp %s/assembl/static /opt/assembl_static/" % c.config.projectpath)
        copied = True
    if not exists("/opt/assembl_static/static2"):
        c.run("cp -rp %s/assembl/static2 /opt/assembl_static/" % c.config.projectpath)
        copied = True
    if copied:
        c.run("chmod -R a+r /opt/assembl_static")
        c.run("find /opt/assembl_static -type d | xargs chmod a+x")
    check_and_create_database_user(c)
    if not check_if_database_exists(c):
        app_db_install(c)
    elif not check_if_db_tables_exist(c):
        # DB exists, maybe separate the boostrap test
        app_db_install(c)
        reindex_elasticsearch(c)
    else:
        app_db_update(c)
    if not check_if_first_user_exists(c):
        create_first_admin_user(c)
    with venv(c):
        c.run("supervisord")


@task()
def create_first_admin_user(c):
    "Create a user with admin rights, email given in env. as first_admin_email"
    email = c.config.get("first_admin_email", None)
    assert email, "Please set the first_admin_email in the .rc environment"
    with venv(c):
        c.run("assembl-add-user -m %s -u admin -n Admin -p admin --send-password-change %s" % (
            email, c.config._internal.ini_file))


@task()
def upgrade_yarn_crontab(c):
    """Automate the look up for a new version of yarn and update it"""
    statement_base = "0 2 * * 1 %s"
    if c.config._mac:
        cmd = "brew update && brew upgrade yarn"
        statement = statement_base % cmd
        c.run(create_add_to_crontab_command(statement))

    else:
        cmd = "apt-get update && apt-get install --only-upgrade yarn"
        statement = statement_base % cmd
        c.sudo(create_add_to_crontab_command(statement))


@task()
def upgrade_elasticsearch(c):
    "Upgrade elasticsearch to the appropriate version"
    if os.getenv("IN_DOCKER"):
        return

    extract_path = normpath(
        os.path.join(c.config.projectpath, 'var', 'elasticsearch'))
    supervisor_process_stop('elasticsearch')
    if exists(extract_path):
        # Must force write permission in the folder to be able to delete
        # it as non-root user with sudo access
        c.sudo("chmod -R 777 %s" % extract_path)
        c.sudo("rm -rf %s" % extract_path)
    install_elasticsearch(c)
    supervisor_process_start('elasticsearch')


@task()
def install_elasticsearch(c):
    """Install elasticsearch"""
    ELASTICSEARCH_VERSION = c.config.elasticsearch_version

    base_extract_path = normpath(
        join(c.config.projectpath, 'var'))
    extract_path = join(base_extract_path, 'elasticsearch')
    if exists(c, extract_path):
        print("elasticsearch already installed")
        c.run('rm -rf %s' % extract_path)

    base_filename = 'elasticsearch-{version}'.format(version=ELASTICSEARCH_VERSION)
    tar_filename = base_filename + '.tar.gz'
    sha1_filename = tar_filename + '.sha1'
    with c.cd(base_extract_path):
        if not exists(c, tar_filename):
            c.run('curl -o {fname} https://artifacts.elastic.co/downloads/elasticsearch/{fname}'.format(fname=tar_filename))
        sha1_expected = c.run('curl https://artifacts.elastic.co/downloads/elasticsearch/' + sha1_filename).stdout
        sha1_effective = c.run('openssl sha1 ' + tar_filename).stdout
        if ' ' in sha1_effective:
            sha1_effective = sha1_effective.split(' ')[-1]
        assert sha1_effective == sha1_expected, "sha1sum of elasticsearch tarball doesn't match, exiting"
        c.run('tar zxf ' + tar_filename)
        c.run('rm ' + tar_filename)
        c.run('mv %s elasticsearch' % base_filename)

        # ensure that the folder being scp'ed to belongs to the user/group
        user = c.config._user if '_user' in c.config else getpass.getuser()
        c.run('chown -R {user}:{group} {path}'.format(
            user=user, group=c.config._group,
            path=extract_path))

        # Make elasticsearch and plugin in /bin executable
        c.run('chmod ug+x {es} {esp} {in_sh} {sysd} {log}'.format(
            es=join(extract_path, 'bin/elasticsearch'),
            esp=join(extract_path, 'bin/elasticsearch-plugin'),
            in_sh=join(extract_path, 'bin/elasticsearch.in.sh'),
            sysd=join(extract_path, 'bin/elasticsearch-systemd-pre-exec'),
            log=join(extract_path, 'bin/elasticsearch-translog'),
        ))
        c.run(c.config.projectpath + '/var/elasticsearch/bin/elasticsearch-plugin install https://artifacts.elastic.co/downloads/elasticsearch-plugins/analysis-smartcn/analysis-smartcn-{version}.zip'.format(version=ELASTICSEARCH_VERSION))
        c.run(c.config.projectpath + '/var/elasticsearch/bin/elasticsearch-plugin install https://artifacts.elastic.co/downloads/elasticsearch-plugins/analysis-kuromoji/analysis-kuromoji-{version}.zip'.format(version=ELASTICSEARCH_VERSION))

        print("Successfully installed elasticsearch")


@task()
def install_translation_dependencies(c):
    """Install core dependencies needed in order to translate objects
    in React-based Assembl"""
    if c.config._mac:
        c.run("brew install gettext; brew link --force gettext")
    else:
        c.sudo("apt-get install gettext")


@task()
def make_messages(c):
    """
    Run *.po file generation for translation
    """
    with venv(c):
        c.run("python2 setup.py extract_messages")
        c.run("python2 setup.py update_catalog")


@task()
def make_new_messages(c):
    """Build .po files for React based instances of Assembl"""
    with c.cd(c.config.projectpath + "/assembl/static2/"):
        with venv(c):
            c.run('npm run i18n:export', chdir=False)


@task()
def compile_new_messages(c):
    """Build the locale.json files from the corresponding po files"""
    with c.cd(c.config.projectpath + "/assembl/static2/"):
        with venv(c):
            c.run('npm run i18n:import', chdir=False)


@task()
def build_translation_json_files(c):
    """Build locale json files from .po files for each locale"""

    # Version1
    compile_messages(c)
    # Version2
    compile_new_messages(c)


@task()
def build_po_files(c):
    """Build translation files for both versions of Assembl"""

    # Version 1
    make_messages(c)
    # Version 2
    make_new_messages(c)


@task()
def secure_sshd_fail2ban(c):
    if c.config._mac:
        return
    # Fail2ban needs verbose logging for full security
    c.sudo("sed -i 's/LogLevel .*/LogLevel VERBOSE/' /etc/ssh/sshd_config")
    c.sudo('service ssh restart')


delete_foreign_tasks(locals())
