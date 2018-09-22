import argparse

from pyramid.paster import get_appsettings, bootstrap
from sqlalchemy_schemadisplay import create_uml_graph
from sqlalchemy.orm import class_mapper

from assembl.lib.sqla import configure_engine
from assembl.lib.zmqlib import configure_zmq
from assembl.lib.model_watcher import configure_model_watcher
from assembl.lib.config import set_config


def make_graph(target_name, generate_dot=False):
    from assembl.models import Base
    mappers = [cls.__mapper__ for cls in Base.get_subclasses()]

    graph = create_uml_graph(
        mappers,
        show_operations=False,
        show_multiplicity_one=False)

    if generate_dot:
        graph.write_dot(target_name + '.dot')
    graph.write_svg(target_name + '.svg')

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument("configuration", help="configuration file")
    parser.add_argument("-o", help="output file basename", default="schema")
    parser.add_argument("--dot", help="also generate dot", action="store_true")
    args = parser.parse_args()
    env = bootstrap(args.configuration)
    settings = get_appsettings(args.configuration, 'assembl')
    set_config(settings)
    configure_zmq(settings['changes_socket'], False)
    configure_model_watcher(env['registry'], 'assembl')
    engine = configure_engine(settings, True)
    make_graph(args.o, args.dot)
