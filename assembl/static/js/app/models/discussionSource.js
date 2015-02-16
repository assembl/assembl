'use strict';

define(['models/base', 'common/context'], function (Base, Ctx) {

    var sourceModel = Base.Model.extend({
        urlRoot: Ctx.getApiV2DiscussionUrl()+'sources',
        idAttribute: '@id',
        defaults: {
            'name': '',
            'admin_sender': '',
            'post_email_address': '',
            'creation_date': '',
            'host': '',
            'discussion_id': '',
            '@type': '',
            'folder': '',
            '@id': '',
            'port': 0
        },
        validate: function(attrs, options) {

            console.debug(attrs.port, typeof attrs.port);

            if (attrs.port) {
                return parseInt(port);
            }
        }

    });

    var sourceCollection = Base.Collection.extend({
        url: Ctx.getApiV2DiscussionUrl()+'sources',
        model: sourceModel
    });


    return {
        Model: sourceModel,
        Collection: sourceCollection
    };

});