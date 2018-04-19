"""Initial objects for the pshell sessions"""
import sys

from pyramid.paster import get_appsettings
from sqla import get_session_maker, configure_engine
from assembl.lib.config import set_config as _set_config

# an implicit session for pshell
app_settings = get_appsettings(sys.argv[1], 'assembl')
_set_config(app_settings)
configure_engine(app_settings, False)
db = get_session_maker()
