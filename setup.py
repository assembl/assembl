from __future__ import print_function
import os
import sys

from pip.download import PipSession
from pip.req import parse_requirements
from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.md')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

# parse_requirements() returns generator of pip.req.InstallRequirement objects
if not os.path.exists('requirements.txt'):
    print("Please run first: fab -c configs/develop.rc ensure_requirements")
    sys.exit(0)

install_reqs = parse_requirements('requirements.txt', session=PipSession())

# requires is a list of requirement
# e.g. ['django==1.5.1', 'mezzanine==1.4.6']
requires = [str(ir.req) for ir in install_reqs]

tests_require = ['WebTest']


setup(name='assembl',
      version='2.13.0',
      description='Collective Intelligence platform',
      long_description=README + '\n\n' + CHANGES,
      classifiers=[
          "Programming Language :: Python :: 2.7",
          "Programming Language :: Javascript",
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
      packages=find_packages(),
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
              'static2/translations/*.json',
              'static2/fonts/*',
              'view_def/*.json',
              'templates/*.jinja2',
              'templates/*/*.jinja2',
              'templates/*/*/*.jinja2',
              'templates/views/*.tmpl',
              'nlp/data/*',
              'nlp/data/stopwords/*',
          ]
      },
      data_files=[('share/assembl', [
          'random.ini.tmpl',
          'random_docker.ini.tmpl',
          'saml_random.ini.tmpl',
          'supervisord.conf.tmpl',
          'doc/sample_nginx_config/assembl.yourdomain.com',
          'doc/sample_systemd_script/assembl.service',
          'doc/sample_upstart_script/assembl.conf',
          ])],
      zip_safe=False,
      test_suite='assembl',
      setup_requires=['pip>=6'],
      install_requires=requires,
      tests_require=tests_require,
      extras_require=dict(test=tests_require),
      entry_points={
          "console_scripts": [
              "assembl-db-manage = assembl.scripts.db_manage:main",
              "assembl-ini-files = assembl.scripts.ini_files:main",
              "assembl-imap-test = assembl.scripts.imap_test:main",
              "assembl-add-user  = assembl.scripts.add_user:main",
              "assembl-pypsql  = assembl.scripts.pypsql:main",
              "assembl-pshell  = assembl.scripts.pshell:main",
              "assembl-pserve   = assembl.scripts.pserve:main",
              "assembl-reindex-all-contents  = assembl.scripts.reindex_all_contents:main",
              "assembl-graphql-schema-json = assembl.scripts.export_graphql_schema:main"
          ],
          "paste.app_factory": [
              "main = assembl:main",
              "maintenance = assembl.maintenance:main"
          ],
      }
      )
