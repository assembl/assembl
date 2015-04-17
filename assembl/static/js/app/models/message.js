'use strict';

define(['underscore', 'jquery', 'app', 'common/context', 'models/base', 'bluebird'],
    function (_, $, Assembl, Ctx, Base, Promise) {

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
                bodyMimeType: null,
                publishes_synthesis_id: null
            },
            
            /**
             * @return {String} the subject, with any re: stripped
             */
            getSubjectNoRe: function () {
              var subject = this.get('subject');
              if(subject) {
                return subject.replace(/( *)?(RE) *(:|$) */igm, "");
              }
              else {
                return subject;
              }
            },
            
            /**
             * @return {Number} the quantity of all descendants
             */
            getDescendantsCount: function () {
                var children = this.getChildren(),
                    count = children.length;

                _.each(children, function (child) {
                    count += child.getDescendantsCount();
                });

                return count;
            },

            visitDepthFirst: function (visitor) {
                var ancestry = [this];
                this.collection.visitDepthFirst(visitor, this, ancestry);
            },

            /**
             * Return all children
             * @return {MessageModel[]}
             */
            getChildren: function () {
                return this.collection.where({ parentId: this.getId() });
            },

            /**
             * Return the parent message (if any)
             * @return {Promise}
             */
            getParentPromise: function () {
              if(this.get('parentId')) {
                return this.collection.collectionManager.getMessageFullModelPromise(this.get('parentId'));
              }
              return this.get('parentId');
            },

            /**
             * TODO:  Bluebirdify
             * Return all segments in the annotator format
             * @return {Object[]}
             */
            getAnnotationsPromise: function () {
                var that = this,
                    deferred = $.Deferred();
                this.getExtractsPromise()
                    .done(function (extracts) {
                        var ret = [];

                        _.each(extracts, function (extract) {
                            //Why this next line?  Benoitg-2014-10-03
                            extract.attributes.ranges = extract.attributes._ranges;
                            ret.push(_.clone(extract.attributes));
                        });

                        deferred.resolve(ret);
                    }
                );
                return deferred.promise();
            },

            /**
             * Return all segments in the annotator format
             * @return {Object[]}
             */
            getExtractsPromise: function () {
                var that = this;
                return this.collection.collectionManager.getAllExtractsCollectionPromise()
                    .then(function (allExtractsCollection) {
                        return Promise.resolve(allExtractsCollection.where({idPost: that.getId()}))
                            .catch(function(e){
                                console.error(e.statusText);
                            });
                    }
                );
            },

            /** Return a promise for the post's creator
             * @return {$.Defered.Promise}
             */
            getCreatorPromise: function () {
                var that = this;

                return this.collection.collectionManager.getAllUsersCollectionPromise()
                    .then(function(allUsersCollection){
                        return Promise.resolve(allUsersCollection.getById(that.get('idCreator')))
                            .catch(function(e){
                                console.error(e.statusText);
                            });
                });

            },

            /**
             * @event
             */
            onAttrChange: function () {
                this.save(null, {
                    success: function (model, resp) {
                    },
                    error: function (model, resp) {
                        console.error('ERROR: onAttrChange', resp);
                    }
                });
            },

            /**
             * Set the `read` property
             * @param {Boolean} value
             */
            setRead: function (value) {
                var user = Ctx.getCurrentUser(),
                    that = this;

                if (user.isUnknownUser()) {
                    // Unknown User can't mark as read
                    return;
                }

                var isRead = this.get('read');
                if (value === isRead) {
                    return; // Nothing to do
                }

                this.set('read', value, { silent: true });

                this.url = Ctx.getApiUrl('post_read/') + this.getId();
                this.save({'read': value},{
                    success: function(model, resp){
                        that.trigger('change:read', [value]);
                        that.trigger('change', that);
                        Assembl.reqres.request('ideas:update', resp.ideas); // this seems to cost a lot of performance. maybe we should update only the ideas related to this message
                    },
                    error: function(model, resp){}
                });

            },

            validate: function(attrs, options){
                /**
                 * check typeof variable
                 * */

            }
        });


        var MessageCollection = Base.Collection.extend({
            /**
             * The url
             * @type {String}
             */
            url: Ctx.getApiUrl("posts?view=id_only"),

            /**
             * The model
             * @type {MessageModel}
             */
            model: MessageModel,

            /** Our data is inside the posts array */
            parse: function (response) {
                return response.posts;
            },

            /**
             * Traversal function.
             * @param visitor visitor function.  If visitor returns true, traversal continues
             * @return {Object[]}
             */
            visitDepthFirst: function (visitor, message, ancestry) {
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
                    var children = _.sortBy(message.getChildren(), function (child) {
                        return child.get('date');
                    });
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
