'use strict';

define(['models/base', 'common/context'], function (Base, Ctx) {

    var sourceModel = Base.Model.extend({
        urlRoot: Ctx.getApiV2DiscussionUrl()+'sources',
        defaults: {
            'name': '',
            'admin_sender': '',
            'post_email_address': '',
            'creation_date': '',
            'host': '',
            'discussion_id': '',
            '@type': '',
            'folder': '',
            'use_ssl': false,
            'port': 0
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