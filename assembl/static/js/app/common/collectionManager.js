'use strict';
/**
 * 
 * @module app.common.collectionManager
 */

var Marionette = require('../shims/marionette.js'),
    Promise = require('bluebird'),
    Raven = require('raven-js'),
    $ = require('jquery'),
    Assembl = require('../app.js'),
    Message = require('../models/message.js'),
    groupSpec = require('../models/groupSpec.js'),
    Idea = require('../models/idea.js'),
    IdeaLink = require('../models/ideaLink.js'),
    Segment = require('../models/segment.js'),
    Synthesis = require('../models/synthesis.js'),
    Partners = require('../models/partners.js'),
    Announcement = require('../models/announcement.js'),
    Agents = require('../models/agents.js'),
    NotificationSubscription = require('../models/notificationSubscription.js'),
    Storage = require('../objects/storage.js'),
    Types = require('../utils/types.js'),
    i18n = require('../utils/i18n.js'),
    LocalRole = require('../models/roles.js'),
    Discussion = require('../models/discussion.js'),
    DiscussionSource = require('../models/discussionSource.js'),
    Widget = require('../models/widget.js'),
    Social = require('../models/social.js'),
    Account = require('../models/accounts.js'),
    Socket = require('../utils/socket.js'),
    DiscussionSources = require('../models/sources.js'),
    DiscussionPreference = require('../models/discussionPreference.js'),
    LanguagePreference = require('../models/languagePreference.js'),
    IdeaContentLink = require('../models/ideaContentLink.js');

/**
 * @class CollectionManager A singleton to manage lazy loading of server
 *        collections
 */
var CollectionManager = Marionette.Object.extend({
  FETCH_WORKERS_LIFETIME: 30,

  /**
   * Send debugging output to console.log to observe the activity of lazy
   * loading
   * 
   * @type {boolean}
   */
  DEBUG_LAZY_LOADING: false,

  /**
   * Collection with all users in the discussion.
   * 
   * @type {UserCollection}
   */
  _allUsersCollection: undefined,

  _allUsersCollectionPromise: undefined,

  /**
   * Collection with all messsages in the discussion.
   * 
   * @type {MessageCollection}
   */
  _allMessageStructureCollection: undefined,

  _allMessageStructureCollectionPromise: undefined,

  /**
   * Collection with all synthesis in the discussion.
   * 
   * @type {SynthesisCollection}
   */
  _allSynthesisCollection: undefined,

  _allSynthesisCollectionPromise: undefined,

  /**
   * Collection with all ideas in the discussion.
   * 
   * @type {SegmentCollection}
   */
  _allIdeasCollection: undefined,

  _allIdeasCollectionPromise: undefined,

  /**
   * Collection with all idea links in the discussion.
   * 
   * @type {MessageCollection}
   */
  _allIdeaLinksCollection: undefined,

  _allIdeaLinksCollectionPromise: undefined,

  /**
   * Collection with all extracts in the discussion.
   * 
   * @type {SegmentCollection}
   */
  _allExtractsCollection: undefined,

  _allExtractsCollectionPromise: undefined,

  /**
   * Collection with a definition of the user's view
   * 
   * @type {GroupSpec}
   */
  _allGroupSpecsCollection: undefined,

  _allGroupSpecsCollectionPromise: undefined,

  /**
   * Collection with all partner organization in the discussion.
   * 
   * @type {PartnerOrganizationCollection}
   */
  _allPartnerOrganizationCollection: undefined,
  _allPartnerOrganizationCollectionPromise: undefined,

  /**
   * Collection with idea announcments for the messageList.
   */
  _allAnnouncementCollection: undefined,
  _allAnnouncementCollectionPromise: undefined,

  /**
   * Collection from discussion notifications.
   */
  _allNotificationsDiscussionCollection: undefined,
  _allNotificationsDiscussionCollectionPromise: undefined,

  /**
   * Collection from user notifications
   */
  _allNotificationsUserCollection: undefined,
  _allNotificationsUserCollectionPromise: undefined,

  /**
   * Collection of user roles
   */
  _allLocalRoleCollection: undefined,
  _allLocalRoleCollectionPromise: undefined,

  /**
   * Collection from discussion
   */
  _allDiscussionModel: undefined,
  _allDiscussionModelPromise: undefined,

  //Deprecated -> This is the old way. Will be deleted soon
  _allDiscussionSourceCollection: undefined,
  _allDiscussionSourceCollectionPromise: undefined,
  //
  _currentUserModel: undefined,
  _currentUserModelPromise: undefined,

  /**
   * Collection of Facebook Access Tokens that current user is permissible to
   * view
   */
  _allFacebookAccessTokens: undefined,
  _allFacebookAccessTokensPromise: undefined,

  /**
   * The super collection of all types of sources that the front end supports
   */
  _allDiscussionSourceCollection2: undefined,
  _allDiscussionSourceCollection2Promise: undefined,

  /**
   * Collection of all the Accounts associated with the current User
   * 
   * @type {Account}
   */
  _allUserAccounts: undefined,
  _allUserAccountsPromise: undefined,

  /**
   * Collection of all the Widgets in the discussion
   * 
   * @type {Widget}
   */
  _allWidgets: undefined,
  _allWidgetsPromise: undefined,

  /**
   * Collection of all language preferences of the user
   * @type {UserLanguagePreference}
   */
  _allUserLanguagePreferences: undefined,
  _allUserLanguagePreferencesPromise: undefined,

  /**
   * Collection of all preferences of the user
   * @type {DiscussionPreference.Model}
   */
  _allUserPreferences: undefined,
  _allUserPreferencesPromise: undefined,

  /**
   * Collection of all preferences of the discussion
   * @type {DiscussionPreference.Model}
   */
  _allDiscussionPreferences: undefined,
  _allDiscussionPreferencesPromise: undefined,


  /**
   * Dictionary of Collections of each message's idea content link
   * This collection does not hit the network (2016-02-02)
   */
  _allMessageIdeaContentLinkCollectionDict: undefined,

  /**
   * Connected socket promise
   * 
   * @type socket
   */
  _connectedSocketPromise: undefined,

  /**
   * Returns the owning collection for the raw json of an object that 
   * doesn't have a model yet.  Primarily used when receiving an object on
   * the websocket
   * 
   * Ex: A harvester changes the title of an idea.  The updated idea will be put
   * on the websocket by the backend.  All frontends (all connected users) will
   * recieve this json.  It is fed in this function so that the corresponding
   * model in the collection can be updated (this update does NOT happen in this
   * method)
   * @param {BaseModel} item
   * @param {string} item['@type'] - The model type
   * @returns {BaseCollection}
   */
  getCollectionPromiseByType: function(item) {
    var type = Types.getBaseType(item['@type']);

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

      case Types.WIDGET:
        return this.getAllWidgetsPromise();
    }

    return null;
  },
  
  initialize: function(options){
  },

  /** An exception, the collection is instanciated from json sent in the HTML
   * of the frontend, not through an ajax request */
  getAllUsersCollectionPromise: function() {
    if (this._allUsersCollectionPromise) {
      return this._allUsersCollectionPromise;
    }

    this._allUsersCollection = new Agents.Collection();
    this._allUsersCollection.collectionManager = this;
    this._allUsersCollectionPromise = Promise.resolve(this._allUsersCollection.fetchFromScriptTag('users-json'))
        .thenReturn(this._allUsersCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allUsersCollectionPromise;
  },

  getAllMessageStructureCollectionPromise: function() {
    var that = this;

    if (this._allMessageStructureCollectionPromise) {
      return this._allMessageStructureCollectionPromise;
    }

    this._allMessageStructureCollection = new Message.Collection();
    this._allMessageStructureCollection.collectionManager = this;
    this._allMessageStructureCollectionPromise = Promise.resolve(this._allMessageStructureCollection.fetch())
      .then(function() {
        that.listenTo(Assembl.vent, 'socket:open', function() {
          //Yes, I want that in sentry for now
          console.debug("collectionManager: getAllMessageStructureCollectionPromise re-fetching because of socket re-open.");
          //console.log(that._allMessageStructureCollection);
          //WARNING:  This is wastefull.  But even if we had a mecanism to request only if there is new data, some specific models might have changed.
          //So the only way we could fix that is to add a generic mecanism that returns objects modified after a specific date, 
          // recursively taking into account any relationship in the viewdef.  Not likely to happen...
          
          /* Another aspect is that ALL messages onscreen will re-fetch and re-render
          This is wastefull (CPU usage and loaders and flashing for the user), 
          as in the specific case of messages it is relatively easy to get a
          reliable modification date */
          that._allMessageStructureCollection.fetch();
        });
        return that._allMessageStructureCollection;
      })
      .catch(function(e) {
        Raven.captureException(e);
      });

    return this._allMessageStructureCollectionPromise;
  },

  _waitingWorker: undefined,

  _messageFullModelRequests: {},

  /**
   * This class is essentially a subprocess that receives requests for 
   * specific models and a specific viewdef and:
   * - Combines them together to avoid swarming the server
   * - Splits them to respect limits on http get url length
   * - Dispaches the individual promises for each request even if they were
   *   actually processed together.
  */
  getMessageFullModelRequestWorker: function(collectionManager) {
      this.collectionManager = collectionManager,
      this.requests = this.collectionManager._messageFullModelRequests,

      this.addRequest = function(id) {
        /*
         * Emulates the defered pattern in bluebird, in this case we really do
         * need it
         */
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

        // This part manages GET url lenght
        // The problem is that each of our object id can take up to ~40 
        // characters.  To not exceed
        // the 2048 characters unofficial limit for GET URLs,
        // (IE and others), we only request up to do up to:
        // 2000/40 ~= 50 id's at a time
        var unservicedRequests = _.filter(this.requests, function(request) { return request['serverRequestInProgress'] === false; });
        var numUnservicedRequests = _.size(unservicedRequests);
        if (numUnservicedRequests >= 50) {
          if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
            console.log("Executing unserviced request immediately, unserviced queue size is now:", numUnservicedRequests);
          }

          //TODO:  This is suboptimal, as the server can still be hammered
          //with concurrent requests for the same data, causing
          //database contention.  Like the bit below, we should remember
          //how many requests are in transit, and not have more than 3

          //Alternatively, we could POST on a fake URL, with the url path
          //as the body of the request and avoid this spliting completely.

          this.executeRequest();
        }

        return promiseResolver.promise;
      },

      this.executeRequest = function() {

        var that = this,
            allMessageStructureCollectionPromise = this.collectionManager.getAllMessageStructureCollectionPromise(),
            ids = [];
        if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
          console.log("executeRequest fired, unregistering worker from collection Manager");
        }

        this.collectionManager._waitingWorker = undefined;

        _.each(that.requests, function(request, id) {
          //var structureModel = allMessageStructureCollection.get(id);
          if (request['serverRequestInProgress'] === false) {
            request['serverRequestInProgress'] = true;
            ids.push(id);
          }
        });
        allMessageStructureCollectionPromise.then(function(allMessageStructureCollection) {
          var PostQuery = require('../views/messageListPostQuery'),
              postQuery = new PostQuery(),
              viewDef = 'default';

          if (_.size(ids) > 0) {
            postQuery.addFilter(postQuery.availableFilters.POST_HAS_ID_IN, ids);
            postQuery.setViewDef(viewDef); //We want the full messages
            if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
              console.log("requesting message data from server for " + _.size(ids) + " messages");
            }

            postQuery.getResultRawDataPromise().then(function(results) {
              _.each(results, function(jsonData) {
                var id = jsonData['@id'],
                    structureModel = allMessageStructureCollection.get(id),
                    deferredList = that.requests[id];

                if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
                  console.log("executeRequest resolving for id", id, deferredList['count'], " requests queued for that id");
                }

                structureModel.set(structureModel.parse(jsonData));
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
      this.executeTimeout = setTimeout(function() {
        if (CollectionManager.prototype.DEBUG_LAZY_LOADING) {
          console.log("Executing unserviced request immediately (timeout reached)");
        }

        that.executeRequest();
      }, collectionManager.FETCH_WORKERS_LIFETIME);
    },

  /**
   * This returns a promise to a SINGLE model.
   * In practice, this model is a member of the proper collection, 
   * and requests to the server are optimised and batched together.
   * 
   * Primarily used by messages to get the actual body and other information
   * we do not want to eagerly preload.
   */
  getMessageFullModelPromise: function(id) {
    var that = this,
        allMessageStructureCollectionPromise = this.getAllMessageStructureCollectionPromise();

    if (!id) {
      var msg = "getMessageFullModelPromise(): Tried to request full message model with a falsy id.";
      console.error(msg);
      return Promise.reject(msg);
    }

    return allMessageStructureCollectionPromise.then(function(allMessageStructureCollection) {
      var structureModel = allMessageStructureCollection.get(id);

      if (structureModel) {
        if (structureModel.get("@view") === "default") {
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
        Raven.captureMessage("Structure model not in allMessageStructureCollection", {requested_message_id: id})
        return Promise.reject(msg);
      }
    });

  },

  /**
   * Retrieve fully populated models for the list of id's given
   *
   * @param {string[]} ids
   *          array of message id's
   * @returns Message.Model
   */
  getMessageFullModelsPromise: function(ids) {
      var that = this,
      returnedModelsPromises = [];

      _.each(ids, function(id) {
        var promise = that.getMessageFullModelPromise(id);
        returnedModelsPromises.push(promise);
      });

      return Promise.all(returnedModelsPromises).then(function(models) {
        //var args = Array.prototype.slice.call(arguments);
        //console.log("getMessageFullModelsPromise() resolved promises:", returnedModelsPromises);
        //console.log("getMessageFullModelsPromise() resolving with:", args);
        return Promise.resolve(models);
      }).catch(function(e) {
        console.error("getMessageFullModelsPromise: One or more of the id's couldn't be retrieved: ", e);
        return Promise.reject(e);
      });
    },

  getAllSynthesisCollectionPromise: function() {
    if (this._allSynthesisCollectionPromise) {
      return this._allSynthesisCollectionPromise;
    }

    this._allSynthesisCollection = new Synthesis.Collection();
    this._allSynthesisCollection.collectionManager = this;
    this._allSynthesisCollectionPromise = Promise.resolve(this._allSynthesisCollection.fetch())
        .thenReturn(this._allSynthesisCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allSynthesisCollectionPromise;
  },

  getAllIdeasCollectionPromise: function() {
    var that = this;
    if (this._allIdeasCollectionPromise) {
      return this._allIdeasCollectionPromise;
    }

    this._allIdeasCollection = new Idea.Collection();
    this._allIdeasCollection.collectionManager = this;
    this._allIdeasCollectionPromise = Promise.resolve(this._allIdeasCollection.fetch())
        .thenReturn(this._allIdeasCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    //Start listener setup
    //This is so the unread count update when setting a message unread.
    //See Message:setRead()
    Assembl.reqres.setHandler('ideas:update', function(ideas) {
      if (Ctx.debugRender) {
        console.log("ideaList: triggering render because app.on('ideas:update') was triggered");
      }

      that._allIdeasCollection.add(ideas, {merge: true});
    });

    //End listener setup

    return this._allIdeasCollectionPromise;

  },

  getAllIdeaLinksCollectionPromise: function() {
    if (this._allIdeaLinksCollectionPromise) {
      return this._allIdeaLinksCollectionPromise;
    }

    this._allIdeaLinksCollection = new IdeaLink.Collection();
    this._allIdeaLinksCollection.collectionManager = this;
    this._allIdeaLinksCollectionPromise = Promise.resolve(this._allIdeaLinksCollection.fetch())
        .thenReturn(this._allIdeaLinksCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allIdeaLinksCollectionPromise;
  },

  getAllExtractsCollectionPromise: function() {
    if (this._allExtractsCollectionPromise) {
      return this._allExtractsCollectionPromise;
    }

    this._allExtractsCollection = new Segment.Collection();
    this._allExtractsCollection.collectionManager = this;
    this._allExtractsCollectionPromise = Promise.resolve(this._allExtractsCollection.fetchFromScriptTag('extracts-json'))
        .thenReturn(this._allExtractsCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allExtractsCollectionPromise;
  },

  getAllPartnerOrganizationCollectionPromise: function() {
    if (this._allPartnerOrganizationCollectionPromise) {
      return this._allPartnerOrganizationCollectionPromise;
    }

    this._allPartnerOrganizationCollection = new Partners.Collection();
    this._allPartnerOrganizationCollection.collectionManager = this;
    this._allPartnerOrganizationCollectionPromise = Promise.resolve(this._allPartnerOrganizationCollection.fetch())
        .thenReturn(this._allPartnerOrganizationCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allPartnerOrganizationCollectionPromise;
  },

  getAllAnnouncementCollectionPromise: function() {
    if (this._allAnnouncementCollectionPromise) {
      return this._allAnnouncementCollectionPromise;
    }

    this._allAnnouncementCollection = new Announcement.Collection();
    this._allAnnouncementCollection.collectionManager = this;
    this._allAnnouncementCollectionPromise = Promise.resolve(this._allAnnouncementCollection.fetch())
        .thenReturn(this._allAnnouncementCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allAnnouncementCollectionPromise;
  },

  getNotificationsDiscussionCollectionPromise: function() {
    if (this._allNotificationsDiscussionCollectionPromise) {
      return this._allNotificationsDiscussionCollectionPromise;
    }

    this._allNotificationsDiscussionCollection = new NotificationSubscription.Collection();
    this._allNotificationsDiscussionCollection.setUrlToDiscussionTemplateSubscriptions();
    this._allNotificationsDiscussionCollection.collectionManager = this;
    this._allNotificationsDiscussionCollectionPromise = Promise.resolve(this._allNotificationsDiscussionCollection.fetch())
        .thenReturn(this._allNotificationsDiscussionCollection)
            .catch(function(e) {
              Raven.captureException(e);
            })

    return this._allNotificationsDiscussionCollectionPromise;
  },

  getNotificationsUserCollectionPromise: function() {
    if (this._allNotificationsUserCollectionPromise) {
      return this._allNotificationsUserCollectionPromise;
    }

    this._allNotificationsUserCollection = new NotificationSubscription.Collection();
    this._allNotificationsUserCollection.setUrlToUserSubscription();
    this._allNotificationsUserCollection.collectionManager = this;
    this._allNotificationsUserCollectionPromise = Promise.resolve(this._allNotificationsUserCollection.fetch())
        .thenReturn(this._allNotificationsUserCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allNotificationsUserCollectionPromise;

  },

  _parseGroupStates: function(models, allIdeasCollection) {
      var that = this;
      _.each(models, function(model) {
        _.each(model.states, function(state) {
          if (state.currentIdea !== undefined && state.currentIdea !== null) {
            var currentIdeaId = state.currentIdea;
            state.currentIdea = allIdeasCollection.get(currentIdeaId);
          }
        });
      });
      return models;
    },

  /*
   * Gets the stored configuration of groups and panels
   */
  getGroupSpecsCollectionPromise: function(viewsFactory, url_structure_promise, skip_group_state) {
      var that = this;

      if (skip_group_state === undefined) {
        skip_group_state = false;
      }

      if (this._allGroupSpecsCollectionPromise === undefined) {
        //FIXME:  This is slow.  Investigate fetching the single idea and adding it to the collection before fetching the whole collection
        var allIdeasCollectionPromise = this.getAllIdeasCollectionPromise();
        if (url_structure_promise === undefined) {
          url_structure_promise = Promise.resolve(undefined);
        }

        return Promise.join(allIdeasCollectionPromise, url_structure_promise,
          function(allIdeasCollection, url_structure) {
          var collection, data;
          if (url_structure !== undefined) {
            collection = url_structure;
          } else if (skip_group_state === false) {
            data = Storage.getStorageGroupItem();
            if (data !== undefined) {
              data = that._parseGroupStates(data, allIdeasCollection);
            }
          }

          if (data !== undefined) {
            collection = new groupSpec.Collection(data, {parse: true});
            if (!collection.validate()) {
              console.error("getGroupSpecsCollectionPromise(): Collection in local storage is invalid, will return a new one");
              collection = undefined;
            }
          }

          if (collection === undefined) {
            collection = new groupSpec.Collection();
            var panelSpec = require('../models/panelSpec.js');
            var PanelSpecTypes = require('../utils/panelSpecTypes.js');
            var groupState = require('../models/groupState.js');
            var preferences = Ctx.getPreferences();
            //console.log(preferences);
            var defaultPanels;
            // defined here and in groupContent.SimpleUIResetMessageAndIdeaPanelState
            if(preferences.simple_view_panel_order === "NIM") {
              defaultPanels = [{type: PanelSpecTypes.NAV_SIDEBAR.id },
              {type: PanelSpecTypes.IDEA_PANEL.id, minimized: true},
              {type: PanelSpecTypes.MESSAGE_LIST.id}];
            }
            else if (preferences.simple_view_panel_order === "NMI"){
              defaultPanels = [{type: PanelSpecTypes.NAV_SIDEBAR.id },
               {type: PanelSpecTypes.MESSAGE_LIST.id},
               {type: PanelSpecTypes.IDEA_PANEL.id, minimized: true}];
            }
            else {
              throw new Error("Invalid simple_view_panel_order preference: ", preferences.simple_view_panel_order);
            }
            var defaults = {
              panels: new panelSpec.Collection(defaultPanels,
                                                {'viewsFactory': viewsFactory }),
              navigationState: 'debate',
              states: new groupState.Collection([new groupState.Model()])
            };
            collection.add(new groupSpec.Model(defaults));

          }

          collection.collectionManager = that;
          Storage.bindGroupSpecs(collection);
          that._allGroupSpecsCollectionPromise = Promise.resolve(collection);
          return that._allGroupSpecsCollectionPromise;
        });
      }
      else {
        return this._allGroupSpecsCollectionPromise;
      }
    },

  getLocalRoleCollectionPromise: function() {
    if (this._allLocalRoleCollectionPromise) {
      return this._allLocalRoleCollectionPromise;
    }

    this._allLocalRoleCollection = new LocalRole.Collection();
    this._allLocalRoleCollection.collectionManager = this;
    this._allLocalRoleCollectionPromise = Promise.resolve(this._allLocalRoleCollection.fetch())
        .thenReturn(this._allLocalRoleCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allLocalRoleCollectionPromise;
  },

  getDiscussionModelPromise: function() {
    if (this._allDiscussionModelPromise) {
      return this._allDiscussionModelPromise;
    }

    this._allDiscussionModel = new Discussion.Model();
    this._allDiscussionModel.collectionManager = this;
    this._allDiscussionModelPromise = Promise.resolve(this._allDiscussionModel.fetch())
        .thenReturn(this._allDiscussionModel)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allDiscussionModelPromise;
  },

  getDiscussionSourceCollectionPromise: function() {
    if (this._allDiscussionSourceCollectionPromise) {
      return this._allDiscussionSourceCollectionPromise;
    }

    this._allDiscussionSourceCollection = new DiscussionSource.Collection();
    this._allDiscussionSourceCollection.collectionManager = this;
    this._allDiscussionSourceCollectionPromise = Promise.resolve(this._allDiscussionSourceCollection.fetch())
        .thenReturn(this._allDiscussionSourceCollection)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allDiscussionSourceCollectionPromise;
  },

  getDiscussionSourceCollectionPromise2: function() {
    if (this._allDiscussionSourceCollection2Promise) {
      return this._allDiscussionSourceCollection2Promise;
    }

    this._allDiscussionSourceCollection2 = new DiscussionSources.Collection();
    this._allDiscussionSourceCollection2.collectionManager = this;
    this._allDiscussionSourceCollection2Promise = Promise.resolve(this._allDiscussionSourceCollection2.fetch())
        .thenReturn(this._allDiscussionSourceCollection2)
            .catch(function(e) {
              Raven.captureException(e);
            });

    return this._allDiscussionSourceCollection2Promise;
  },

  getFacebookAccessTokensPromise: function() {
      if (this._allFacebookAccessTokensPromise) {
        return this._allFacebookAccessTokensPromise;
      }

      this._allFacebookAccessTokens = new Social.Facebook.Token.Collection();
      this._allFacebookAccessTokens.collectionManager = this;
      this._allFacebookAccessTokensPromise = Promise.resolve(this._allFacebookAccessTokens.fetch())
          .thenReturn(this._allFacebookAccessTokens)
          .catch(function(e) {
            Raven.captureException(e);
          });
      return this._allFacebookAccessTokensPromise;
    },

  getAllUserAccountsPromise: function() {
      if (this._allUserAccountsPromise) {
        return this._allUserAccountsPromise;
      }

      this._allUserAccounts = new Account.Collection();
      this._allUserAccounts.collectionManager = this;
      this._allUserAccountsPromise = Promise.resolve(this._allUserAccounts.fetch())
          .thenReturn(this._allUserAccounts)
          .catch(function(e) {
            Raven.captureException(e);
          });
      return this._allUserAccountsPromise;
    },

  getUserLanguagePreferencesPromise: function(Ctx){
    if (this._allUserLanguagePreferencesPromise) {
      return this._allUserLanguagePreferencesPromise;
    }

    if (Ctx.isUserConnected()) {
      this._allUserLanguagePreferences = new LanguagePreference.Collection();
      this._allUserLanguagePreferences.collectionManager = this;
      this._allUserLanguagePreferencesPromise = Promise.resolve(this._allUserLanguagePreferences.fetch())
        .thenReturn(this._allUserLanguagePreferences)
        .catch(function(e){
          Raven.captureException(e);
        });
    } else {
      this._allUserLanguagePreferences = new LanguagePreference.DisconnectedUserCollection();
      this._allUserLanguagePreferencesPromise = Promise.resolve(this._allUserLanguagePreferences);
    }
    return this._allUserLanguagePreferencesPromise;
  },

  /**
   * Creates a collection of IdeaContentLink Collection for a message
   * @param  {Object}  messageModel       The Backbone model of the message
   * @returns Array                      The collection of ideaContentLinks
   */
  getIdeaContentLinkCollectionOnMessage: function(messageModel){
    /*
      @TODO: Add efficient Collection management and caching
     */
    var id = messageModel.id,
        ideaContentLinks = messageModel.getIdeaContentLinks();

    var validIcls = _.filter(ideaContentLinks, function(icl){
      return ( (icl) && (_.has(icl, 'idIdea')) && (icl['idIdea'] !== null) );
    });

    //Could be an empty collection
    var tmp = new IdeaContentLink.Collection(validIcls, {message: messageModel});
    tmp.collectionManager = this;
    return tmp;
  },

  getAllWidgetsPromise: function() {
      if (this._allWidgetsPromise) {
        return this._allWidgetsPromise;
      }

      this._allWidgets = new Widget.Collection();
      this._allWidgets.collectionManager = this;
      this._allWidgetsPromise = Promise.resolve(this._allWidgets.fetch())
          .thenReturn(this._allWidgets)
          .catch(function(e) {
            Raven.captureException(e);
          });
      return this._allWidgetsPromise;
    },

  getWidgetsForContextPromise: function(context, idea, liveupdate_keys) {
    return this.getAllWidgetsPromise().then(function(widgets) {
      // TODO: Convert widgets into Infobar items, and use that as model.
      // Also add other sources for infobar items.
      return new Widget.WidgetSubset([], {
        parent: widgets,
        context: context,
        idea: idea,
        liveupdate_keys: liveupdate_keys});
    });
  },

  getConnectedSocketPromise: function() {
      if (this._connectedSocketPromise) {
        return this._connectedSocketPromise;
      }

      var socket = null;

      // Note: This does not solve the fact that the socket may disconnect.
      return this._connectedSocketPromise = new Promise(
        function(resolve) {
          socket = new Socket(resolve);
        });
    },

    getDiscussionPreferencePromise: function() {
      if (this._allDiscussionPreferencesPromise) {
        return this._allDiscussionPreferencesPromise;
      }

      this._allDiscussionPreferences = new DiscussionPreference.DiscussionPreferenceCollection();
      this._allDiscussionPreferences.collectionManager = this;
      this._allDiscussionPreferencesPromise = Promise.resolve(this._allDiscussionPreferences.fetch())
        .thenReturn(this._allDiscussionPreferences)
        .catch(function(e) {
          Raven.captureException(e);
        });
      return this._allDiscussionPreferencesPromise;
    },

    getUserPreferencePromise: function() {
      if (this._allUserPreferencesPromise) {
        return this._allUserPreferencesPromise;
      }

      // TODO: initalize from Ctx.getJsonFromScriptTag('preferences')
      // and replace Ctx.getPreferences by this.
      this._allUserPreferences = new DiscussionPreference.UserPreferenceCollection();
      this._allUserPreferences.collectionManager = this;
      this._allUserPreferencesPromise = Promise.resolve(this._allUserPreferences.fetch())
        .thenReturn(this._allUserPreferences)
        .catch(function(e) {
          Raven.captureException(e);
        });
      return this._allUserPreferencesPromise;
    }
});

var _instance;

module.exports = function() {
  if (!_instance) {
    _instance = new CollectionManager();
  }

  return _instance;
};
