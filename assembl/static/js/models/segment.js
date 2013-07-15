define(['backbone', 'app', 'moment', 'models/user'], function(Backbone, app, moment, User){
    'use strict';

    /**
     * @class SegmentModel
     */
    var SegmentModel = Backbone.Model.extend({

        /**
         * @init
         */
        initialize: function(){
            var author = this.get('author');

            if( !this.id ){
                this.id = app.createUUID();
                this.attributes.id = this.id;
            }

            if( !author ){
                this.set( 'author', app.getCurrentUser() );
            } else if( author.constructor !== User.Model ){
                this.set( 'author', new User.Model(author) );
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
            idIdea: null,
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
