from tempfile import mkdtemp
from subprocess import call
from os import unlink, rmdir
from os.path import join
from random import random

from pyramid.path import DottedNameResolver

from . import config


resolver = DottedNameResolver(__package__)


class AntiVirus(object):
    def check(self, data, suffix=None):
        return NotImplementedError()


class MockPositiveAntiVirus(AntiVirus):
    "A Mock antivirus for testing. Reports no file infected."
    def check(self, data, suffix=None):
        return True


class MockRandomAntiVirus(AntiVirus):
    "A Mock antivirus for testing. Reports 10%% files infected."
    def check(self, data, suffix=None):
        return random() > 0.1


class FileAntiVirus(AntiVirus):
    def check(self, data, suffix=None):
        fname = 'temp' + (suffix or '')
        directory = mkdtemp()
        full_name = join(directory, fname)
        try:
            with open(full_name, 'wb') as f:
                f.write(data)
            return self.check_file(full_name)
        except Exception as e:
            return False
        finally:
            unlink(full_name)
            rmdir(directory)

    def check_file(self, fname):
        return NotImplementedError()


class MockRandomFileAntiVirus(FileAntiVirus):
    "A Mock antivirus for testing. Reports 10%% files infected."
    def check_file(self, fname):
        return random() > 0.1


class SophosAntiVirus(FileAntiVirus):
    def check_file(self, fname):
        try:
            return call(['savscan', '-f', fname]) == 0
        except Exception as e:
            return False


def get_antivirus(cls_name=None):
    cls_name = cls_name or config.get(
        "anti_virus", "assembl.lib.antivirus.SophosAntiVirus")
    av_class = resolver.resolve(cls_name)
    return av_class()
