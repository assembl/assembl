from os import path

from hashfs.hashfs import HashFS

from .config import get

_hashfs = None


def get_hashfs():
    global _hashfs
    if _hashfs is None:
        root = get('upload_root', 'var/uploads')
        if root[0] != '/':
            root = path.abspath(path.join(
                path.dirname(__file__), '..', '..', root))
        _hashfs = HashFS(root)
    return _hashfs
