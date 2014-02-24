import os

from setuptools import setup, find_packages

here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.txt')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()

from pip.req import parse_requirements

# parse_requirements() returns generator of pip.req.InstallRequirement objects
install_reqs = parse_requirements('requirements.txt')

# requires is a list of requirement
# e.g. ['django==1.5.1', 'mezzanine==1.4.6']
requires = [str(ir.req) for ir in install_reqs]

tests_require = ['WebTest']



setup(name='assembl',
      version='0.0',
      description='assembl',
      long_description=README + '\n\n' +  CHANGES,
      classifiers=[
        "Programming Language :: Python",
        "Framework :: Pylons",
        "Topic :: Internet :: WWW/HTTP",
        "Topic :: Internet :: WWW/HTTP :: WSGI :: Application",
        ],
      author='',
      author_email='',
      url='',
      keywords='web wsgi bfg pylons pyramid',
      packages=find_packages(),
      include_package_data=True,
      zip_safe=False,
      test_suite='assembl',
      setup_requires = ['pip>=1.4.1'],
      install_requires=requires,
      tests_require=tests_require,
      extras_require=dict(test=tests_require),
      entry_points="""\
      [paste.app_factory]
      main = assembl:main
      [console_scripts]
      assembl-db-manage = assembl.scripts.db_manage:main
      assembl-ini-files = assembl.scripts.ini_files:main
      assembl-imap-test = assembl.scripts.imap_test:main
      assembl-add-user  = assembl.scripts.add_user:main
      [nose.plugins]
      assembl_test_plugin = assembl.tests.nose_plugin:Assembl
      [pytest11]
      assembl_test_plugin = assembl.tests.pytest_plugin
      """,
      )
