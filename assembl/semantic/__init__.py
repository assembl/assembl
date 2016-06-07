"""package of semantic Web (RDF) modules.

Currently deprecated, as it is based on Virtuoso
and we gave up on that approach."""
from os.path import join, dirname

context_url = 'http://purl.org/catalyst/jsonld'
ontology_dir = join(dirname(__file__), 'ontology')
local_context_loc = join(ontology_dir, 'context.jsonld')


def upgrade_semantic_mapping():
    from assembl.lib.sqla import using_virtuoso
    if using_virtuoso():
        from .virtuoso_mapping import AssemblQuadStorageManager
        aqsm = AssemblQuadStorageManager()
        aqsm.update_all_storages()


def reset_semantic_mapping():
    from assembl.lib.sqla import using_virtuoso
    if using_virtuoso():
        from .virtuoso_mapping import AssemblQuadStorageManager
        aqsm = AssemblQuadStorageManager()
        aqsm.drop_all()
        aqsm.update_all_storages()
