from sqla import get_session_maker
# an implicit session for pshell
db = get_session_maker(False)
