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

from . import Base


class Preferences(Base):
    """
    Cascading preferences
    """
    __tablename__ = "preferences"
    id = Column(Integer, primary_key=True)
    name = Column(CoerceUnicode, nullable=False)
    cascade_id = Column(Integer, ForeignKey(id), nullable=True)
    values = Column(Text())  # JSON blob

    cascade_preferences = relationship(
        "Preferences",
        foreign_keys=[cascade_id]
    )

    @property
    def local_values_json(self):
        values = {}
        if self.values:
            values = json.loads(self.values)
        return values

    @local_values_json.setter
    def local_values_json(self, val):
        self.values = json.dumps(val)

    @property
    def values_json(self):
        if not self.cascade_preferences:
            return self.local_values_json()
        values = self.cascade_preferences.values_json()
        values.update(self.local_values_json())
        return values

    def _get_local(self, property_name):
        if property_name not in self.property_defaults:
            raise RuntimeError("Unknown property:" + property_name)
        values = self.local_values_json()
        if property_name in values:
            value = property_name[values]
            if property_name in self.property_output_fn:
                value = self.property_output_fn[property_name](value)
            return True, value
        return False

    def get_local(self, property_name):
        exists, value = self._get_local(property_name)
        if exists:
            return value

    def get(self, property_name):
        exists, value = self._get_local(property_name)
        if exists:
            return value
        elif self.cascade_preferences:
            return self.cascade_preferences.get(property_name)
        return self.property_defaults.get(property_name, None)

    def delete(self, property_name):
        values = self.local_values_json()
        if property_name in values:
            oldval = values[property_defaults]
            del values[property_defaults]
            self.values_json = json.dumps(values)
            return oldval

    def set(self, property_name, value):
        if property_name not in self.property_defaults:
            raise RuntimeError("Unknown property:" + property_name)
        values = self.local_values_json()
        if property_name in values:
            value = property_name[values]
            if property_name in self.property_output_fn:
                value = self.property_output_fn[property_name](value)
            return value
        elif self.cascade_preferences:
            return self.cascade_preferences.get(property_name)
        return self.property_defaults.get(property_name, None)

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
    }

    # filter some incoming values through a conversion/validation function
    property_input_fn = {
    }

    # filter some outgoing values through a conversion/validation function
    property_output_fn = {
    }
