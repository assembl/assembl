'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js');

var actionModel = Base.Model.extend({
    urlRoot: Ctx.getApiV2DiscussionUrl("/all_users/current/actions"),

    defaults: {
        target: null,
        user: null,
        target_type: "Content",
        '@id': null,
        '@type': null,
        '@view': null
    },

    validate: function(attrs, options){
        /**
         * check typeof variable
         * */

    }

});

var actionCollection = Base.Collection.extend({
    url: Ctx.getApiV2DiscussionUrl("/all_users/current/actions"),
    model: actionModel
});

module.exports = {
    Model: actionModel,
    Collection: actionCollection
};
