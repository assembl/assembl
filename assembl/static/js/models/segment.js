define(['backbone', 'app', 'moment'], function(Backbone, app, moment){
    'use strict';

    /**
     * @class SegmentModel
     */
    var SegmentModel = Backbone.Model.extend({

        /**
         * @init
         */
        initialize: function(){
            if( !this.get('author') ){
                this.set( 'author', app.getCurrentUser() );
            }

            if( !this.get('creationDate') ){
                this.set( 'creationDate', app.getCurrentTime() );
            }
        },

        /**
         * @type {String}
         */
        url: "/static/js/tests/fixtures/segment.json",

        /**
         * @type {Object}
         */
        defaults: {
            text: '',
            idPost: null,
            creationDate: null,
            author: null
        },

        /**
         * Returns a fancy date ( ex: a few seconds ago ) 
         * @return {string} [description]
         */
        getCreationDateFormated: function(){
            return moment( this.get('creationDate') ).fromNow();
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
