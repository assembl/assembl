'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js');

var tourModel = Base.Model.extend({
    urlRoot: Ctx.getApiV2DiscussionUrl('user_ns_kv/tour_seen'),
    defaults: {
        on_start: false,
        on_show_synthesis: false
    }
});

module.exports = {
    Model: tourModel
};
