'use strict';

var Marionette = require('../shims/marionette.js'),
    Promise = require('bluebird'),
    Raven = require('raven-js'),
    $ = require('../shims/jquery.js'),
    Assembl = require('../app.js'),
    Message = require('../models/message.js'),
    groupSpec = require('../models/groupSpec.js'),
    Idea = require('../models/idea.js'),
    IdeaLink = require('../models/ideaLink.js'),
    Segment = require('../models/segment.js'),
    Synthesis = require('../models/synthesis.js'),
    Partners = require('../models/partners.js'),
    Agents = require('../models/agents.js'),
    NotificationSubscription = require('../models/notificationSubscription.js'),
    Storage = require('../objects/storage.js'),
    Types = require('../utils/types.js'),
    i18n = require('../utils/i18n.js'),
    LocalRole = require('../models/roles.js'),
    Discussion = require('../models/discussion.js'),
    DiscussionSource = require('../models/discussionSource.js');

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
     *  Collection from discussion notifications.
     * */
    _allNotificationsDiscussionCollection: undefined,
    _allNotificationsDiscussionCollectionPromise: undefined,


    /**
     *  Collection from user notifications
     * */
    _allNotificationsUserCollection: undefined,
    _allNotificationsUserCollectionPromise: undefined,


    /**
     *  Collection of user roles
     * */
    _allLocalRoleCollection: undefined,
    _allLocalRoleCollectionPromise: undefined,

    /**
     *  Collection from discussion
     * */
    _allDiscussionModel: undefined,
    _allDiscussionModelPromise: undefined,

    _allDiscussionSourceCollection: undefined,
    _allDiscussionSourceCollectionPromise: undefined,

    /**
     * Returns the collection from the giving object's @type .
     * Used by the socket to sync the collection.
     * @param {BaseModel} item
     * @param {String} [type=item['@type']] The model type
     * @return {BaseCollection}
     */
    getCollectionPromiseByType: function (item, type) {
        type = type || Types.getBaseType(item['@type']);

        switch (type) {
            case Types.EXTRACT:
                return this.getAllExtractsCollectionPromise();

            case Types.IDEA:
                return this.getAllIdeasCollectionPromise();

            case Types.IDEA_LINK:
                return this.getAllIdeaLinksCollectionPromise();

            case Types.POST:
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
        if (this._allUsersCollectionPromise) {
            return this._allUsersCollectionPromise;
        }

        this._allUsersCollection = new Agents.Collection();
        this._allUsersCollection.collectionManager = this;
        this._allUsersCollectionPromise = Promise.resolve(this._allUsersCollection.fetchFromScriptTag('users-json'))
            .thenReturn(this._allUsersCollection)
            .catch(function(e){
               console.error(e.statusText);
            });

        return this._allUsersCollectionPromise;
    },

    getAllMessageStructureCollectionPromise: function () {
        if (this._allMessageStructureCollectionPromise) {
            return this._allMessageStructureCollectionPromise;
        }
        this._allMessageStructureCollection = new Message.Collection();
        this._allMessageStructureCollection.collectionManager = this;
        this._allMessageStructureCollectionPromise = Promise.resolve(this._allMessageStructureCollection.fetch())
            .thenReturn(this._allMessageStructureCollection)
            .catch(function(e){
                console.error(e.statusText);
            });

        return this._allMessageStructureCollectionPromise;
    },

    _waitingWorker: undefined,

    _messageFullModelRequests: {},

    getMessageFullModelRequestWorker: function (collectionManager) {
      this.collectionManager = collectionManager,
      this.requests = this.collectionManager._messageFullModelRequests,

      this.addRequest = function (id) {
        /* Emulates the defered pattern in bluebird, in this case we really do need it */
        function Defer() {
          var resolve, reject;
          var promise = new Promise(function() {
            resolve = arguments[0];
            reject = arguments[1];
          });
          return {
            resolve: resolve,
            reject: reject,
            promise: promise
          };
        }
        var promiseResolver;
        if (this.requests[id] === undefined) {
          promiseResolver = new Defer();
          this.requests[id] = {'promiseResolver': promiseResolver,
                               'serverRequestInProgress': false,
                               'count': 1}
        }
        else {
          promiseResolver = this.requests[id]['promiseResolver'];
          this.requests[id]['count']++;
        }

        if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
            console.log("Added request for id:" + id + ", now ", this.requests[id]['count'], " requests for this id, queue size is now:" + _.size(this.requests));
        }
        // Each id can take up to ~40 characters.  To not exceed
        // the 2048 characters unofficial limit for GET URLs,
        // (IE and others), we only request up to do up to:
        // 2000/40 ~= 50 id's at a time
        var unservicedRequests = _.filter(this.requests, function(request){ return request['serverRequestInProgress'] === false; });
        var numUnservicedRequests = _.size(unservicedRequests);
        if (numUnservicedRequests >= 50) {
          if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
            console.log("Executing unserviced request immediately, unserviced queue size is now:", numUnservicedRequests);
          }
          //TODO:  This is suboptimal, as the server can still be hammered
          //with concurrent requests for the same data, causing
          //database contention.  Like a bit below, we should remember
          //how many requests are in transit, and not have more than 3

          //Alternatively, we could POST on a fake URL, with the url path
          //as the body of the request and avoid this spliting completely.

          this.executeRequest();
        }
        return promiseResolver.promise;
      },

      this.executeRequest = function () {

        var that = this,
            allMessageStructureCollectionPromise = this.collectionManager.getAllMessageStructureCollectionPromise(),
            ids = [];
        if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
          console.log("executeRequest fired, unregistering worker from collection Manager");
        }
        this.collectionManager._waitingWorker = undefined;

        _.each(that.requests, function (request, id) {
          //var structureModel = allMessageStructureCollection.get(id);
          if (request['serverRequestInProgress'] === false) {
            request['serverRequestInProgress'] = true;
            ids.push(id);
          }
        });
        allMessageStructureCollectionPromise.then(function (allMessageStructureCollection) {
          var PostQuery = require('../views/messageListPostQuery'),
              postQuery = new PostQuery(),
              viewDef = 'default';

          if (_.size(ids) > 0) {
            postQuery.addFilter(postQuery.availableFilters.POST_HAS_ID_IN, ids);
            postQuery.setViewDef(viewDef); //We want the full messages
            if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
              console.log("requesting message data from server for "+ _.size(ids) + " messages");
            }

            postQuery.getResultRawDataPromise().then(function (results) {
              _.each(results, function (jsonData) {
                var id = jsonData['@id'],
                    structureModel = allMessageStructureCollection.get(id),
                    deferredList = that.requests[id];

                if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                  console.log("executeRequest resolving for id", id, deferredList['count'], " requests queued for that id");
                }
                structureModel.set(jsonData);
                structureModel.viewDef = viewDef;
                if (deferredList !== undefined) {
                  deferredList['promiseResolver'].resolve(structureModel);
                  delete that.requests[id];
                }
                else {
                  console.log("WARNING: collectionManager::executeRequest() received data for " + id + ", but there is no matching request.  Race condition?");
                }
              });
            });

          }
          else {
            if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
              console.log("executeRequest called, but no ids to request from the server out of the list of ", _.size(that.requests));
            }
          }
        });

      }

      //Constructor
      if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
          console.log("Spawning new _getMessageFullModelsRequestWorker");
      }
      var that = this;
      this.executeTimeout = setTimeout(function () {
        if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
          console.log("Executing unserviced request immediately (timeaout reached)");
        }
        that.executeRequest();
      }, collectionManager.FETCH_WORKERS_LIFETIME);
    },

    /**
     * Need to be refactor with bluebird
     * */
    getMessageFullModelPromise: function (id) {
        var that = this,
            allMessageStructureCollectionPromise = this.getAllMessageStructureCollectionPromise();

        if (!id) {
          var msg = "getMessageFullModelPromise(): Tried to request full message model with a falsy id.";
          console.error(msg);
          return Promise.reject(msg);
        }

        return allMessageStructureCollectionPromise.then(function (allMessageStructureCollection) {
            var structureModel = allMessageStructureCollection.get(id);

            if (structureModel) {
                if (structureModel.viewDef !== undefined && structureModel.viewDef == "default") {
                    if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                        console.log("getMessageFullModelPromise CACHE HIT!");
                    }
                    return Promise.resolve(structureModel);
                }
                else {
                    if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                        console.log("getMessageFullModelPromise CACHE MISS!");
                    }

                    if (that._waitingWorker === undefined) {
                        that._waitingWorker = new that.getMessageFullModelRequestWorker(that);
                    }
                    return that._waitingWorker.addRequest(id);
                }
            }
            else {
              var msg = "Structure model not in allMessageStructureCollection for id!" + id;
              console.log(msg);
              return Promise.reject(msg);
            }
        });

    },

    /**
     * Retrieve fully populated models for the list of id's given
     * @param ids[] array of message id's
     * @return Message.Model{}
     */
    getMessageFullModelsPromise: function (ids) {
      var that = this,
      returnedModelsPromises = [];

      _.each(ids, function (id) {
        var promise = that.getMessageFullModelPromise(id);
        returnedModelsPromises.push(promise);
      });

      return Promise.all(returnedModelsPromises).then(function (models) {
        //var args = Array.prototype.slice.call(arguments);
        //console.log("getMessageFullModelsPromise() resolved promises:", returnedModelsPromises);
        //console.log("getMessageFullModelsPromise() resolving with:", args);
        return Promise.resolve(models);
      }).catch(function (e) {
        console.error("getMessageFullModelsPromise: One or more of the id's couldn't be retrieved: ", e);
        return Promise.reject(e);
      });
    },

    getAllSynthesisCollectionPromise: function () {
        if (this._allSynthesisCollectionPromise) {
            return this._allSynthesisCollectionPromise;
        }
        this._allSynthesisCollection = new Synthesis.Collection();
        this._allSynthesisCollection.collectionManager = this;
        this._allSynthesisCollectionPromise = Promise.resolve(this._allSynthesisCollection.fetch())
            .thenReturn(this._allSynthesisCollection)
            .catch(function(e){
                console.error(e.statusText);
            });

        return this._allSynthesisCollectionPromise;
    },

    getAllIdeasCollectionPromise: function () {
        var that = this;
        if (this._allIdeasCollectionPromise) {
            return this._allIdeasCollectionPromise;
        }

        this._allIdeasCollection = new Idea.Collection();
        this._allIdeasCollection.collectionManager = this;
        this._allIdeasCollectionPromise = Promise.resolve(this._allIdeasCollection.fetch())
            .thenReturn(this._allIdeasCollection)
            .catch(function(e){
                console.error(e.statusText);
            });

        //Start listener setup
        //This is so the unread count update when setting a message unread.
        //See Message:setRead()
        Assembl.reqres.setHandler('ideas:update', function (ideas) {
            if (Ctx.debugRender) {
                console.log("ideaList: triggering render because app.on('ideas:update') was triggered");
            }
            that._allIdeasCollection.add(ideas, {merge: true});
        });
        //End listener setup

        return this._allIdeasCollectionPromise;

    },

    getAllIdeaLinksCollectionPromise: function () {
        if (this._allIdeaLinksCollectionPromise) {
            return this._allIdeaLinksCollectionPromise;
        }

        this._allIdeaLinksCollection = new IdeaLink.Collection();
        this._allIdeaLinksCollection.collectionManager = this;
        this._allIdeaLinksCollectionPromise = Promise.resolve(this._allIdeaLinksCollection.fetch())
            .thenReturn(this._allIdeaLinksCollection)
            .catch(function(e){
                console.error(e.statusText);
            });

        return this._allIdeaLinksCollectionPromise;
    },

    getAllExtractsCollectionPromise: function () {
        if (this._allExtractsCollectionPromise) {
            return this._allExtractsCollectionPromise;
        }

        this._allExtractsCollection = new Segment.Collection();
        this._allExtractsCollection.collectionManager = this;
        this._allExtractsCollectionPromise = Promise.resolve(this._allExtractsCollection.fetchFromScriptTag('extracts-json'))
            .thenReturn(this._allExtractsCollection)
            .catch(function(e){
                console.error(e.statusText);
            });

        return this._allExtractsCollectionPromise;
    },

    getAllPartnerOrganizationCollectionPromise: function () {
        if (this._allPartnerOrganizationCollectionPromise) {
            return this._allPartnerOrganizationCollectionPromise;
        }
        this._allPartnerOrganizationCollection = new Partners.Collection();
        this._allPartnerOrganizationCollection.collectionManager = this;
        this._allPartnerOrganizationCollectionPromise = Promise.resolve(this._allPartnerOrganizationCollection.fetch())
            .thenReturn(this._allPartnerOrganizationCollection)
            .catch(function(e){
                console.error(e.statusText);
            });

        return this._allPartnerOrganizationCollectionPromise;
    },

    getNotificationsDiscussionCollectionPromise: function () {
        if (this._allNotificationsDiscussionCollectionPromise) {
            return this._allNotificationsDiscussionCollectionPromise;
        }
        this._allNotificationsDiscussionCollection = new NotificationSubscription.Collection();
        this._allNotificationsDiscussionCollection.setUrlToDiscussionTemplateSubscriptions();
        this._allNotificationsDiscussionCollection.collectionManager = this;
        this._allNotificationsDiscussionCollectionPromise = Promise.resolve(this._allNotificationsDiscussionCollection.fetch())
            .thenReturn(this._allNotificationsDiscussionCollection)
            .catch(function(e){
                console.error(e.statusText);
            })

        return this._allNotificationsDiscussionCollectionPromise;
    },

    getNotificationsUserCollectionPromise: function () {
        if (this._allNotificationsUserCollectionPromise) {
            return this._allNotificationsUserCollectionPromise;
        }

        this._allNotificationsUserCollection = new NotificationSubscription.Collection();
        this._allNotificationsUserCollection.setUrlToUserSubscription();
        this._allNotificationsUserCollection.collectionManager = this;
        this._allNotificationsUserCollectionPromise = Promise.resolve(this._allNotificationsUserCollection.fetch())
            .thenReturn(this._allNotificationsUserCollection)
            .catch(function(e){
                console.error(e.statusText);
            });

        return this._allNotificationsUserCollectionPromise;

    },

    /* TODO:  Bluebirdify
     * Gets the stored configuration of groups and panels
     */
    getGroupSpecsCollectionPromise: function (viewsFactory) {
        var deferred = $.Deferred();

        if (this._allGroupSpecsCollectionPromise === undefined) {
            var collection,
                data = Storage.getStorageGroupItem();
            if (data !== undefined) {
                collection = new groupSpec.Collection(data, {'parse': true, 'viewsFactory': viewsFactory});
                if (!collection.validate()) {
                    console.error("getGroupSpecsCollectionPromise(): Collection in local storage is invalid, will return a new one");
                    collection = undefined;
                }
            }
            if (collection === undefined) {
                collection = new groupSpec.Collection();
                var panelSpec = require('../models/panelSpec.js');
                var PanelSpecTypes = require('../utils/panelSpecTypes.js');
                var defaults = {
                    panels: new panelSpec.Collection([
                            {type: PanelSpecTypes.NAV_SIDEBAR.id },
                            {type: PanelSpecTypes.IDEA_PANEL.id, minimized: true},
                            {type: PanelSpecTypes.MESSAGE_LIST.id}
                        ],
                        {'viewsFactory': viewsFactory }),
                    navigationState: 'debate'
                };
                collection.add(new groupSpec.Model(defaults, {'viewsFactory': viewsFactory }));

            }
            collection.collectionManager = this;
            Storage.bindGroupSpecs(collection);

            this._allGroupSpecsCollectionPromise = deferred.promise();
            deferred.resolve(collection);
        }
        return this._allGroupSpecsCollectionPromise;
    },

    getLocalRoleCollectionPromise: function () {
        if (this._allLocalRoleCollectionPromise) {
            return this._allLocalRoleCollectionPromise;
        }

        this._allLocalRoleCollection = new LocalRole.Collection();
        this._allLocalRoleCollection.collectionManager = this;
        this._allLocalRoleCollectionPromise = Promise.resolve(this._allLocalRoleCollection.fetch())
            .thenReturn(this._allLocalRoleCollection)
            .catch(function(e){
                console.error(e.statusText);
            });

        return this._allLocalRoleCollectionPromise;
    },

    getDiscussionModelPromise: function () {
        if (this._allDiscussionModelPromise) {
            return this._allDiscussionModelPromise;
        }

        this._allDiscussionModel = new Discussion.Model();
        this._allDiscussionModel.collectionManager = this;
        this._allDiscussionModelPromise = Promise.resolve(this._allDiscussionModel.fetch())
            .thenReturn(this._allDiscussionModel)
            .catch(function(e){
                console.error(e.statusText);
            });

        return this._allDiscussionModelPromise;
    },

    getDiscussionSourceCollectionPromise: function () {
        if (this._allDiscussionSourceCollectionPromise) {
            return this._allDiscussionSourceCollectionPromise;
        }
        this._allDiscussionSourceCollection = new DiscussionSource.Collection();
        this._allDiscussionSourceCollection.collectionManager = this;
        this._allDiscussionSourceCollectionPromise = Promise.resolve(this._allDiscussionSourceCollection.fetch())
            .thenReturn(this._allDiscussionSourceCollection)
            .catch(function(e){
                console.error(e.statusText);
            });

        return this._allDiscussionSourceCollectionPromise;
    }

});

var _instance;

module.exports = function () {
    if (!_instance) {
        _instance = new CollectionManager();
    }
    return _instance;
};