from __future__ import print_function
import os
from subprocess import check_output

from setuptools import setup, find_packages
try:
    from pip._internal.req import parse_requirements
    from pip._internal.download import PipSession
except ImportError:
    from pip.req import parse_requirements
    from pip.download import PipSession

try:
    from semantic_version import Version
except ImportError as e:
    print("Please, first 'pip install semantic-version'")
    raise e

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.md')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()


def parse_reqs(req_files, links=False):
    """returns a list of requirements from a list of req files"""
    requirements = set()
    session = PipSession()
    for req_file in req_files:
        # parse_requirements() returns generator of pip.req.InstallRequirement objects
        parsed = parse_requirements(req_file, session=session)
        requirements.update({str(ir.req) if not links else ir.link.url.replace('git+', '')
                             for ir in parsed
                             if ir.link or not links})
    return list(requirements)


def auto_inc_version():
    # On travis, the repo is cloned with --depth=100, there may not be enough
    # commits to include any tags, the option --always will fallback to
    # the latest commit hash.
    # Retrieving the tag is needed to build the wheel, but we don't build it
    # on travis, so this is fine to fallback to the commit hash here.
    # Note: retrieving the full repo on travis increases the time by 1 min.
    tag = check_output('git describe --tags --always', shell=True).strip()
    parts = tag.rsplit('-', 2)
    if len(parts) == 1:
        # We're on the tag
        return tag
    else:
        return "%s.dev%s+%s" % (Version(parts[0]).next_patch(), parts[1], parts[2][1:])


version = auto_inc_version()


setup(name='assembl',
      version=version,
      description='Collective Intelligence platform',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
          "Programming Language :: Python :: 2.7",
          "Programming Language :: JavaScript",
          "Framework :: Pyramid",
          "Topic :: Communications",
          "Topic :: Internet :: WWW/HTTP",
          "Topic :: Internet :: WWW/HTTP :: Dynamic Content :: Message Boards",
          "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
          "License :: OSI Approved :: GNU Affero General Public License v3",
      ],
      author='',
      author_email='',
      url='http://assembl.org/',
      license='AGPLv3',
      keywords='web wsgi pyramid',
      # find_packages misses alembic somehow.
      packages=find_packages() + ['assembl.alembic', 'assembl.alembic.versions'],
      # scripts=['fabfile.py'],
      package_data={
          'assembl': [
              'locale/*/LC_MESSAGES/*.json',
              'locale/*/LC_MESSAGES/*.mo',
              'static/js/build/*.js',
              'static/js/build/*.map',
              'static*/img/*',
              'static*/img/*/*',
              'static*/img/*/*/*',
              'static/css/fonts/*',
              'static/css/themes/default/*css',
              'static/css/themes/default/*css.map',
              'static/css/themes/default/img/*',
              'static/js/app/utils/browser-detect.js',
              'static/js/bower/*/dist/css/*.css',
              'static/js/bower/*/dist/img/*',
              'static/js/bower/*/css/*.css',
              'static/js/bower/*/*.css',
              # Missing: Widgets
              'static2/build/*.map',
              'static2/build/*.js',
              'static2/build/*.css',
              'static2/build/*.svg',
              'static2/build/*.html',
              'static2/build/themes/default/*',
              'static2/routes.json',
              'static2/translations/*.json',
              'static2/fonts/*',
              'view_def/*.json',
              'configs/*.rc',
              'configs/*.ini',
              'configs/*.yaml',
              'templates/*.jinja2',
              'templates/*/*.jinja2',
              'templates/*/*/*.jinja2',
              'templates/*/*.tmpl',
              'nlp/data/*',
              'nlp/data/stopwords/*',
          ]
      },
      zip_safe=False,
      test_suite='assembl',
      setup_requires=['pip>=6'],
      install_requires=parse_reqs(['requirements.in']),
      tests_require=parse_reqs(['requirements-tests.in']),
      dependency_links=parse_reqs(
          ['requirements.in'],
          links=True
      ),
      extras_require={
          'docs': parse_reqs(['requirements-doc.in']),
          'dev': parse_reqs(['requirements-dev.in']),
          'test': parse_reqs(['requirements-tests.in']),
      },
      entry_points={
          "console_scripts": [
              "assembl-check-availability = assembl.scripts.check_availability:main",
              "assembl-db-manage = assembl.scripts.db_manage:main",
              "assembl-ini-files = assembl.scripts.ini_files:main",
              "assembl-imap-test = assembl.scripts.imap_test:main",
              "assembl-add-user  = assembl.scripts.add_user:main",
              "assembl-pypsql  = assembl.scripts.pypsql:main",
              "assembl-pshell  = assembl.scripts.pshell:main",
              "assembl-pserve   = assembl.scripts.pserve:main",
              "assembl-reindex-all-contents  = assembl.scripts.reindex_all_contents:main",
              "assembl-graphql-schema-json = assembl.scripts.export_graphql_schema:main",
              "assembl-add-semantics-tab = assembl.scripts.add_semantic_analysis_tab:main"
          ],
          "paste.app_factory": [
              "main = assembl:main",
              "maintenance = assembl.maintenance:main"
          ],
      }
      )
