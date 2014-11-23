'use strict';

define(['backbone.marionette'], function (Marionette) {

    var sidebarNotification = Marionette.ItemView.extend({
        template: '#tmpl-sidebar-notification'
    });

    return sidebarNotification;
});