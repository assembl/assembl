from os.path import join, dirname

context_url = 'http://purl.org/catalyst/jsonld'
ontology_dir = join(dirname(__file__), 'ontology')
local_context_loc = join(ontology_dir, 'context.jsonld')
