define(['backbone', 'zepto', 'app'], function(Backbone, $, app){
    'use strict';

    /**
     * @class MessageModel
     */
    var MessageModel = Backbone.Model.extend({
        /**
         * The url
         * @type {String}
         */
        url: '/api/message',

        /**
         * Default values
         * @type {Object}
         */
        defaults: {
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
        }
    });


    var MessageCollection = Backbone.Collection.extend({
        /**
         * The url
         * @type {String}
         */
        url: "/api/messages",

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
