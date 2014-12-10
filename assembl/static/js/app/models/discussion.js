'use strict';

define(['models/base', 'common/context'], function (Base, Ctx) {

    var discussionModel = Base.Model.extend({
        urlRoot: '/api/v1/discussion/' + Ctx.getDiscussionId(),
        idAttribute: "@id",
        defaults: {
            'instigator': null,
            'introduction': null,
            'objectives': null,
            'creation_date': null,
            'topic': null,
            'sources': [],
            '@type': null,
            'widget_collection_url': null,
            'slug': null,
            '@view': null
        }

    });

    var discussionCollection = Base.Collection.extend({
        url: '/api/v1/discussion/' + Ctx.getDiscussionId(),
        model: discussionModel
    });

    return {
        Model: discussionModel,
        Collection: discussionCollection
    };
});