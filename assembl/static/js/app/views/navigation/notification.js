'use strict';
/**
 * 
 * @module app.views.navigation.notification
 */

var Marionette = require('../../shims/marionette.js');

var sidebarNotification = Marionette.ItemView.extend({
  constructor: function sidebarNotification() {
    Marionette.ItemView.apply(this, arguments);
  },

  template: '#tmpl-sidebar-notification'
});

module.exports = sidebarNotification;
