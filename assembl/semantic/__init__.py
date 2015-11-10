from os.path import join, dirname

context_url = 'http://purl.org/catalyst/jsonld'
ontology_dir = join(dirname(__file__), 'ontology')
local_context_loc = join(ontology_dir, 'context.jsonld')


def upgrade_semantic_mapping():
    from .virtuoso_mapping import AssemblQuadStorageManager
    from assembl.lib.config import get_config
    settings = get_config()
    if settings['sqlalchemy.url'].startswith('virtuoso:'):
        aqsm = AssemblQuadStorageManager()
        aqsm.update_all_storages()


def reset_semantic_mapping():
    from .virtuoso_mapping import AssemblQuadStorageManager
    from assembl.lib.config import get_config
    settings = get_config()
    if settings['sqlalchemy.url'].startswith('virtuoso:'):
        aqsm = AssemblQuadStorageManager()
        aqsm.drop_all()
        aqsm.update_all_storages()
