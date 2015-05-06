'use strict';

define(['models/base', 'common/context', 'jquery'], function (Base, Ctx, $) {

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
        },
        validate: function(attrs, options){
            /**
             * check typeof variable
             * */

        },
        doReimport: function() {
            var url = this.url() + '/fetch_posts';
            return $.post(url, {reimport: true});
        },
        doReprocess: function() {
            var url = this.url() + '/fetch_posts';
            return $.post(url, {reprocess: true});
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
