from pyramid.security import (
    Everyone, Authenticated, ALL_PERMISSIONS)

# Roles
R_PARTICIPANT = 'r:participant'
R_CATCHER = 'r:catcher'
R_MODERATOR = 'r:moderator'
R_ADMINISTRATOR = 'r:administrator'
R_SYSADMIN = 'r:sysadmin'

SYSTEM_ROLES = set(
    (Everyone, Authenticated, R_PARTICIPANT, R_CATCHER,
     R_MODERATOR, R_ADMINISTRATOR, R_SYSADMIN))

# Permissions
P_READ = 'read'
P_ADD_POST = 'add_post'
P_EDIT_POST = 'edit_post'
P_ADD_EXTRACT = 'add_extract'
P_EDIT_EXTRACT = 'edit_extract'
P_EDIT_MY_EXTRACT = 'edit_my_extract'
P_ADD_IDEA = 'add_idea'
P_EDIT_IDEA = 'edit_idea'
P_EDIT_SYNTHESIS = 'edit_synthesis'
P_SEND_SYNTHESIS = 'send_synthesis'
P_SELF_REGISTER = 'self_register'
P_SELF_REGISTER_REQUEST = 'self_register_req'
P_ADMIN_DISC = 'admin_discussion'
P_SYSADMIN = 'sysadmin'

ASSEMBL_PERMISSIONS = set((
    P_READ, P_ADD_POST, P_EDIT_POST, P_ADD_EXTRACT, P_EDIT_EXTRACT,
    P_EDIT_MY_EXTRACT, P_ADD_IDEA, P_EDIT_IDEA, P_EDIT_SYNTHESIS,
    P_SEND_SYNTHESIS, P_SELF_REGISTER, P_SELF_REGISTER_REQUEST,
    P_ADMIN_DISC, P_SYSADMIN))

class CrudPermissions(object):
    __slots__=('create', 'read', 'update', 'delete',
               'update_owned', 'delete_owned')
    def __init__(self, create=None, read=None, update=None, delete=None,
                 update_owned=None, delete_owned=None):
        self.create = create or P_SYSADMIN
        self.read = read or P_READ
        self.update = update or create or P_SYSADMIN
        self.delete = delete or P_SYSADMIN
        self.update_owned = update_owned or self.update
        self.delete_owned = delete_owned or self.delete
