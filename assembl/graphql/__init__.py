"""The module containing all graphql schemas, mutations, views, configs"""


def includeme(config):
    config.add_route('graphql', '/graphql')
    config.add_route('graphql_debug', 'graphiql')
    config.scan()
