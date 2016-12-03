'use strict';
/**
 * 
 * @module app.views.admin.adminNavigationMenu
 */

var Marionette = require('../../shims/marionette.js'),
    $ = require('jquery'),
    i18n = require('../../utils/i18n.js'),
    Permissions = require('../../utils/permissions.js'),
    Ctx = require('../../common/context.js');

var adminNavigationMenu = Marionette.LayoutView.extend({
  constructor: function adminNavigationMenu() {
    Marionette.LayoutView.apply(this, arguments);
  },

  tagName: 'nav',
  className: 'sidebar-nav',
  selectedSection: undefined,

  initialize: function(options) {
    if ( "selectedSection" in options ){
      this.selectedSection = options.selectedSection;
    }
  },

  serializeData: function() {
    return {
      selectedSection: this.selectedSection,
      is_sysadmin: Ctx.getCurrentUser().can(Permissions.SYSADMIN),
    };
  },

  templateHelpers: function() {
    return {
      urlDiscussion: function() {
        return '/' + Ctx.getDiscussionSlug() + '/';
      }
    }
  }
});

var discussionAdminNavigationMenu = adminNavigationMenu.extend({
  constructor: function discussionAdminNavigationMenu() {
    adminNavigationMenu.apply(this, arguments);
  },
  template:  '#tmpl-discussionAdminNavigationMenu',
});

var globalAdminNavigationMenu = adminNavigationMenu.extend({
  constructor: function globalAdminNavigationMenu() {
    adminNavigationMenu.apply(this, arguments);
  },
  template:  '#tmpl-globalAdminNavigationMenu',
});

module.exports = {
  discussionAdminNavigationMenu: discussionAdminNavigationMenu,
  globalAdminNavigationMenu: globalAdminNavigationMenu,
};
