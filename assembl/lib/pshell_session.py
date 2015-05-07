import sys

from pyramid.paster import get_appsettings
from sqla import get_session_maker, configure_engine

# an implicit session for pshell
app_settings = get_appsettings(sys.argv[1], 'assembl')
configure_engine(app_settings, False)
db = get_session_maker()
