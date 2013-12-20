import traceback
from os.path import exists, join, dirname

import simplejson
from pyramid.settings import asbool

_def_cache = {}
_use_cache = True

# generic syntax: { "name": "property:viewdef" }
# variants:
#   - { "name": false } -> nothing.
#   - { "name": "literal_property" } -> { "name": "property:literal" }
#   - { "name": "relation" } -> { "name": "relation:@id" }
#   - { "name": "relation:" } -> { "name": "relation:<same viewdef>" }
#   - { "property": true } -> { "property": "property:literal or @id" }
#   - { "property": ":viewdef" } -> { "property": "property:viewdef" }
#   - { "name": ["relation:viewdef"] } will give the relation as an array in all cases.
#       Same shortcuts apply (ommitting relation or same viewdef.) In particular:
#   - { "name": [true] } will give an array of @id.
#   - { "name": {"@id":"relation:viewdef"} } will give the relation as a dict, indexed by @id.
#       Same shortcuts apply (ommitting relation or same viewdef. No viewdef makes no sense.)
#   - { "name": "&method_name:viewdef" } will call the method with no arguments. 
#       DANGER! PLEASE RETURN JSON or a Base object (in which case viewdef or url applies.)
#   - { "name": "'<json literal>"} This allows to specify literal values.
#
# @id, @type and @view will always be defined.
# Unspecified relation will be given as URL
# Unspecified literal attribute will be present (unless also given as relation.)
# Unspecified back relation will be ommitted.
# 
# IDs will always take the form 
# local:<classname>/<object_id>

def get_view_def(name):
    global _def_cache, _use_cache
    if _use_cache and name in _def_cache:
        return _def_cache[name]

    fname = join(dirname(__file__), name+".json")
    if exists(fname):
        try:
            json = simplejson.load(open(fname))
            if _use_cache:
                _def_cache[name] = json
            return json
        except:
            traceback.print_exc()

def includeme(config):
    global _use_cache
    _use_cache = asbool(config.registry.settings.get('cache_viewdefs', True))
