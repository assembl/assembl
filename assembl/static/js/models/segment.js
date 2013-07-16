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

            this.on('change:idIdea', this.onAttrChange, this);
        },

        /**
         * @type {String}
         */
        url: "/api/segment",

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
         * Returns a fancy date (ex: a few seconds ago) 
         * @return {String}
         */
        getCreationDateFormated: function(){
            return moment( this.get('creationDate') ).fromNow();
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save();
        }
    });

    /**
     * @class SegmentColleciton
     */
    var SegmentCollection = Backbone.Collection.extend({
        /**
         * @type {String}
         */
        url: "/api/segments",

        /**
         * @type {IdeaModel}
         */
        model: SegmentModel
    });

    return {
        Model: SegmentModel,
        Collection: SegmentCollection
    };

});
