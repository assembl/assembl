'use strict';

define(['models/base', 'common/context'], function (Base, Ctx) {

    var sourceModel = Base.Model.extend({
        urlRoot: Ctx.getApiV2DiscussionUrl()+'sources',
        idAttribute: '@id',
        defaults: {
            'name': null,
            'admin_sender': null,
            'post_email_address': null,
            'creation_date': null,
            'host': null,
            'discussion_id': null,
            '@type': null,
            'folder': null,
            '@id': null,
            'port': null
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