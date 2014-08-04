define(function (require) {

    var Marionette = require('marionette');

    var sidebarNotification = Marionette.ItemView.extend({
        template:'#tmpl-sidebar-notification'
    });

    return sidebarNotification;
});