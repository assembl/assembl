'use strict';

define(function () {

    var Roles = {
        EVERYONE: 'system.Everyone',
        // AUTHENTICATED: 'system.Authenticated', never seen by frontend
        PARTICIPANT: 'r:participant',
        CATCHER: 'r:catcher',
        MODERATOR: 'r:moderator',
        ADMINISTRATOR: 'r:administrator',
        SYSADMIN: 'r:sysadmin'
    };

    return Roles;
});
