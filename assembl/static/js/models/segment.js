define(['backbone', 'app'], function(Backbone, app){
    'use strict';

    /**
     * @class SegmentModel
     */
    var SegmentModel = Backbone.Model.extend({
        url: "/static/js/tests/fixtures/segment.json",
        defaults: {
            text: ' Alguma coisa ',
            idPost: null,
            date: app.getCurrentTime()
        }
    });

    /**
     * @class SegmentColleciton
     */
    var SegmentCollection = Backbone.Collection.extend({
        url: "/static/js/tests/fixtures/segments.json",
        model: SegmentModel
    });

    return {
        Model: SegmentModel,
        Collection: SegmentCollection
    };

});
