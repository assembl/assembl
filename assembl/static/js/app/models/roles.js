'use strict';

var Base = require('./base.js'),
    Ctx = require('../common/context.js');

var roleModel = Base.Model.extend({
    urlRoot: Ctx.getApiV2DiscussionUrl("/all_users/" + Ctx.getCurrentUserId() + "/local_roles"),

    defaults: {
        'requested': false,
        'discussion': null,
        'role': null,
        'user': null,
        '@id': null,
        '@type': null,
        '@view': null
    },

    isUserSubscribed: function () {
        return (this.get('discussion') === null) ? false : true;
    },

    validate: function(attrs, options){
        /**
         * check typeof variable
         * */

    }

});

var roleCollection = Base.Collection.extend({
    url: Ctx.getApiV2DiscussionUrl("/all_users/" + Ctx.getCurrentUserId() + "/local_roles"),
    model: roleModel
});

module.exports = {
    Model: roleModel,
    Collection: roleCollection
};
