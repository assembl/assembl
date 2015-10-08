'use strict';

var Marionette = require('../../shims/marionette.js'),
    $ = require('../../shims/jquery.js'),
    i18n = require('../../utils/i18n.js'),
    Ctx = require('../../common/context.js');

var userNavigationMenu = Marionette.LayoutView.extend({
  template: '#tmpl-userNavigationMenu',
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
      selectedSection: this.selectedSection
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

module.exports = userNavigationMenu;
