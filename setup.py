import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.md')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

from pip.download import PipSession
from pip.req import parse_requirements

# parse_requirements() returns generator of pip.req.InstallRequirement objects
install_reqs = parse_requirements('requirements.txt', session=PipSession())

# requires is a list of requirement
# e.g. ['django==1.5.1', 'mezzanine==1.4.6']
requires = [str(ir.req) for ir in install_reqs]

tests_require = ['WebTest']



setup(name='assembl',
      version='2.5.2',
      description='Collective Intelligence platform',
      long_description=README + '\n\n' +  CHANGES,
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
      keywords='web wsgi bfg pylons pyramid',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='assembl',
      setup_requires = ['pip>=6'],
      install_requires=requires,
      tests_require=tests_require,
      extras_require=dict(test=tests_require),
      entry_points="""\
      [paste.app_factory]
      main = assembl:main
      maintenance = assembl.maintenance:main
      [console_scripts]
      assembl-db-manage = assembl.scripts.db_manage:main
      assembl-ini-files = assembl.scripts.ini_files:main
      assembl-imap-test = assembl.scripts.imap_test:main
      assembl-add-user  = assembl.scripts.add_user:main
      assembl-pypsql  = assembl.scripts.pypsql:main
      assembl-pshell  = assembl.scripts.pshell:main
      assembl-pserve   = assembl.scripts.pserve:main
      assembl-reindex-all-contents  = assembl.scripts.reindex_all_contents:main
      """,
      )
