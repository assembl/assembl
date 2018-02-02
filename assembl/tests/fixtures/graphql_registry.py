import pytest, io, os


def walktree(top, callback, data, root=None):
    """Recursively descend the directory tree rooted at top,
       calling the callback function for each regular file."""
    if root is None:
        root = top
    for f in os.listdir(top):
        path = os.path.join(top, f)
        if os.path.isdir(path):
            # It's a directory, recurse into it
            walktree(path, callback, data, root)
        elif os.path.isfile(path):
            callback(path, data, root)
    return data


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
    with io.open(pathname, encoding='utf-8') as file_object:
        extension = '.graphql'
        if last_component.endswith(extension):
            key = strip_suffix(last_component, extension)
            node[key] = file_object.read()


registry_path = os.path.dirname(__file__) + '/../../static2/js/app/graphql'


@pytest.fixture(scope="session")
def graphql_registry():
    class Registry(object):
        def __init__(self, data):
            self.data = data

        def __getitem__(self, key):
            op = self.data.get(key)
            if op is None:  # not a query, should be a mutation
                op = self.data['mutations'][key]

            def include_fragments(text, included_fragments):
                for fragment, content in self.data['fragments'].items():
                    if fragment + '.graphql' in text and fragment not in included_fragments:
                        text = include_fragments(content, included_fragments) + text
                        included_fragments.append(fragment)

                return text

            op = include_fragments(op, [])
            return op

    data = walktree(registry_path, add_graphql_files_to_dict, {})
    return Registry(data)
