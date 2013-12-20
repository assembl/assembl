define(['models/base', 'jquery', 'app'], function(Base, $, app){
    'use strict';

    /**
     * @class MessageModel
     */
    var MessageModel = Base.Model.extend({
        /**
         * @init
         */
        initialize: function(){
            this.on('change:collapsed', this.render, this);
        },

        /**
         * The url
         * @type {String}
         */
        urlRoot: app.getApiUrl('posts'),

        /**
         * Default values
         * @type {Object}
         */
        defaults: {
            collapsed: false,
            checked: false,
            read: true,
            parentId: null,
            subject: null,
            body: null,
            idCreator: null,
            avatarUrl: null,
            date: null
        },

        /**
         * Return all children
         * @return {MessageModel[]}
         */
        getChildren: function(){
            return this.collection.where({ parentId: this.getId() });
        },

        /**
         * Return the parent idea
         * @return {MessageModel}
         */
        getParent: function(){
            return this.collection.findWhere({ '@id': this.get('parentId') });
        },

        /**
         * Return all segments related to this message
         * @return {Segment[]}
         */
        getSegments: function(){
            return app.segmentList.segments.where({ idPost: this.getId() });
        },

        /**
         * Return all segments in the annotator format
         * @return {Object[]}
         */
        getAnnotations: function(){
            var segments = this.getSegments(),
                ret = [];

            _.each(segments, function(segment){
                segment.attributes.ranges = segment.attributes._ranges;
                ret.push( segment.attributes );
            });

            return ret;
        },


        /**
         * Returns the toppest parent
         * @return {MessageModel}
         */
        getRootParent: function(){
            if( this.get('parentId') === null ){
                return null;
            }

            var parent = this.getParent(),
                current = null;

            do {

                if( parent ){
                    current = parent;
                    parent = parent.get('parentId') !== null ? parent.getParent() : null;
                } else {
                    parent = null;
                }

            } while (parent !== null);

            return current;

        },

        /**
         * @return {Number} the indentation level
         */
        getLevel: function(){
            var counter = 0,
                parent = this;

            do {
                
                if( parent ) {
                    parent = parent.get('parentId') !== null ? parent.getParent() : null;
                    counter += 1;
                } else {
                    parent = null;
                }

            } while ( parent !== null );

            return counter;
        },

        /**
         * Returns the post's creator
         * @return {User}
         */
        getCreator: function(){
            var creatorId = this.get('idCreator');
            return app.users.getById(creatorId);
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save();
        }
    });


    var MessageCollection = Backbone.Collection.extend({
        /**
         * The url
         * @type {String}
         */
        url: app.getApiUrl("posts"),

        /**
         * The model
         * @type {MessageModel}
         */
        model: MessageModel,

        /**
         * Returns the messages with no parent
         * @return {Message[]}
         */
        getRootMessages: function(){
            var toReturn = [];

            _.each(this.models, function(model){

                if( model.get('parentId') === null ){
                    toReturn.push(model);
                } else if( model.getRootParent() === null ){
                    toReturn.push(model);
                }

            });

            return toReturn;
        },

        /**
         * Return all segments in all messages in the annotator format
         * @return {Object[]}
         */
        getAnnotations: function(){
            var ret = [];

            _.each(this.models, function(model){
                ret = _.union(ret, model.getAnnotations() );
            });

            return ret;
        },

    });

    return {
        Model: MessageModel,
        Collection: MessageCollection
    };

});
