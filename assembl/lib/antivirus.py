from tempfile import mkdtemp
from subprocess import call
from os import unlink, rmdir
from os.path import join
from random import random

from pyramid.path import DottedNameResolver

from . import config


resolver = DottedNameResolver(__package__)


class AntiVirus(object):
    def check(self, path):
        return NotImplementedError()


class MockPositiveAntiVirus(AntiVirus):
    "A Mock antivirus for testing. Reports no file infected."
    def check(self, path):
        return True


class MockRandomAntiVirus(AntiVirus):
    "A Mock antivirus for testing. Reports 10%% files infected."
    def check(self, path):
        return random() > 0.1


class MockRandomFileAntiVirus(AntiVirus):
    "A Mock antivirus for testing. Reports 10%% files infected."
    def check(self, path):
        return random() > 0.1


class SophosAntiVirus(AntiVirus):
    def check(self, path):
        try:
            return call(['savscan', '-f', path]) == 0
        except Exception as e:
            return False


def get_antivirus(cls_name=None):
    cls_name = cls_name or config.get(
        "anti_virus", "assembl.lib.antivirus.SophosAntiVirus")
    av_class = resolver.resolve(cls_name)
    return av_class()
