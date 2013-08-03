import os
from setuptools import setup, find_packages
from pip.req import parse_requirements


here = os.path.abspath(os.path.dirname(__file__))
README = open(os.path.join(here, 'README.txt')).read()
CHANGES = open(os.path.join(here, 'CHANGES.txt')).read()


class AnonymousObjectClass(object):
    """
    In my version of pip, if the options arguments passed to
    parse_requiremetns is None, an error is raised. Need to passe a
    configuraiton object with at least skip_requirements_regex.
    """
    def __init__(self, **kwargs):
        self.__dict__.update(kwargs)


install_reqs = parse_requirements(
    'requirements.txt',
    options=AnonymousObjectClass(skip_requirements_regex=None)
    )


# requires is a list of requirement
# e.g. ['django==1.5.1', 'mezzanine==1.4.6']
requires = [str(ir.req) for ir in install_reqs]
tests_require = ['webtest']


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
      setup_requires = ['pip>=1.4'],
      install_requires=requires,
      tests_require=tests_require,
      extras_require=dict(test=tests_require),
      entry_points="""\
      [paste.app_factory]
      main = assembl:main
      [console_scripts]
      assembl-db-manage = assembl.scripts.db_manage:main
      assembl-imap-test = assembl.scripts.imap_test:main
      """,
      )
