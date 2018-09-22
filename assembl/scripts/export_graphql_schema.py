"""Export complete schema model from GraphQL to JSON."""
import argparse
import traceback
import pdb

from pyramid.paster import get_appsettings, bootstrap
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.config import set_config
from assembl.lib.model_watcher import configure_model_watcher
from assembl.lib.sqla import configure_engine


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("configuration", help="The configuration of the application.", default="local.ini")
    args = parser.parse_args()
    env = bootstrap(args.configuration)
    settings = get_appsettings(args.configuration, 'assembl')
    set_config(settings)
    configure_zmq(settings['changes_socket'], False)
    configure_model_watcher(env['registry'], 'assembl')
    _ = configure_engine(settings, True)
    try:
        from assembl.graphql.schema import Schema, generate_schema_json_from_schema
        generate_schema_json_from_schema(Schema, spec_wrap=True)

    except Exception as _:
        traceback.print_exc()
        pdb.post_mortem()


if __name__ == '__main__':
    main()
