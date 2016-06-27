'use strict';
/**
 * 
 * @module app.views.authorization
 */

var Marionette = require('../shims/marionette.js'),
    Ctx = require('../common/context.js');

var authorization = Marionette.ItemView.extend({
  constructor: function authorization() {
    Marionette.ItemView.apply(this, arguments);
  },

  template: '#tmpl-authorization',
  className: 'authorization',
  initialize: function(options) {
    this.error = options.error;
    this.message = options.message;
  },
  serializeData: function() {
      return {
        error: this.error,
        message: this.message
      }
    },
  templateHelpers: function() {
    return {
      urlLogIn: function() {
        return '/login?next=/' + Ctx.getDiscussionSlug() + '/';
      }
    }
  }
});

module.exports = authorization;
