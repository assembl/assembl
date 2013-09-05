define(['backbone', 'zepto', 'app'], function(Backbone, $, app){
    'use strict';

    /**
     * @class MessageModel
     */
    var MessageModel = Backbone.Model.extend({
        /**
         * @init
         */
        initialize: function(){
            //this.on('change:read', this.onAttrChange, this);
            this.on('change:collapsed', this.render, this);
        },

        /**
         * The url
         * @type {String}
         */
        urlRoot: app.getApiUrl('message'),

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
            creator: null,
            avatarUrl: null,
            date: null
        },

        /**
         * Return all children
         * @return {MessageModel[]}
         */
        getChildren: function(){
            return this.collection.where({ parentId: this.get('id') });
        },

        /**
         * Return the parent idea
         * @return {MessageModel}
         */
        getParent: function(){
            return this.collection.findWhere({ id: this.get('parentId') });
        },

        /**
         * @return {Number} the indentantion level
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
        url: app.getApiUrl("messages"),

        /**
         * The model
         * @type {MessageModel}
         */
        model: MessageModel
    });

    return {
        Model: MessageModel,
        Collection: MessageCollection
    };

});
