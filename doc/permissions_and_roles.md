# How the roles & permissions system works in Assembl

A **role** is a named set of permissions. Some roles exist by default in the discussion. You can assign a role to a user. A user can have a role either globally in Assembl or in the context of a given discussion. You can change a role’s permissions and so change what it allows to do and its meaning. You can create a role which gives a given set of permissions you choose, and choose its name. And then you can assign this new role to some users. 

A **permission** authorizes a user who has this permission to do something. 
To have this permission, the user must have a role which gives this 
permission. The list of permissions is fixed: you can’t create a new permission or remove an existing one, you can only add or remove a permission to/from a role.

# Explanation of each permission

* `read`: Allows generic access to the discussion, reading ideas and messages
* `add_post`: Allows the user to post a new message from the Assembl interface (reply to someone, comment on an idea)
* `edit_post`: No one should have this yet, Post objects are supposed to be immutable. (It will make sense when we have mutable posts.)
* `edit_synthesis`: Allows editing the next synthesis
* `send_synthesis`: Allows publishing the next synthesis
* `add_idea`: Allows creating a new idea
* `edit_idea`: Allows editing the attributes of any idea (titles, description, reparenting), but not the expression in the next synthesis
* `self_register`: Allows the user to become member of the discussion on his own, which gives the “participant” role.
* `self_register_req`: NOT CURRENTLY IMPLEMENTED.  Will allows the user to ASK a moderator to become member of the discussion.
* `vote`: Allows voting on ideas
* `read_public_cif`: Allows generating CIF exports of the discussion (without user information.)
* `sysadmin`: This permission only makes sense at the global (not discussion) level.  Allows just about all operations.  Very, very few people should have this.
* `admin_discussion`: More or less the equivalent of sysadmin on a discussion level.  Allows most operations on a discussion.  Normally, only people who need to assign roles and permissions should have this.
* `add_extract`: Allows creating a new extract
* `edit_my_extract`: Allows editing your own extracts
* `edit_extract`: Allows editing everyone’s extracts
