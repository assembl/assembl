Permissions and roles architecture
==================================

How the roles & permissions system works in Assembl
---------------------------------------------------

A **role** is a named set of permissions. Some roles exist by default in
the discussion. Administrators can assign a role to a user.

There are global roles and per-discussion (or local) roles: a user can have a role
either globally in Assembl or in the context of a given discussion.
A global role gives its related permissions to the user in all discussions.
A per-discussion role gives its related permissions to the user in this discussion only.

You can change a role’s permissions and so change what it allows to do and
its meaning. You can create a role which gives a given set of
permissions you choose, and choose its name. And then you can assign
this new role to some users.

A **permission** authorizes a user who has this permission to do
something. To have this permission, the user must have a role which
gives this permission. The list of permissions is fixed: you can’t
create a new permission or remove an existing one, you can only add or
remove a permission to/from a role.

The ``r:sysadmin`` role always has all permissions.

For a given discussion, only users who have the ``admin_discussion`` permission in this discussion can edit the list of permissions associated to each role, as well as the roles users have.
Only users who have the ``sysadmin`` permission can edit the list of global roles associated to each user.


Explanation of each permission
------------------------------

-  ``read``: Allows accessing the contents of the discussion, reading ideas and
   messages
-  ``add_post``: Allows the user to post a new message from the Assembl
   interface (reply to someone, comment on an idea)
-  ``edit_post``: No one should have this yet, Post objects are supposed
   to be immutable. (It will make sense when we have mutable posts.)
-  ``edit_synthesis``: Allows editing the next synthesis
-  ``send_synthesis``: Allows publishing the next synthesis
-  ``add_idea``: Allows creating a new idea
-  ``edit_idea``: Allows editing the attributes of any idea (title,
   description, position in the table of ideas), but not the expression in the next
   synthesis
-  ``self_register``: Allows the user to become member of the discussion
   on his own, which gives the “participant” role.
-  ``self_register_req``: NOT CURRENTLY IMPLEMENTED. Will allows the
   user to ASK a moderator to become member of the discussion.
-  ``vote``: Allows voting on ideas
-  ``read_public_cif``: Allows generating CIF exports of the discussion
   (without user information). (CIF is a file format. It has been defined by the Catalyst consortium, and is used for interoperability between Catalyst applications)
-  ``sysadmin``: This permission only makes sense at the global (not
   discussion) level. Allows just about all operations. Very, very few
   people should have this.
-  ``admin_discussion``: More or less the equivalent of sysadmin on a
   discussion level. Allows most operations on a discussion. Normally,
   only people who need to assign roles and permissions should have
   this.
-  ``add_extract``: Allows creating a new extract
-  ``edit_my_extract``: Allows editing your own extracts
-  ``edit_extract``: Allows editing everyone’s extracts
-  ``delete_my_post``: Allows a user to delete their own message. It will show as "This message has been deleted by its author" if the "Show deleted messages" or the "Show also deleted messages" filter is active, or if the message has a non-deleted direct or indirect answer. It will not be counted in the number of messages in the idea or in the discussion.
-  ``delete_post``: Allows a user to delete any message (including messages posted by someone else). It will show as "This message has been deleted by an administrator" if the "Show deleted messages" or the "Show also deleted messages" filter is active, or if the message has a non-deleted direct or indirect answer. It will not be counted in the number of messages in the idea or in the discussion.
-  ``discussion_stats``: Allow to access discussion statistics
-  ``export_post``: TODO document (Aryan)
-  ``moderate_post``: Allows a user to moderate a message, by editing its contents or hiding its contents. A moderated message does not disappear from the messageList and can be visually differentiated from a non-moderated message.
- ``override_social_autologin``: Allow a user to access a discussion with a social autologin even if they don't have an account with that social login (i.e. allow them to login using another account.)
- ``manage_resource``: TODO document (Cédric)
