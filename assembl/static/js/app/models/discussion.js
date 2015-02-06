'use strict';

define(['models/base', 'common/context'], function (Base, Ctx) {

    var discussionModel = Base.Model.extend({
        url: Ctx.getApiV2DiscussionUrl(),
        defaults: {
            'settings': {},
            'introduction': null,
            'objectives': null,
            'creation_date': null,
            'topic': null,
            'sources': [],
            'introductionDetails': null,
            '@type': null,
            'widget_collection_url': null,
            'slug': null,
            '@view': null,
            'permissions': {}
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