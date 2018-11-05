# -*- coding: utf-8 -*-
"""A set of preferences that apply to a Discussion.

May be defined at the user, Discussion or server level."""
from itertools import chain
from collections import MutableMapping
from urlparse import urlparse
import simplejson as json
from sqlalchemy import (
    Column,
    Integer,
    Text,
    ForeignKey,
)
from sqlalchemy.orm import relationship
from assembl.lib.sqla_types import CoerceUnicode
from pyramid.httpexceptions import HTTPUnauthorized

from . import Base, DeclarativeAbstractMeta, NamedClassMixin
from assembl.auth import (
    ASSEMBL_PERMISSIONS,
    Authenticated,
    CrudPermissions,
    Everyone,
    P_ADD_EXTRACT,
    P_ADD_IDEA,
    P_ADD_POST,
    P_ADMIN_DISC,
    P_DELETE_MY_POST,
    P_DELETE_POST,
    P_DISC_STATS,
    P_EDIT_EXTRACT,
    P_EDIT_IDEA,
    P_EDIT_MY_EXTRACT,
    P_EDIT_MY_POST,
    P_EDIT_POST,
    P_EDIT_SYNTHESIS,
    P_EXPORT_EXTERNAL_SOURCE,
    P_MANAGE_RESOURCE,
    P_MODERATE,
    P_OVERRIDE_SOCIAL_AUTOLOGIN,
    P_READ_PUBLIC_CIF,
    P_READ,
    P_SELF_REGISTER,
    P_SEND_SYNTHESIS,
    P_SYSADMIN,
    P_VOTE,
    R_ADMINISTRATOR,
    R_CATCHER,
    R_MODERATOR,
    R_PARTICIPANT,
    SYSTEM_ROLES
)
from assembl.lib.abc import classproperty
from assembl.lib.locale import _, strip_country
from assembl.lib.utils import is_valid_ipv4_address, is_valid_ipv6_address
from assembl.lib import config


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


class Preferences(MutableMapping, Base, NamedClassMixin):
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
    def get_naming_column_name(self):
        return "name"

    @classmethod
    def get_by_name(cls, name=None, session=None):
        name = name or cls.BASE_PREFS_NAME
        session = session or cls.default_db
        return session.query(cls).filter_by(name=name).first()

    @classmethod
    def get_default_preferences(cls, session=None):
        return cls.get_by_name('default', session) or cls(name='default')

    @classmethod
    def get_discussion_conditions(cls, discussion_id):
        # This is not a DiscussionBoundBase, but protocol is otherwise useful
        from .discussion import Discussion
        return ((cls.id == Discussion.preferences_id),
                (Discussion.id == discussion_id))

    @classmethod
    def init_from_settings(cls, settings):
        """Initialize some preference values"""
        from ..auth.social_auth import get_active_auth_strategies
        # TODO: Give linguistic names to social auth providers.
        active_strategies = {
            k: k for k in get_active_auth_strategies(settings)}
        active_strategies[''] = _("No special authentication")
        cls.preference_data['authorization_server_backend']['scalar_values'] = active_strategies

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
            raise KeyError("Unknown preference: " + key)
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
        value = self.validate(key, value)
        values[key] = value
        self.local_values_json = values
        return old_value

    def can_edit(self, key, permissions=(P_READ,), pref_data=None):
        if P_SYSADMIN in permissions:
            if key == 'name' and self.name == self.BASE_PREFS_NAME:
                # Protect the base name
                return False
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
            raise HTTPUnauthorized("Cannot delete " + key)
        del self[key]

    def safe_set(self, key, value, permissions=(P_READ,)):
        if not self.can_edit(key, permissions):
            raise HTTPUnauthorized("Cannot edit " + key)
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
            try:
                value = getattr(mod, function)(value)
                if value is None:
                    raise ValueError("Empty value after validation")
            except Exception as e:
                raise ValueError(e.message)
        data_type = pref_data.get("value_type", "json")
        return self.validate_single_value(key, value, pref_data, data_type)

    def validate_single_value(self, key, value, pref_data, data_type):
        # TODO: Validation for the datatypes.
        # base_type: (bool|json|int|string|text|scalar|url|email|domain|locale|langstr|permission|role)
        # type: base_type|list_of_(type)|dict_of_(base_type)_to_(type)
        if data_type.startswith("list_of_"):
            assert isinstance(value, (list, tuple)), "Not a list"
            return [
                self.validate_single_value(key, val, pref_data, data_type[8:])
                for val in value]
        elif data_type.startswith("dict_of_"):
            assert isinstance(value, (dict)), "Not a dict"
            key_type, value_type = data_type[8:].split("_to_", 1)
            assert "_" not in key_type
            return {
                self.validate_single_value(key, k, pref_data, key_type):
                self.validate_single_value(key, v, pref_data, value_type)
                for (k, v) in value.iteritems()}
        elif data_type == "langstr":
            # Syntactic sugar for dict_of_locale_to_string
            assert isinstance(value, (dict)), "Not a dict"
            return {
                self.validate_single_value(key, k, pref_data, "locale"):
                self.validate_single_value(key, v, pref_data, "string")
                for (k, v) in value.iteritems()}
        elif data_type == "bool":
            assert isinstance(value, bool), "Not a boolean"
        elif data_type == "int":
            assert isinstance(value, int), "Not an integer"
        elif data_type == "json":
            # Will raise a JSONDecodeError if not a valid JSON
            json.loads(value)
        else:
            assert isinstance(value, (str, unicode)), "Not a string"
            if data_type in ("string", "text"):
                pass
            elif data_type == "scalar":
                assert value in pref_data.get("scalar_values", ()), (
                    "value not allowed: " + value)
            elif data_type == "url":
                condition = False
                parsed_val = urlparse(value)
                val = parsed_val.netloc
                while not condition:
                    # Whilst not an address, requested feature
                    if value in ("*",):
                        condition = True
                        break
                    elif not bool(parsed_val.scheme):
                        # Must have a scheme, as defined a definition of a URI
                        break
                    elif not val.strip():
                        # No empty strings allowed
                        break
                    elif is_valid_ipv4_address(val):
                        condition = True
                        break
                    elif is_valid_ipv6_address(val):
                        condition = True
                        break
                    else:
                        # Must be a regular URL then. TODO: Check that the location has a DNS record
                        condition = True
                        break
                assert condition, "Not a valid URL. Must follow the specification of a URI."
            elif data_type == "email":
                from pyisemail import is_email
                assert is_email(value), "Not an email"
            elif data_type == "locale":
                pass  # TODO
            elif data_type == "permission":
                assert value in ASSEMBL_PERMISSIONS
            elif data_type == "role":
                if value not in SYSTEM_ROLES:
                    from .auth import Role
                    assert self.db.query(Role).filter_by(
                        name=value).count() == 1, "Unknown role"
            elif data_type == "domain":
                from pyisemail.validators.dns_validator import DNSValidator
                v = DNSValidator()
                assert v.is_valid(value), "Not a valid domain"
                value = value.lower()
            else:
                raise RuntimeError("Invalid data_type: " + data_type)
        return value

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
            user_id, duplicate_handling=None, jsonld=None):
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

    crud_permissions = CrudPermissions(create=P_SYSADMIN, update=P_ADMIN_DISC)

    # This defines the allowed properties and their data format
    # Each preference metadata has the following format:
    # id (the key for the preference as a dictionary)
    # name (for interface)
    # description (for interface, hover help)
    # value_type: given by the following grammar:
    #       base_type = (bool|json|int|string|text|scalar|address|url|email|domain|locale|langstr|permission|role)
    #       type = base_type|list_of_(type)|dict_of_(base_type)_to_(type)
    #   more types may be added, but need to be added to both frontend and backend
    # show_in_preferences: Do we always hide this preference?
    # modification_permission: What permission do you need to change that preference?
    #   (default: P_DISCUSSION_ADMIN)
    # allow_user_override: Do we allow users to have their personal value for that permission?
    #   if so what permission is required? (default False)
    # scalar_values: "{value: "label"}" a dictionary of permitted options for a scalar value type
    # default: the default value
    # item_default: the default value for new items in a list_of_T... or dict_of_BT_to_T...

    preference_data_list = [
        # Languages used in the discussion.
        {
            "id": "preferred_locales",
            "value_type": "list_of_locale",
            "name": _("Languages used"),
            "description": _("All languages expected in the discussion"),
            "allow_user_override": None,
            "item_default": "en",
            "default": [strip_country(x) for x in config.get_config().get(
                'available_languages', 'fr en').split()]
        },
        # Whether the discussion uses the new React landing page
        {
            "id": "landing_page",
            "value_type": "bool",
            "name": _("Use landing page"),
            "description": _("Are users directed to the landing page and phases at login, or diretly to the debate"),
            "allow_user_override": None,
            "default": False,
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
                "NIM": _("Navigation, Idea, Messages"),
                "NMI": _("Navigation, Messages, Idea")},
            "description": _("Order of panels"),
            "allow_user_override": P_READ,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": "NMI"
        },

        # Parameters for frontend settings, for experimentation purposes.
        # What is put there should become separate parameters for typechecking
        {
            "id": "extra_json",
            "name": _("Extra JSON parameters"),
            "value_type": "json",
            "description": _("Parameters for quick frontend settings"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            "default": {}
        },

        # Discussion terms of use
        {
            "id": "terms_of_use_url",
            "name": _("Terms of use URL"),
            "value_type": "url",
            "description": _("URL of a document presenting terms of use for the discussion"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            "default": None
        },

        # Discussion Video
        {
            "id": "video_url",
            "name": _("Video URL"),
            "value_type": "url",
            "description": _("URL of a video presenting the discussion"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            "default": None
        },

        # Title in the tab
        {
            "id": "tab_title",
            "name": _("Tab title"),
            "value_type": "string",
            "description": _("Title which appears on the tab, by default assembl"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            "default": ""
        },

        # Discussion Video description
        {
            "id": "video_description",
            "name": _("Video description"),
            "value_type": "dict_of_locale_to_text",
            "description": _("Description of the video presenting the discussion"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            "default": None
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

        # Public or private social Sharing
        {
            "id": "private_social_sharing",
            "name": _("Private social sharing"),
            "value_type": "bool",
            "description": _("Publicizing or privatizing social sharing"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            "default": True,
        },

        # Show generic error message
        {
            "id": "generic_errors",
            "name": _("Generic Errors"),
            "value_type": "bool",
            "description": _("Display a generic error message."),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            "default": config.get_config().get('assembl.generic_errors'),
        },

        # Extra data from social fields to put in CSV reports
        {
            "id": "extra_csv_data",
            "name": _("Extra data for CSV reports"),
            "value_type": "dict_of_string_to_langstr",
            # "scalar_values": {value: "label"},
            "description": _("data taken from social_auth's extra_data to add to CSV reports"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            "backend_validator_function": "assembl.models.social_data_extraction.validate_json_paths",
            "item_default": {"": {"en": ""}},
            "default": {}  # for development
        },

        # Require virus check
        {
            "id": "requires_virus_check",
            "name": _("Require anti-virus check"),
            "value_type": "bool",
            # "scalar_values": {value: "label"},
            "description": _("Run an anti-virus on file attachments"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": False  # for development
        },

        {
            "id": "authorization_server_backend",
            "value_type": "scalar",
            "scalar_values": {
                "": _("No special authentication"),
            },
            "name": _(
                "Authentication service type"),
            "description": _(
                "A primary authentication server for this discussion, defined "
                "as a python-social-auth backend. Participants will be "
                "auto-logged in to that server, and discussion auto-"
                "subscription will require an account from this backend."),
            "allow_user_override": None,
            "modification_permission": P_SYSADMIN,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": ""
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

        # Does the Idea panel automatically open when an idea is clicked? (and close when a special section is clicked)
        {
            "id": "idea_panel_opens_automatically",
            "name": _("Idea panel opens automatically"),
            "value_type": "bool",
            # "scalar_values": {value: "label"},
            "description": _(
                "Does the Idea panel automatically open when an idea is clicked ? (and close when a special section is clicked)"),
            "allow_user_override": P_READ,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": True
        },

        # What are (ordered) identifiers of columns in multi-column views?
        {
            "id": "default_column_identifiers",
            "name": _("Ids of columns in column view"),
            "value_type": "list_of_string",
            "description": _(
                "What are (ordered) identifiers of columns in multi-column views?"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "item_default": "",
            "default": ["positive", "negative"],
        },

        # What are default theme colors of columns in multi-column view
        {
            "id": "default_column_colors",
            "name": _("Default colors of columns in column view"),
            "value_type": "dict_of_string_to_string",
            "description": _(
                "What are (default) theme colors of columns in multi-column views?"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": {"positive": "green", "negative": "red"},
        },

        # What are (default) names of columns in multi-column views, in each discussion language?
        {
            "id": "default_column_names",
            "name": _("Names of columns in column view"),
            "value_type": "dict_of_string_to_langstr",
            "description": _(
                "What are (default) names of columns in multi-column views, in each discussion language?"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": {"negative": {"en": "Negative", "fr": "Négatif"}, "positive": {"en": "Positive", "fr": "Positif"}},
            "item_default": {"": {"en": ""}},
        },

        # The specification of the default permissions for a discussion
        {
            "id": "default_permissions",
            "name": _("Default permissions"),
            "value_type": "dict_of_role_to_list_of_permission",
            "show_in_preferences": False,
            "description": _(
                "The basic permissions for a new discussion"),
            "allow_user_override": None,
            "modification_permission": P_SYSADMIN,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "item_default": {
                R_PARTICIPANT: [P_READ],
            },
            "default": {
                R_ADMINISTRATOR: [
                    P_ADD_EXTRACT,
                    P_ADD_IDEA,
                    P_ADD_POST,
                    P_ADMIN_DISC,
                    P_DELETE_MY_POST,
                    P_DELETE_POST,
                    P_DISC_STATS,
                    P_EDIT_EXTRACT,
                    P_EDIT_IDEA,
                    P_EDIT_MY_EXTRACT,
                    P_EDIT_MY_POST,
                    P_EDIT_POST,
                    P_EDIT_SYNTHESIS,
                    P_EXPORT_EXTERNAL_SOURCE,
                    P_MANAGE_RESOURCE,
                    P_MODERATE,
                    P_OVERRIDE_SOCIAL_AUTOLOGIN,
                    P_SEND_SYNTHESIS,
                    P_VOTE,
                ],
                R_CATCHER: [
                    P_ADD_EXTRACT,
                    P_ADD_IDEA,
                    P_ADD_POST,
                    P_DELETE_MY_POST,
                    P_EDIT_EXTRACT,
                    P_EDIT_IDEA,
                    P_EDIT_MY_EXTRACT,
                    P_EDIT_MY_POST,
                    P_OVERRIDE_SOCIAL_AUTOLOGIN,
                    P_VOTE,
                ],
                R_MODERATOR: [
                    P_ADD_EXTRACT,
                    P_ADD_IDEA,
                    P_ADD_POST,
                    P_DELETE_MY_POST,
                    P_DELETE_POST,
                    P_DISC_STATS,
                    P_EDIT_EXTRACT,
                    P_EDIT_IDEA,
                    P_EDIT_MY_EXTRACT,
                    P_EDIT_MY_POST,
                    P_EDIT_POST,
                    P_EDIT_SYNTHESIS,
                    P_EXPORT_EXTERNAL_SOURCE,
                    P_MANAGE_RESOURCE,
                    P_MODERATE,
                    P_OVERRIDE_SOCIAL_AUTOLOGIN,
                    P_SEND_SYNTHESIS,
                    P_VOTE,
                ],
                R_PARTICIPANT: [
                    P_ADD_POST,
                    P_DELETE_MY_POST,
                    P_EDIT_MY_POST,
                    P_VOTE,
                ],
                Authenticated: [
                    P_SELF_REGISTER,
                ],
                Everyone: [
                    P_READ,
                    P_READ_PUBLIC_CIF,
                ],
            },
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

        # Allow whitelist to be applied to SSO login process
        {
            "id": "whitelist_on_authentication_backend",
            "name": _("Whitelist on authentication service"),
            "value_type": "bool",
            # "scalar_values": {value: "label"},
            "description": _(
                "Allow white list to be applied to the authentication service chosen"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": False
        },

        # Allow whitelist to be applied to the regular login process
        {
            "id": "whitelist_on_register",
            "name": _("Whitelist on standard registration"),
            "value_type": "bool",
            # "scalar_values": {value: "label"},
            "description": _(
                "Allow white list to be applied to the default login process"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": True
        },

        # A discussion administrator, if different from the server administrator
        {
            "id": "discussion_administrators",
            "name": _("Discussion administrators"),
            "value_type": "list_of_email",
            # "scalar_values": {value: "label"},
            "description": _(
                "A list of discussion administrators, if different from the server administrator"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": False
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
        # This is a hash where keys are ideas ids, and values are booleans.
        # We could use dict_of_string_to_bool, but that would clutter the interface.
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

        # The specification of the preference data
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
        },

        # The specification of the cookies banner
        {
            "id": "cookies_banner",
            "name": _("Cookies banner"),
            "value_type": "bool",
            "show_in_preferences": True,
            "description": _(
                "Show the banner offering to disable Piwik cookies"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            # "frontend_validator_function": func_name...?,
            # "backend_validator_function": func_name...?,
            "default": True  # this should be recursive...
        },

        # Custom HTML code that will be integrated on the landing page of the debate, right after the <body> tag
        {
            "id": "custom_html_code_landing_page",
            "name": _("Custom HTML code on the landing page"),
            "value_type": "text",
            "show_in_preferences": True,
            "description": _(
                "Custom HTML code that will be integrated on the landing page of the debate, right after the <body> tag"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            "default": None
        },

        # Custom HTML code that will be integrated on the user registration page of the debate, right after the <body> tag
        {
            "id": "custom_html_code_user_registration_page",
            "name": _("Custom HTML code on the user registration page"),
            "value_type": "text",
            "show_in_preferences": True,
            "description": _(
                "Custom HTML code that will be integrated on the user registration page of the debate, right after the <body> tag"),
            "allow_user_override": None,
            "modification_permission": P_ADMIN_DISC,
            "default": None
        },

        # Harvesting translation
        {
            "id": "harvesting_translation",
            "name": _("Harvesting translation"),
            "value_type": "dict_of_string_to_string",
            "show_in_preferences": True,
            "description": _("Harvesting translation"),
            "allow_user_override": P_READ,
            "default": None
        },

        # Valid CORS paths
        {
            "id": "graphql_valid_cors",
            "name": _("Valid CORS paths for GraphQL API calls"),
            "value_type": "list_of_url",
            "show_in_preferences": True,
            "description": _("A list of valid domain names or IP addresses that are allowed to make CORS api calls to the GraphQL API"),
            "allow_user_override": False,
            "default": [],
            "item_default": ""
        },

    ]

    # Precompute, this is not mutable.
    preference_data_key_list = [p["id"] for p in preference_data_list]
    preference_data_key_set = set(preference_data_key_list)
    preference_data = {p["id"]: p for p in preference_data_list}


def includeme(config):
    """Initialize some preference values"""
    Preferences.init_from_settings(config.get_settings())
