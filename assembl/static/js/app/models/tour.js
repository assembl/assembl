'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js');

var actionModel = Base.Model.extend({
    urlRoot: Ctx.getApiV2DiscussionUrl('user_ns_kv/tour_seen'),
    defaults: {

    }
});

module.exports = {
    Model: actionModel
};
