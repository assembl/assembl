'use strict';

var Base = require('./base.js'),
    $ = require('../shims/jquery.js'),
    Ctx = require('../common/context.js');

var tourModel = Base.Model.extend({
  constructor: function tourModel() {
    Base.Model.apply(this, arguments);
  },

    urlRoot: Ctx.getApiV2DiscussionUrl('user_ns_kv/tour_seen'),
    defaults: {
        on_start: false,
        on_show_synthesis: false
    },
    clear: function() {
      this.delete();
    },
    isSeen: function(name) {
      var that = this;
      if (!this.get(name)) {
        $.ajax(this.urlRoot + '/' + name, {
          data: 'true',
          contentType: 'application/json',
          method: 'PUT',
          complete: function() {
            that.set(name, true);
          }});
      }
    },
    fetch: function (options) {
      options = options || {};
      options.cache = false; // for IE cache (GET -> PUT -> GET) http://stackoverflow.com/questions/6178366/backbone-js-fetch-results-cached/8966486#8966486
      return Backbone.Collection.prototype.fetch.call(this, options);
    }
});

module.exports = {
    Model: tourModel
};
