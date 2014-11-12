'use strict';

define(function (require) {

    var Assembl = require('app'),
        Marionette = require('backbone.marionette'),
        Message = require('models/message'),
        groupSpec = require('models/groupSpec'),
        Idea = require('models/idea'),
        IdeaLink = require('models/ideaLink'),
        Segment = require('models/segment'),
        Synthesis = require('models/synthesis'),
        PartnerOrg = require('models/partner_organization'),
        User = require('models/user'),
        NotificationSubscription = require('models/notificationSubscription'),
        $ = require('jquery'),
        Storage = require('objects/storage'),
        Types = require('utils/types'),
        i18n = require('utils/i18n');

    /**
     * @class CollectionManager
     *
     * A singleton to manage lazy loading of server collections
     */
    var CollectionManager = Marionette.Controller.extend({
        FETCH_WORKERS_LIFETIME: 30,

        /**
         * Send debugging output to console.log to observe the activity of lazy
         * loading
         * @type {boolean}
         */
        DEBUG_LAZY_LOADING: false,

        /**
         * Collection with all users in the discussion.
         * @type {UserCollection}
         */
        _allUsersCollection: undefined,

        _allUsersCollectionPromise: undefined,

        /**
         * Collection with all messsages in the discussion.
         * @type {MessageCollection}
         */
        _allMessageStructureCollection: undefined,

        _allMessageStructureCollectionPromise: undefined,

        /**
         * Collection with all synthesis in the discussion.
         * @type {SynthesisCollection}
         */
        _allSynthesisCollection: undefined,

        _allSynthesisCollectionPromise: undefined,

        /**
         * Collection with all ideas in the discussion.
         * @type {SegmentCollection}
         */
        _allIdeasCollection: undefined,

        _allIdeasCollectionPromise: undefined,

        /**
         * Collection with all idea links in the discussion.
         * @type {MessageCollection}
         */
        _allIdeaLinksCollection: undefined,

        _allIdeaLinksCollectionPromise: undefined,

        /**
         * Collection with all extracts in the discussion.
         * @type {SegmentCollection}
         */
        _allExtractsCollection: undefined,

        _allExtractsCollectionPromise: undefined,

        /**
         * Collectin with a definition of the user's view
         * @type {GroupSpec}
         */
        _allGroupSpecsCollection: undefined,

        _allGroupSpecsCollectionPromise: undefined,

        /**
         * Collection with all partner organization in the discussion.
         * @type {PartnerOrganizationCollection}
         */
        _allPartnerOrganizationCollection: undefined,

        _allPartnerOrganizationCollectionPromise: undefined,

        /**
         *
         * */
        _allNotificationsDiscussionCollection: undefined,
        _allNotificationsDiscussionCollectionPromise: undefined,


        /**
         *
         * */
        _allNotificationsUserCollection: undefined,
        _allNotificationsUserCollectionPromise: undefined,


        /**
         * Returns the collection from the giving object's @type .
         * Used by the socket to sync the collection.
         * @param {BaseModel} item
         * @param {String} [type=item['@type']] The model type
         * @return {BaseCollection}
         */
        getCollectionPromiseByType: function (item, type) {
            type = type || item['@type'];

            switch (type) {
                case Types.EXTRACT:
                    return this.getAllExtractsCollectionPromise();

                case Types.IDEA:
                case Types.ROOT_IDEA:
                case Types.PROPOSAL:
                case Types.ISSUE:
                case Types.CRITERION:
                case Types.ARGUMENT:
                    return this.getAllIdeasCollectionPromise();

                case Types.IDEA_LINK:
                    return this.getAllIdeaLinksCollectionPromise();

                case Types.POST:
                case Types.ASSEMBL_POST:
                case Types.SYNTHESIS_POST:
                case Types.IMPORTED_POST:
                case Types.EMAIL:
                case Types.IDEA_PROPOSAL_POST:
                case Types.POST_WITH_METADATA:
                    return this.getAllMessageStructureCollectionPromise();

                case Types.USER:
                    return this.getAllUsersCollectionPromise();

                case Types.SYNTHESIS:
                    return this.getAllSynthesisCollectionPromise();

                case Types.PARTNER_ORGANIZATION:
                    return this.getAllPartnerOrganizationCollectionPromise();
            }

            return null;
        },

        getAllUsersCollectionPromise: function () {
            var that = this,
                deferred = $.Deferred();

            if (this._allUsersCollectionPromise === undefined) {
                this._allUsersCollection = new User.Collection();
                this._allUsersCollection.collectionManager = this;
                this._allUsersCollectionPromise = this._allUsersCollection.fetchFromScriptTag('users-json');
                this._allUsersCollectionPromise.done(function () {
                    deferred.resolve(that._allUsersCollection);
                });
            }
            else {
                this._allUsersCollectionPromise.done(function () {
                    deferred.resolve(that._allUsersCollection);
                });
            }
            return deferred.promise();
        },

        getAllMessageStructureCollectionPromise: function () {
            var that = this,
                deferred = $.Deferred();

            if (this._allMessageStructureCollectionPromise === undefined) {
                this._allMessageStructureCollection = new Message.Collection();
                this._allMessageStructureCollection.collectionManager = this;
                this._allMessageStructureCollectionPromise = this._allMessageStructureCollection.fetch({
                    success: function (collection, response, options) {
                        deferred.resolve(that._allMessageStructureCollection);
                    }
                });
            }
            else {
                this._allMessageStructureCollectionPromise.done(function () {
                    deferred.resolve(that._allMessageStructureCollection);
                });
            }
            return deferred.promise();
        },

        _waitingWorker: undefined,

        getMessageFullModelRequestWorker: function (collectionManager) {
            this.collectionManager = collectionManager,

                this.requests = {},

                this.addRequest = function (id, promise) {
                    if (this.requests[id] === undefined) {
                        this.requests[id] = []
                    }
                    this.requests[id].push(promise);
                    if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                        console.log("Added request for id:" + id + ", queue size is now:" + _.size(this.requests));
                    }
                    // Each id can take up to ~40 characters.  To not exceed 
                    // the 2048 characters unofficial limit for GET URLs, 
                    // (IE and others), we only request up to do up to:
                    // 2000/40 ~= 50 id's at a time
                    if(_.size(this.requests) >= 50) {
                      if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                        console.log("Executing request immediately, queue size is now:" + _.size(this.requests));
                      }
                      //TODO:  This is suboptimal, as the server can be hammered 
                      //with concurrent requests for the same data, causing 
                      //database contention.  Like a bit below, we should remember
                      //how many requests are in transit, and not have more than 3
                      
                      //Alternatively, we could POST on a fake URL, with the url path
                      //as the body of the request and avoid this spliting completely.
                      this.executeRequest();
                    }
                },

                this.executeRequest = function () {
                    var that = this,
                        allMessageStructureCollectionPromise = this.collectionManager.getAllMessageStructureCollectionPromise();
                    if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                        console.log("executeRequest fired, unregistering worker from collection Manager");
                    }
                    //TODO:  If another request arrives while this one is executing,
                    //an extra request will eventually fire.  (The time window is the entire
                    //server interaction, which is significant.
                    //We should remember previous
                    //workers and look into them before creating a new request.
                    this.collectionManager._waitingWorker = undefined;
                    allMessageStructureCollectionPromise.done(function (allMessageStructureCollection) {
                        var PostQuery = require('views/messageListPostQuery'),
                            postQuery = new PostQuery(),
                            ids = [],
                            viewDef = 'default';

                        _.each(that.requests, function (deferredList, id) {
                            var structureModel = allMessageStructureCollection.get(id);
                            ids.push(id);
                        });

                        postQuery.addFilter(postQuery.availableFilters.POST_HAS_ID_IN, ids);
                        postQuery.setViewDef(viewDef); //We want the full messages
                        postQuery.getResultRawDataPromise().done(function (results) {
                            _.each(results, function (jsonData) {
                                var id = jsonData['@id'],
                                    structureModel = allMessageStructureCollection.get(id),
                                    deferredList = that.requests[id];
                                if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                                    console.log("executeRequest resolving for id", id, deferredList.length, "deferred queued for that id");
                                }
                                structureModel.set(jsonData);
                                structureModel.viewDef = viewDef;

                                _.each(deferredList, function (deferred) {
                                    deferred.resolve(structureModel);
                                });

                            });
                        });
                    });
                }

            //Constructor
            if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                console.log("Spawning new _getMessageFullModelsRequestWorker");
            }
            var that = this;
            this.executeTimeout = setTimeout(function () {
                that.executeRequest();
            }, collectionManager.FETCH_WORKERS_LIFETIME);
        },


        getMessageFullModelPromise: function (id) {
            var that = this,
                deferred = $.Deferred(),
                allMessageStructureCollectionPromise = this.getAllMessageStructureCollectionPromise();


            allMessageStructureCollectionPromise.done(function (allMessageStructureCollection) {
                var structureModel = allMessageStructureCollection.get(id),
                    returnedModel = undefined;
                if (structureModel) {
                    if (structureModel.viewDef !== undefined && structureModel.viewDef == "default") {
                        if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                            console.log("getMessageFullModelPromise CACHE HIT!")
                        }
                        deferred.resolve(structureModel);
                    }
                    else {
                        if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                            console.log("getMessageFullModelPromise CACHE MISS!")
                        }
                        if (that._waitingWorker === undefined) {
                            that._waitingWorker = new that.getMessageFullModelRequestWorker(that);
                        }
                        that._waitingWorker.addRequest(id, deferred);
                    }

                }
                else {
                    deferred.reject();
                }
            });
            return deferred.promise();
        },

        /**
         * Retrieve fully populated models for the list of id's given
         * @param ids[] array of message id's
         * @return Message.Model{}
         */
        getMessageFullModelsPromise: function (ids) {
            var that = this,
                deferred = $.Deferred(),
                allMessageStructureCollectionPromise = this.getAllMessageStructureCollectionPromise(),
                returnedModelsPromises = [];
            allMessageStructureCollectionPromise.done(function (allMessageStructureCollection) {
                _.each(ids, function (id) {
                    returnedModelsPromises.push(that.getMessageFullModelPromise(id));
                });
                $.when.apply($, returnedModelsPromises).then(
                    function () {
                        var args = Array.prototype.slice.call(arguments);
                        //console.log("getMessageFullModelsPromise() resolved promises:", returnedModelsPromises);
                        //console.log("getMessageFullModelsPromise() resolving with:", args);
                        deferred.resolve(args);
                    },
                    function () {
                        console.log("getMessageFullModelsPromise: One of the id's couldn't be retrieved")
                        deferred.reject();
                    }
                );
            });
            return deferred.promise();
        },

        getAllSynthesisCollectionPromise: function () {
            var that = this,
                deferred = $.Deferred();

            if (this._allSynthesisCollectionPromise === undefined) {
                this._allSynthesisCollection = new Synthesis.Collection();
                this._allSynthesisCollection.collectionManager = this;
                this._allSynthesisCollectionPromise = this._allSynthesisCollection.fetch({
                    success: function (collection, response, options) {
                        deferred.resolve(that._allSynthesisCollection);
                    }
                });
            }
            else {
                this._allSynthesisCollectionPromise.done(function () {
                    deferred.resolve(that._allSynthesisCollection);
                });
            }
            return deferred.promise();
        },

        getAllIdeasCollectionPromise: function () {
            var that = this,
                deferred = $.Deferred();

            if (this._allIdeasCollectionPromise === undefined) {
                this._allIdeasCollection = new Idea.Collection();
                this._allIdeasCollection.collectionManager = this;
                this._allIdeasCollectionPromise = this._allIdeasCollection.fetchFromScriptTag('ideas-json');
                this._allIdeasCollectionPromise.done(function (collection, response, options) {
                    deferred.resolve(that._allIdeasCollection);
                    //Start listener setup
                    /*
                     this.listenTo(this.ideas, "all", function(eventName) {
                     console.log("ideaList collection event received: ", eventName);
                     });
                     */

                    //This is so the unread count update when setting a message unread.
                    //See Message:setRead()
                    Assembl.reqres.setHandler('ideas:update', function (ideas) {
                        if (Ctx.debugRender) {
                            console.log("ideaList: triggering render because app.on('ideas:update') was triggered");
                        }
                        that._allIdeasCollection.add(ideas, {merge: true});
                    });
                    //End listener setup
                });
            }
            else {
                this._allIdeasCollectionPromise.done(function () {
                    deferred.resolve(that._allIdeasCollection);
                });
            }
            return deferred.promise();
        },

        getAllIdeaLinksCollectionPromise: function () {
            var that = this,
                deferred = $.Deferred();

            if (this._allIdeaLinksCollectionPromise === undefined) {
                this._allIdeaLinksCollection = new IdeaLink.Collection();
                this._allIdeaLinksCollection.collectionManager = this;
                this._allIdeaLinksCollectionPromise = deferred.promise();
                deferred.resolve(this._allIdeaLinksCollection);
            }
            return this._allIdeaLinksCollectionPromise;
        },

        getAllExtractsCollectionPromise: function () {
            var that = this,
                deferred = $.Deferred();

            if (this._allExtractsCollectionPromise === undefined) {
                this._allExtractsCollection = new Segment.Collection();
                this._allExtractsCollection.collectionManager = this;
                this._allExtractsCollectionPromise = this._allExtractsCollection.fetchFromScriptTag('extracts-json');
                this._allExtractsCollectionPromise.done(function () {
                    deferred.resolve(that._allExtractsCollection);
                });
            }
            else {
                this._allExtractsCollectionPromise.done(function () {
                    deferred.resolve(that._allExtractsCollection);
                });
            }
            return deferred.promise();
        },

        getAllPartnerOrganizationCollectionPromise: function () {
            var that = this,
                deferred = $.Deferred();

            if (this._allPartnerOrganizationCollectionPromise === undefined) {
                this._allPartnerOrganizationCollection = new PartnerOrg.Collection();
                this._allPartnerOrganizationCollection.collectionManager = this;
                this._allPartnerOrganizationCollectionPromise = this._allPartnerOrganizationCollection.fetch();
                this._allPartnerOrganizationCollectionPromise.done(function () {
                    deferred.resolve(that._allPartnerOrganizationCollection);
                });
            }
            else {
                this._allPartnerOrganizationCollectionPromise.done(function () {
                    deferred.resolve(that._allPartnerOrganizationCollection);
                });
            }
            return deferred.promise();
        },

        getNotificationsDiscussionCollectionPromise: function () {
            var that = this,
                deferred = $.Deferred();

            if (this._allNotificationsDiscussionCollectionPromise === undefined) {
                this._allNotificationsDiscussionCollection = new NotificationSubscription.Collection();
                this._allNotificationsDiscussionCollection.setUrlToDiscussionTemplateSubscriptions();
                this._allNotificationsDiscussionCollection.collectionManager = this;
                this._allNotificationsDiscussionCollectionPromise = this._allNotificationsDiscussionCollection.fetch();
                this._allNotificationsDiscussionCollectionPromise.done(function () {
                    deferred.resolve(that._allNotificationsDiscussionCollection);
                });
            }
            else {
                this._allNotificationsDiscussionCollectionPromise.done(function () {
                    deferred.resolve(that._allNotificationsDiscussionCollection);
                });
            }
            return deferred.promise();
        },

        getNotificationsUserCollectionPromise: function () {
            var that = this,
                deferred = $.Deferred();

            if (this._allNotificationsUserCollectionPromise === undefined) {
                this._allNotificationsUserCollection = new NotificationSubscription.Collection();
                this._allNotificationsUserCollection.setUrlToUserSubscription();
                this._allNotificationsUserCollection.collectionManager = this;
                this._allNotificationsUserCollectionPromise = this._allNotificationsUserCollection.fetch();
                this._allNotificationsUserCollectionPromise.done(function () {
                    deferred.resolve(that._allNotificationsUserCollection);
                });
            }
            else {
                this._allNotificationsUserCollectionPromise.done(function () {
                    deferred.resolve(that._allNotificationsUserCollection);
                });
            }
            return deferred.promise();
        },

        /*
         * Gets the stored configuration of groups and panels
         */
        getGroupSpecsCollectionPromise: function (viewsFactory) {
            var deferred = $.Deferred();

            if (this._allGroupSpecsCollectionPromise === undefined) {
                var collection,
                    data = Storage.getStorageGroupItem();
                if (data !== undefined) {
                    collection = new groupSpec.Collection(data, {'parse': true});
                    if (!collection.validate(viewsFactory)) {
                        collection = undefined;
                    }
                }
                if (collection === undefined) {
                    collection = new groupSpec.Collection();
                    collection.add(new groupSpec.Model());
                }
                collection.collectionManager = this;
                Storage.bindGroupSpecs(collection);

                this._allGroupSpecsCollectionPromise = deferred.promise();
                deferred.resolve(collection);
            }
            return this._allGroupSpecsCollectionPromise;
        }
    });

    var _instance;

    return function () {
        if (!_instance) {
            _instance = new CollectionManager();
        }
        return _instance;
    };

});