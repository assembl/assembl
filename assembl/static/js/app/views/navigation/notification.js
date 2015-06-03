'use strict';

var Marionette = require('../../shims/marionette.js');

var sidebarNotification = Marionette.ItemView.extend({
    template: '#tmpl-sidebar-notification'
});

module.exports = sidebarNotification;
