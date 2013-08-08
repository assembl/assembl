from __future__ import absolute_import
import json


class ColanderMixin(object):

    @classmethod
    def from_json(cls, json_str):
        return cls.__colanderalchemy__.deserialize(
            json.loads(json_str))
            
