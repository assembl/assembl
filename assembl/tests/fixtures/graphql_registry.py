import os
import codecs
import pytest
from stat import ST_MODE, S_ISDIR, S_ISREG


def walktree(top, callback, file_dict, root=None):
    '''recursively descend the directory tree rooted at top,
       calling the callback function for each regular file'''
    if root is None:
        root = top
    for f in os.listdir(top):
        pathname = os.path.join(top, f)
        mode = os.stat(pathname)[ST_MODE]
        if S_ISDIR(mode):
            # It's a directory, recurse into it
            walktree(pathname, callback, file_dict, root)
        elif S_ISREG(mode):
            # It's a file, call the callback function
            callback(pathname, file_dict, root)
    return file_dict


def strip_prefix(text, prefix):
    if text.startswith(prefix):
        return text[len(prefix):]
    return text


def strip_suffix(text, suffix):
    if text.endswith(suffix):
        return text[:-len(suffix)]
    return text


def add_graphql_files_to_dict(pathname, file_dict, root):
    components_string = strip_prefix(pathname, root).lstrip('/')
    components = components_string.split('/')
    node = file_dict
    for component in components[:-1]:
        if component not in node.keys():
            node[component] = {}
        node = node[component]
    last_component = components[-1]
    with codecs.open(pathname, encoding='utf-8') as file_object:
        node[strip_suffix(last_component, '.graphql')] = file_object.read()


registry_path = os.path.split(__file__)[0] + '/../../static2/js/app/graphql'


@pytest.fixture(scope="function")
def graphql_registry():
    return walktree(registry_path, add_graphql_files_to_dict, {})
