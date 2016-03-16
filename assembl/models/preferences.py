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
from pyramid.httpexceptions import HTTPUnauthorized

from . import Base, DeclarativeAbstractMeta
from ..auth import P_READ, Everyone, P_ADMIN_DISC, P_SYSADMIN, P_ADD_IDEA
from ..lib.abc import classproperty
from ..lib.locale import _, strip_country
from ..lib import config


def merge_json(base, patch):
    # simplistic recursive dictionary merge
    if not (isinstance(base, dict) and isinstance(patch, dict)):
        return patch
    base = dict(base)
    for k, v in patch.iteritems():
        if k in base:
            base[k] = merge_json(base[k], v)
        else:
            base[k] = v
    return base


class Preferences(MutableMapping, Base):
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
            assert isinstance(values, dict)
        return values

    @local_values_json.setter
    def local_values_json(self, val):
        assert isinstance(val, dict)
        self.pref_json = json.dumps(val)

    @property
    def values_json(self):
        if not self.cascade_preferences:
            return self.local_values_json
        values = self.cascade_preferences.values_json
        values.update(self.local_values_json)
        return values

    def _get_local(self, key):
        if key not in self.preference_data:
            raise RuntimeError("Unknown preference: " + key)
        values = self.local_values_json
        if key in values:
            value = values[key]
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
        if key == "preference_data":
            return self.get_preference_data_list()
        return self.get_preference_data()[key].get("default", None)

    def __len__(self):
        return len(self.preference_data_list) + 2

    def __iter__(self):
        return chain(self.preference_data_key_list, (
            'name', '@extends'))

    def __contains__(self, key):
        return key in self.preference_data_key_set

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
        if key not in self.preference_data_key_set:
            raise KeyError("Unknown preference: " + key)
        values = self.local_values_json
        old_value = values.get(key, None)
        self.validate(key, value)
        values[key] = value
        self.local_values_json = values
        return old_value

    def can_edit(self, key, permissions=(P_READ,), pref_data=None):
        if P_SYSADMIN in permissions:
            return True
        if key in ('name', '@extends', 'preference_data'):
            # TODO: Delegate permissions.
            return False
        if key not in self.preference_data_key_set:
            raise KeyError("Unknown preference: " + key)
        if pref_data is None:
            pref_data = self.get_preference_data()[key]
        req_permission = pref_data.get(
            'modification_permission', P_ADMIN_DISC)
        if req_permission not in permissions:
            return False
        return True

    def safe_del(self, key, permissions=(P_READ,)):
        if not self.can_edit(key, permissions):
            raise HTTPUnauthorized("Cannot delete "+key)
        del self[key]

    def safe_set(self, key, value, permissions=(P_READ,)):
        if not self.can_edit(key, permissions):
            raise HTTPUnauthorized("Cannot edit "+key)
        self[key] = value

    def validate(self, key, value, pref_data=None):
        if pref_data is None:
            pref_data = self.get_preference_data()[key]
        validator = pref_data.get('backend_validator_function', None)
        if validator:
            # This has many points of failure, but all failures are meaningful.
            module, function = validator.rsplit(".", 1)
            from importlib import import_module
            mod = import_module(module)
            if not getattr(mod, function)(value):
                raise ValueError("%s refused %s" (validator, value))
        data_type = pref_data.get("value_type", "json")
        if data_type.startswith("list_of_"):
            assert isinstance(value, (list, tuple)), "Not a list"
            for val in value:
                self.validate_single_value(key, val, pref_data, data_type[8:])
        else:
            self.validate_single_value(key, value, pref_data, data_type)

    def validate_single_value(self, key, value, pref_data, data_type):
        # TODO: Validation for the datatypes.
        # Types: (bool|json|int|(list_of_)?(string|text|scalar|url|email|domain|locale))
        if data_type == "bool":
            assert isinstance(value, bool), "Not a boolean"
        elif data_type == "int":
            assert isinstance(value, int), "Not an integer"
        elif data_type == "json":
            pass  # no check
        else:
            assert isinstance(value, (str, unicode)), "Not a string"
            if data_type in ("string", "text"):
                pass
            elif data_type == "scalar":
                assert value in pref_data.get("scalar_values", ()), (
                    "value not allowed: " + value)
            elif data_type == "url":
                from urlparse import urlparse
                assert urlparse(value).scheme in (
                    'http', 'https'), "Not a HTTP URL"
            elif data_type == "email":
                from pyisemail import is_email
                assert is_email(value), "Not an email"
            elif data_type == "locale":
                pass  # TODO
            elif data_type == "domain":
                from pyisemail.validators.dns_validator import DNSValidator
                v = DNSValidator()
                assert v.is_valid(value), "Not a valid domain"
            else:
                raise RuntimeError("Invalid data_type: " + data_type)

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

    @classproperty
    def property_defaults(cls):
        return {p['id']: p.get("default", None)
                for p in cls.preference_data_list}

    def get_preference_data(self):
        if self.cascade_id:
            base = self.cascade_preferences.get_preference_data()
        else:
            base = self.preference_data
        exists, patch = self._get_local("preference_data")
        if exists:
            return merge_json(base, patch)
        else:
            return base

    def get_preference_data_list(self):
        data = self.get_preference_data()
        keys = self.preference_data_key_list
        return [data[key] for key in keys]

    # This defines the allowed properties and their data format
    # Each preference metadata has the following format:
    # id (the key for the preference as a dictionary)
    # name (for interface)
    # description (for interface, hover help)
    # value_type: "(list_of_)?(bool|json|int|string|text|scalar|url|email|domain|locale)"
    #   more types may be added, but need to be added to both frontend and backend
    # show_in_preferences: Do we always hide this preference?
    # modification_permission: What permission do you need to change that preference?
    #   (default: P_DISCUSSION_ADMIN)
    # allow_user_override: Do we allow users to have their personal value for that permission?
    #   if so what permission is required? (default False)
    # scalar_values: "{value: "label"}" a dictionary of permitted options for a scalar value type
    # default: the default value
    # item_default: the default value for new items in a list_of_...

    preference_data_list = [
        # Languages used in the discussion.
        {
            "id": "preferred_locales",
            "value_type": "list_of_locale",
            "name": _("Languages used"),
            "description": _("All languages expected in the discussion"),
            "allow_user_override": None,
            "default": [strip_country(x) for x in config.get_config().get(
                'available_languages', 'fr en').split()]
        },
        # full class name of translation service to use, if any
        # e.g. assembl.nlp.translate.GoogleTranslationService
        {
            "id": "translation_service",
            "name": _("Translation service"),
            "value_type": "scalar",
            "scalar_values": {
                "": _("No translation"),
                "assembl.nlp.translation_service.DummyTranslationServiceTwoSteps":
                    _("Dummy translation service (two steps)"),
                "assembl.nlp.translation_service.DummyTranslationServiceOneStep":
                    _("Dummy translation service (one step)"),
                "assembl.nlp.translation_service.DummyTranslationServiceTwoStepsWithErrors":
                    _("Dummy translation service (two steps) with errors"),
                "assembl.nlp.translation_service.DummyTranslationServiceOneStepWithErrors":
                    _("Dummy translation service (one step) with errors"),
                "assembl.nlp.translation_service.GoogleTranslationService":
                    _("Google Translate")},
            "description": _(
                "Translation service"),
            "allow_user_override": None,
            "modification_permission": P_SYSADMIN,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": ""
        },

        # Simple view panel order, eg NIM or NMI
        {
            "id": "simple_view_panel_order",
            "name": _("Panel order in simple view"),
            "value_type": "scalar",
            "scalar_values": {
                "NMI": _("Navigation, Idea, Messages"),
                "NIM": _("Navigation, Messages, Idea")},
            "description": _("Order of panels"),
            "allow_user_override": P_READ,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": "NMI"
        },
        # Allow social sharing
        {
            "id": "social_sharing",
            "name": _("Social sharing"),
            "value_type": "bool",
            # "scalar_values": {value: "label"},
            "description": _("Show the share button on posts and ideas"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": True
        },
        # Are moderated posts simply hidden or made inaccessible by default?
        {
            "id": "default_allow_access_to_moderated_text",
            "name": _("Allow access to moderated text"),
            "value_type": "bool",
            # "scalar_values": {value: "label"},
            "description": _(
                "Are moderated posts simply hidden or made inaccessible "
                "by default?"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": True
        },
        


        # Registration requires being a member of this email domain.
        {
            "id": "require_email_domain",
            "name": _("Require Email Domain"),
            "value_type": "list_of_domain",
            # "scalar_values": {value: "label"},
            "description": _(
                "List of domain names of user email address required for "
                "self-registration. Only accounts with at least an email from those "
                "domains can self-register to this discussion. Anyone can "
                "self-register if this is empty."),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": [],
            "item_default": ""
        },

        # Show the CI Dashboard in the panel group window
        {
            "id": "show_ci_dashboard",
            "name": _("Show CI Dashboard"),
            "value_type": "bool",
            # "scalar_values": {value: "label"},
            "description": _(
                "Show the CI Dashboard in the panel group window"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": False
        },

        # Configuration of the visualizations shown in the CI Dashboard
        {
            "id": "ci_dashboard_url",
            "name": _("URL of CI Dashboard"),
            "value_type": "url",
            "description": _(
                "Configuration of the visualizations shown in the "
                "CI Dashboard"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default":
                "//cidashboard.net/ui/visualisations/index.php?"
                "width=1000&height=1000&vis=11,23,p22,13,p7,7,12,p2,p15,p9,"
                "p8,p1,p10,p14,5,6,16,p16,p17,18,p20,p4&lang=<%= lang %>"
                "&title=&url=<%= url %>&userurl=<%= user_url %>"
                "&langurl=&timeout=60"
        },
        # List of visualizations
        {
            "id": "visualizations",
            "name": _("Catalyst Visualizations"),
            "value_type": "json",
            # "scalar_values": {value: "label"},
            "description": _(
                "A JSON description of available Catalyst visualizations"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": {}
        },
        # Extra navigation sections (refers to visualizations)
        {
            "id": "navigation_sections",
            "name": _("Navigation sections"),
            "value_type": "json",
            # "scalar_values": {value: "label"},
            "description": _(
                "A JSON specification of Catalyst visualizations to show "
                "in the navigation section"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": {}
        },
        # Translations for the navigation sections
        {
            "id": "translations",
            "name": _("Catalyst translations"),
            "value_type": "json",
            # "scalar_values": {value: "label"},
            "description": _(
                "Translations applicable to Catalyst visualizations, "
                "in Jed (JSON) format"),
            "allow_user_override": None,
            # "view_permission": P_READ,  # by default
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": {}
        },
        # Default expanded/collapsed state of each idea in the table of ideas.
        # A user can override it by opening/closing an idea.
        # This is a hash where keys are ideas ids.
        {
            "id": "default_table_of_ideas_collapsed_state",
            "name": _("Default Table of Ideas Collapsed state"),
            "value_type": "json",
            # "scalar_values": {value: "label"},
            "description": _(
                "Default expanded/collapsed state of each idea in the table "
                "of ideas. A user can override it by opening/closing an idea"),
            "allow_user_override": None,
            # "view_permission": P_READ,  # by default
            "modification_permission": P_ADD_IDEA,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": {},
            "show_in_preferences": False
        },
        {
            "id": "preference_data",
            "name": _("Preference data"),
            "value_type": "json",
            "show_in_preferences": False,
            "description": _(
                "The preference configuration; override only with care"),
            "allow_user_override": None,
            "modification_permission": P_SYSADMIN,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": None  # this should be recursive...
        }
    ]

    # Precompute, this is not mutable.
    preference_data_key_list = [p["id"] for p in preference_data_list]
    preference_data_key_set = set(preference_data_key_list)
    preference_data = {p["id"]: p for p in preference_data_list}
