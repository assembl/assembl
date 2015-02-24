'use strict';

define(['models/base', 'common/context'], function (Base, Ctx) {

    var discussionModel = Base.Model.extend({
        url: Ctx.getApiV2DiscussionUrl(),
        defaults: {
            'settings': {},
            'introduction': '',
            'objectives': '',
            'creation_date': '',
            'topic': '',
            'introductionDetails': '',
            '@type': '',
            'widget_collection_url': '',
            'slug': '',
            '@view': '',
            'permissions': {},
            'subscribe_to_notifications_on_signup': false
        },
        validate: function(attrs, options){
            /**
             * check typeof variable
             * */

        }

    });

    var discussionCollection = Base.Collection.extend({
        url: Ctx.getApiV2DiscussionUrl(),
        model: discussionModel
    });

    return {
        Model: discussionModel,
        Collection: discussionCollection
    };
});