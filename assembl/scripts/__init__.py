"""Scripts that can be run from the CLI"""

import logging.config

from pyramid.paster import get_appsettings, bootstrap

from ..lib.sqla import configure_engine, get_session_maker
from ..lib.zmqlib import configure_zmq
from ..lib.model_watcher import configure_model_watcher
from ..lib.config import set_config
from ..indexing.changes import configure_indexing

from __future__ import print_function

def get_multimodule_extracts_file(discussion, lang='fr', anon='false', social_columns=True, start=None, end=None, interval=None):
    """
    Helper function to get all of the exports as a file to be downloaded. Downloaded into the S3 bucket.
    To be used within a shell environment
    """
    import boto3
    from datetime import datetime
    from pyramid.threadlocal import manager
    from assembl.views.api2.discussion import multi_module_csv_export, XSLX_MIMETYPE
    from assembl.lib.config import get

    class FakeContext(object):
        def __init__(self, discussion):
            self._instance = discussion

    class FakeLocalizer(object):
        def translate(self, message):
            return message

    class FakeRequest(object):
        authenticated_userid = None

        def __init__(self, discussion):
            self.discussion = discussion
            self.GET = {}
            self.context = FakeContext(discussion)
            self.localizer = FakeLocalizer()

    r = FakeRequest(discussion)
    manager.push({'request': r})
    r.GET['as_buffer'] = 'true'
    r.GET['lang'] = lang
    r.GET['anon'] = anon
    if not social_columns:
        r.GET['no_extra_columns'] = 'true'
    if start:
        r.GET['start'] = start
    if end:
        r.GET['end'] = end
    if interval:
        r.GET['interval'] = interval
    try:
        output = multi_module_csv_export(r)
    finally:
        manager.pop()

    account_number = get('aws_client', None)
    _now = datetime.utcnow()
    name = "multi_module_csv_export-%s" % _now.isoformat()

    def write(o):
        with open(name, mode='w') as f:
            f.write(output)
    if account_number:
        try:
            s3 = boto3.resource('s3')
            bucket = s3.Bucket('assembl-data-%s' % account_number.strip())
            bucket.put_object(Body=output, ContentType=XSLX_MIMETYPE, Key=name)
            print("The file was uploaded as %s" % name)
        except Exception:
            write(output)
            print("Failed to upload, creating file locally with name %s" % name)
    else:
        write(output)
        print("The account number could not be found. Saving the file to disk as %s" % name)


def boostrap_configuration(config, do_bootstrap=True):
    logging.config.fileConfig(config)
    settings = get_appsettings(config, 'assembl')
    if do_bootstrap:
        env = bootstrap(config)
        configure_model_watcher(env, 'assembl')
    set_config(settings)
    configure_zmq(settings['changes_socket'], False)
    configure_engine(settings, True)
    configure_indexing()
    session = get_session_maker()()
    return session
