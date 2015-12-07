from itertools import chain
from collections import MutableMapping

import simplejson as json
from sqlalchemy import (
    Column,
    Integer,
    Text,
    Unicode,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from virtuoso.alchemy import CoerceUnicode

from . import Base, DeclarativeAbstractMeta
from ..auth import P_READ, Everyone


class Preferences(Base, MutableMapping):
    """
    Cascading preferences
    """
    __metaclass__ = DeclarativeAbstractMeta
    __tablename__ = "preferences"
    BASE_PREFS_NAME = "default"
    id = Column(Integer, primary_key=True)
    name = Column(CoerceUnicode, nullable=False, unique=True)
    cascade_id = Column(Integer, ForeignKey(id), nullable=True)
    pref_json = Column("values", Text())  # JSON blob

    cascade_preferences = relationship("Preferences", remote_side=[id])

    @classmethod
    def get_by_name(cls, name=None):
        name = name or cls.BASE_PREFS_NAME
        return cls.default_db.query(cls).filter_by(name=name).first()

    @classmethod
    def get_default_preferences(cls):
        return cls.get_by_name('default') or cls(name='default')

    @property
    def local_values_json(self):
        values = {}
        if self.pref_json:
            values = json.loads(self.pref_json)
        return values

    @local_values_json.setter
    def local_values_json(self, val):
        self.pref_json = json.dumps(val)

    @property
    def values_json(self):
        if not self.cascade_preferences:
            return self.local_values_json
        values = self.cascade_preferences.values_json
        values.update(self.local_values_json)
        return values

    def _get_local(self, key):
        if key not in self.property_defaults:
            raise RuntimeError("Unknown property: " + key)
        values = self.local_values_json
        if key in values:
            value = values[key]
            if key in self.property_output_fn:
                value = self.property_output_fn[key](value)
            return True, value
        return False, None

    def get_local(self, key):
        exists, value = self._get_local(key)
        if exists:
            return value

    def __getitem__(self, key):
        if key == 'name':
            return self.name
        if key == '@extends':
            return (self.uri_generic(self.cascade_id)
                    if self.cascade_id else None)
        exists, value = self._get_local(key)
        if exists:
            return value
        elif self.cascade_id:
            return self.cascade_preferences[key]
        return self.property_defaults.get(key, None)

    def __len__(self):
        return len(self.property_defaults) + 2

    def __iter__(self):
        return chain(self.property_defaults.iterkeys(), (
            'name', '@extends'))

    def __contains__(self, key):
        return key in self.property_defaults

    def __delitem__(self, key):
        values = self.local_values_json
        if key in values:
            oldval = values[key]
            del values[key]
            self.local_values_json = values
            return oldval

    def __setitem__(self, key, value):
        if key == 'name':
            old_value = self.name
            self.name = unicode(value)
            return old_value
        elif key == '@extends':
            old_value = self.get('@extends')
            new_pref = self.get_instance(value)
            if new_pref is None:
                raise KeyError("Does not exist:" + value)
            self.cascade_preferences = new_pref
            return old_value
        if key not in self.property_defaults:
            raise KeyError("Unknown property: " + key)
        values = self.local_values_json
        old_value = values.get(key, None)
        if key in self.property_output_fn:
            value = self.property_output_fn[key](value)
        values[key] = value
        self.local_values_json = values
        return old_value

    def generic_json(
            self, view_def_name='default', user_id=Everyone,
            permissions=(P_READ, ), base_uri='local:'):
        # TODO: permissions
        values = self.local_values_json
        values['name'] = self.name
        if self.cascade_preferences:
            values['@extends'] = self.cascade_preferences.name
        values['@id'] = self.uri()
        return values

    def _do_update_from_json(
            self, json, parse_def, aliases, context, permissions,
            user_id, duplicate_error=True, jsonld=None):
        for key, value in json.iteritems():
            if key == '@id':
                if value != self.uri():
                    raise RuntimeError("Wrong id")
            else:
                self[key] = value
        return self

    def __hash__(self):
        return Base.__hash__(self)

    # This defines the allowed property names and their default values
    property_defaults = {
        # The node types and node type rules (json)
        "node_type_rules": {},
        # List of visualizations
        "visualizations": {},
        # Extra navigation sections (refers to visualizations)
        "navigation_sections": {},
        # Translations for the navigation sections
        "translations": {},
        # Simple view panel order, eg NIM or NMI
        "simple_view_panel_order": "NMI",
        # Registration requires being a member of this email domain.
        "require_email_domain": [],
        # Allow social sharing
        "social_sharing": True,
        # Are moderated posts simply hidden or made inaccessible by default? (bool)
        "default_allow_access_to_moderated_text": True,
        # Default moderation text template
        "moderation_template": None,
        # TODO: preference to allow moderation a priori.
        # Properties which a user cannot override
        # TODO: Invert that list.
        "forbid_user_edit": [
            "require_email_domain", "social_sharing", "require_email_domain"],
        # Show the CI Dashboard in the panel group window
        "show_ci_dashboard": False,
        # Configuration of the visualizations shown in the CI Dashboard
        "ci_dashboard_url": "//cidashboard.net/ui/visualisations/index.php?width=1000&height=1000&vis=11,23,p22,13,p7,7,12,p2,p15,p9,p8,p1,p10,p14,5,6,16,p16,p17,18,p20,p4&lang=<%= lang %>&title=&url=<%= url %>&userurl=<%= user_url %>&langurl=&timeout=60",
    }

    # filter some incoming values through a conversion/validation function
    property_input_fn = {
    }

    # filter some outgoing values through a conversion/validation function
    property_output_fn = {
    }
