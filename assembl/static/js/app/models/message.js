define(function(require){
    'use strict';

    var Base = require('models/base'),
     Assembl = require('modules/assembl'),
         Ctx = require('modules/context'),
           $ = require('jquery'),
           _ = require('underscore');

    /**
     * @class MessageModel
     */
    var MessageModel = Base.Model.extend({
        /**
         * The url
         * @type {String}
         */
        urlRoot: Ctx.getApiUrl('posts'),

        /**
         * Default values
         * @type {Object}
         */
        defaults: {
            collapsed: true,
            checked: false,
            read: false,
            parentId: null,
            subject: null,
            hidden: false,
            body: null,
            idCreator: null,
            avatarUrl: null,
            date: null,
            bodyMimeType: null
        },

        /**
         * @return {Number} the quantity of all descendants
         */
        getDescendantsCount: function(){
            var children = this.getChildren(),
                count = children.length;

            _.each(children, function(child){
                count += child.getDescendantsCount();
            });

            return count;
        },

        visitDepthFirst: function(visitor) {
            var ancestry = [this];
            this.collection.visitDepthFirst(visitor, this, ancestry);
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
         * Return all segments in the annotator format
         * @return {Object[]}
         */
        getAnnotationsDEPRECATED: function(){
            var segments = this.collection.collectionManager._allExtractsCollection.where({ idPost: this.getId() }),
                ret = [];

            _.each(segments, function(segment){
                segment.attributes.ranges = segment.attributes._ranges;
                ret.push( _.clone(segment.attributes) );
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

        /** Return a promise for the post's creator
         * @return {$.Defered.Promise}
         */
        getCreatorPromise: function(){
          var that = this,
          deferred = $.Deferred();
          this.collection.collectionManager.getAllUsersCollectionPromise().done(
              function(allUsersCollection) {
                var creatorId = that.get('idCreator');
                deferred.resolve(allUsersCollection.getById(creatorId));
              }
          );
          return deferred.promise();
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save();
        },

        /**
         * Set the `read` property
         * @param {Boolean} value
         */
        setRead: function(value){
            var user = Ctx.getCurrentUser();

            if( user.isUnknownUser() ){
                // Unknown User can't mark as read
                return;
            }

            var isRead = this.get('read');
            if( value === isRead ){
                return; // Nothing to do
            }

            this.set('read', value, { silent: true });

            var that = this,
                url = Ctx.getApiUrl('post_read/') + this.getId(),
                ajax;

            ajax = $.ajax(url, {
                method: 'PUT',
                data: JSON.stringify({ 'read': value }),
                contentType: "application/json; charset=utf-8",
                dataType: "json",
                success: function(data){
                    that.trigger('change:read', [value]);
                    that.trigger('change', that);
                    //So the unread count is updated in the ideaList
                    Assembl.reqres.request('ideas:update', data.ideas);
                }
            });
        }
    });


    var MessageCollection = Base.Collection.extend({
        /**
         * The url
         * @type {String}
         */
        url: Ctx.getApiUrl("posts"),

        /**
         * The model
         * @type {MessageModel}
         */
        model: MessageModel,

        /** Our data is inside the posts array */
        parse: function(response) {
          return response.posts;
        },
    
        /**
         * Traversal function. 
         * @param visitor visitor function.  If visitor returns true, traversal continues
         * @return {Object[]}
         */
        visitDepthFirst: function(visitor, message, ancestry) {
            if (ancestry === undefined) {
                ancestry = [];
            }
            if (message === undefined) {
                var rootMessages = this.where({ parentId: null });
                for (var i in rootMessages) {
                    this.visitDepthFirst(visitor, rootMessages[i], ancestry);
                }
                return;
            }
            if (visitor(message, ancestry)) {
                //Copy ancestry
                ancestry = ancestry.slice(0);
                ancestry.push(message);
                var children = _.sortBy(message.getChildren(), function(child){ return child.get('date'); });
                for (var i in children) {
                    this.visitDepthFirst(visitor, children[i], ancestry);
                }
            }
        }


    });

    return {
        Model: MessageModel,
        Collection: MessageCollection
    };

});
