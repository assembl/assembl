'use strict';

var Marionette = require('backbone.marionette');

var sidebarNotification = Marionette.ItemView.extend({
    template: '#tmpl-sidebar-notification'
});

module.exports = sidebarNotification;
