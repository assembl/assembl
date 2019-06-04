from os.path import dirname, join, exists, abspath
from subprocess import check_output
import pkg_resources

from semantic_version import Version

__version__ = "2.21.1"

_cached_version = None


def version():
    global _cached_version
    if _cached_version is None:
        code_base = abspath(dirname(dirname(__file__)))
        if exists(join(code_base, '.git')):
            tag = check_output('cd %s && git describe --tags' % code_base, shell=True)
            parts = tag.strip().rsplit('-', 2)
            assert parts[0] == __version__
            if len(parts) == 1:
                # We're on the tag
                _cached_version = Version(parts[0])
            else:
                base = Version(parts[0]).next_patch()
                _cached_version = Version('%s.dev%s+%s' % (base, parts[1], parts[2][1:]))
        else:
            # from wheel
            _cached_version = Version(pkg_resources.get_distribution("assembl").version)
            assert str(_cached_version) == __version__
    return _cached_version
