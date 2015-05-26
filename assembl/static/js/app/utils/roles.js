'use strict';

var Roles = {
    /* System roles */
    EVERYONE: 'system.Everyone',
    AUTHENTICATED: 'system.Authenticated', //Never received by frontend as current user role
    PARTICIPANT: 'r:participant' //Yes, this is a system role as well now that we can escalate to it using self-register
    // The following Roles are NOT system roles.  No code should depend on them
    /*CATCHER: 'r:catcher',
    MODERATOR: 'r:moderator',
    ADMINISTRATOR: 'r:administrator',
    SYSADMIN: 'r:sysadmin'*/
};

module.exports = Roles;

