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
P_ADMIN_DISC = 'admin_discussion'
P_SYSADMIN = 'sysadmin'
