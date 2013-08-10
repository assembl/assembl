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
            this.on('change:read', this.onAttrChange, this);
        },

        /**
         * The url
         * @type {String}
         */
        url: app.getApiUrl('message'),

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
            authorName: null,
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
                parent = parent.get('parentId') !== null ? parent.getParent() : null;
                counter += 1;
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
