define(function (require) {

    var Marionette = require('backbone.marionette');

    var sidebarNotification = Marionette.ItemView.extend({
        template: '#tmpl-sidebar-notification'
    });

    return sidebarNotification;
});