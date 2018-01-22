"""Utility modules for permissions and authentication

This module defines basic roles and permissions."""

from pyramid.security import Everyone, Authenticated


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
P_READ_PUBLIC_CIF = 'read_public_cif'
P_ADD_POST = 'add_post'
P_EDIT_POST = 'edit_post'
P_EDIT_MY_POST = 'edit_my_post'
P_DELETE_POST = 'delete_post'
P_DELETE_MY_POST = 'delete_my_post'
P_VOTE = 'vote'
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
P_EXPORT_EXTERNAL_SOURCE = 'export_post'
P_MODERATE = 'moderate_post'
P_DISC_STATS = 'discussion_stats'
P_MANAGE_RESOURCE = 'manage_resource'
P_OVERRIDE_SOCIAL_AUTOLOGIN = 'override_autologin'

IF_OWNED = "IF_OWNED"

ASSEMBL_PERMISSIONS = set((
    P_READ, P_ADD_POST, P_EDIT_POST, P_EDIT_MY_POST, P_DELETE_POST, P_DELETE_MY_POST,
    P_VOTE, P_ADD_EXTRACT, P_EDIT_EXTRACT,
    P_EDIT_MY_EXTRACT, P_ADD_IDEA, P_EDIT_IDEA, P_EDIT_SYNTHESIS,
    P_SEND_SYNTHESIS, P_SELF_REGISTER, P_SELF_REGISTER_REQUEST,
    P_ADMIN_DISC, P_SYSADMIN, P_READ_PUBLIC_CIF, P_OVERRIDE_SOCIAL_AUTOLOGIN,
    P_EXPORT_EXTERNAL_SOURCE, P_MODERATE, P_DISC_STATS, P_MANAGE_RESOURCE))


class CrudPermissions(object):
    """A set of permissions required to Create, Read, Update or Delete
    an instance of a given class

    The :py:attr:`crud_permissions` class attribute of a model class
    should hold an instance of this class.
    Special permissions can be defined if you *own* this
    instance, according to :py:meth:`assembl.lib.sqla.BaseOps.is_owned`"""
    __slots__ = ('create', 'read', 'update', 'delete',
                 'read_owned', 'update_owned', 'delete_owned')

    CREATE = 1
    READ = 2
    UPDATE = 3
    DELETE = 4

    def __init__(self, create=None, read=None, update=None, delete=None,
                 update_owned=None, delete_owned=None, read_owned=None):
        self.create = create or P_SYSADMIN
        self.read = read or P_READ
        self.update = update or create or P_SYSADMIN
        self.delete = delete or P_SYSADMIN
        self.read_owned = read_owned or self.read
        self.update_owned = update_owned or self.update
        self.delete_owned = delete_owned or self.delete

    def can(self, operation, permissions):
        if P_SYSADMIN in permissions:
            return True
        needed, needed_owned = self.crud_permissions(operation)
        if needed in permissions:
            return True
        elif needed_owned in permissions:
            return IF_OWNED
        return False

    def crud_permissions(self, operation):
        if operation == self.CREATE:
            return (self.create, self.create)
        elif operation == self.READ:
            return (self.read, self.read_owned)
        elif operation == self.UPDATE:
            return (self.update, self.update_owned)
        elif operation == self.DELETE:
            return (self.delete, self.delete_owned)
        else:
            raise ValueError()


def includeme(config):
    config.include('.social_auth')
    config.include('.generic_auth_backend')
