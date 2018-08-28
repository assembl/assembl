"""The module containing all graphql schemas, mutations, views, configs"""


def includeme(config):
    config.add_route('graphql', '/{discussion_slug}/graphql')
    config.scan()
