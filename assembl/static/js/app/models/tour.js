'use strict';

var Base = require('./base.js'),
    $ = require('../shims/jquery.js'),
    Ctx = require('../common/context.js');

var tourModel = Base.Model.extend({
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
    }
});

module.exports = {
    Model: tourModel
};
