'use strict';


var Permissions = {
    READ: "read",
    READ_PUBLIC_CIF: "read_public_cif",
    SELF_REGISTER: "self_register",
    ADD_POST: "add_post",
    EDIT_POST: "edit_post",
    VOTE: "vote",
    ADD_EXTRACT: "add_extract",
    EDIT_EXTRACT: "edit_extract",
    EDIT_MY_EXTRACT: "edit_my_extract",
    ADD_IDEA: "add_idea",
    EDIT_IDEA: "edit_idea",
    EDIT_SYNTHESIS: "edit_synthesis",
    SEND_SYNTHESIS: "send_synthesis",
    ADMIN_DISCUSSION: "admin_discussion",
    SYSADMIN: "sysadmin"
};

module.exports = Permissions;
/*
 * Comment distinguer le cas où on n'a pas la permission:
 * ex: app.currentUser.can(Permissions.ADD_POST)
 * du cas ou l'usager est anonyme (déconnecté):
 * Ctx.getCurrentUser().isUnknownUser()
 */

