def includeme(config):
    config.add_route('private-graphql', '/private-graphql')
    config.scan()
