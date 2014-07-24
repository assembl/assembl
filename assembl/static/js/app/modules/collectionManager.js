'use strict';

define(function(require){

  var Assembl = require('modules/assembl'),
      Message = require('models/message'),
         Idea = require('models/idea'),
      Segment = require('models/segment'),
         User = require('models/user'),
            $ = require('jquery'),
        Types = require('utils/types'),
         i18n = require('utils/i18n');
     
  /**
   * @class CollectionManager
   * 
   * A singleton to manage lazy loading of server collections
   */
  var CollectionManager = Marionette.Controller.extend({
    /**
     * Collection with all users in the discussion.
     * @type {UserCollection}
     */
    _allUsersCollection : undefined,
    
    _allUsersCollectionPromise : undefined,
    
    /**
     * Collection with all messsages in the discussion.
     * @type {MessageCollection}
     */
    _allMessageStructureCollection : undefined,
    
    _allMessageStructureCollectionPromise : undefined,

    /**
     * Collection with all ideas in the discussion.
     * @type {SegmentCollection}
     */
    _allIdeasCollection : undefined,
    
    _allIdeasCollectionPromise : undefined,
    
    /**
     * Collection with all idea links in the discussion.
     * @type {MessageCollection}
     */
    _allIdeaLinksCollection : undefined,
    
    _allIdeaLinksCollectionPromise : undefined,

    /**
     * Collection with all extracts in the discussion.
     * @type {SegmentCollection}
     */
    _allExtractsCollection : undefined,
    
    _allExtractsCollectionPromise : undefined,
    

    initialize: function(options){

    },
    

    /**
     * Returns the collection from the giving object's @type .
     * Used by the socket to sync the collection.
     * TODO:  REWRITE AS PROMISES
     * @param {BaseModel} item
     * @param {String} [type=item['@type']] The model type
     * @return {BaseCollection}
     */
    getCollectionByType: function(item, type){
        type = type || item['@type'];

        switch(type){
            case Types.EXTRACT:
                return this._allExtractsCollection;

            case Types.IDEA:
            case Types.ROOT_IDEA:
            case Types.PROPOSAL:
            case Types.ISSUE:
            case Types.CRITERION:
            case Types.ARGUMENT:
                return this._allIdeasCollection;

            case Types.IDEA_LINK:
                return this._allIdeaLinksCollection;

            case Types.POST:
            case Types.ASSEMBL_POST:
            case Types.SYNTHESIS_POST:
            case Types.IMPORTED_POST:
            case Types.EMAIL:
            case Types.IDEA_PROPOSAL_POST:
                return this._allMessageStructureCollection;

            case Types.USER:
                return this._allUsersCollection;

            case Types.SYNTHESIS:
                return assembl.syntheses;
        }

        return null;
    },
    
    getAllUsersCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allUsersCollectionPromise === undefined) {
        this._allUsersCollection = new User.Collection();
        this._allUsersCollection.collectionManager = this;
        this._allUsersCollectionPromise = this._allUsersCollection.fetchFromScriptTag('users-json');
        this._allUsersCollectionPromise.done(function() {
          deferred.resolve(that._allUsersCollection);
        });
      }
      else {
        this._allUsersCollectionPromise.done(function(){
          deferred.resolve(that._allUsersCollection);
        });
      }
      return deferred.promise();
    },
  
    getAllMessageStructureCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allMessageStructureCollectionPromise === undefined) {
        this._allMessageStructureCollection = new Message.Collection();
        this._allMessageStructureCollection.collectionManager = this;
        this._allMessageStructureCollectionPromise = this._allMessageStructureCollection.fetch({
          success: function(collection, response, options) {
            deferred.resolve(that._allMessageStructureCollection);
          }
        });
      }
      else {
        this._allMessageStructureCollectionPromise.done(function(){
          deferred.resolve(that._allMessageStructureCollection);
        });
      }
      return deferred.promise();
    },
    
    getAllIdeasCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allIdeasCollectionPromise === undefined) {
        this._allIdeasCollection = new Idea.Collection();
        this._allIdeasCollection.collectionManager = this;
        this._allIdeasCollectionPromise = this._allIdeasCollection.fetchFromScriptTag('ideas-json');
        this._allIdeasCollectionPromise.done(function(collection, response, options) {
          deferred.resolve(that._allIdeasCollection);
          //Start listener setup
          /*
            this.listenTo(this.ideas, "all", function(eventName) {
              console.log("ideaList collection event received: ", eventName);
            });
            */
            
          //This is so the unread count update when setting a message unread.
          //See Message:setRead()
          Assembl.reqres.setHandler('ideas:update', function(ideas){
            if(Ctx.debugRender) {
              console.log("ideaList: triggering render because app.on('ideas:update') was triggered");
            }
            this._allIdeasCollection.add(ideas, {merge: true});
          });
          
          //End listener setup
        });
      }
      else {
        this._allIdeasCollectionPromise.done(function(){
          deferred.resolve(that._allIdeasCollection);
        });
      }
      return deferred.promise();
    },   
    
    getAllIdeaLinksCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allIdeaLinksCollectionPromise === undefined) {
        this._allIdeaLinksCollection = new IdeaLink.Collection();
        this._allIdeaLinksCollection.collectionManager = this;
        this._allIdeaLinksCollectionPromise = this._allIdeaLinksCollection.fetch({
          success: function(collection, response, options) {
            deferred.resolve(that._allIdeaLinksCollection);
          }
        });
      }
      else {
        this._allIdeaLinksCollectionPromise.done(function(){
          deferred.resolve(that._allIdeaLinksCollection);
        });
      }
      return deferred.promise();
    },
    
    getAllExtractsCollectionPromise : function() {
      var that = this,
      deferred = $.Deferred();

      if (this._allExtractsCollectionPromise === undefined) {
        this._allExtractsCollection = new Segment.Collection();
        this._allExtractsCollection.collectionManager = this;
        this._allExtractsCollectionPromise = this._allExtractsCollection.fetchFromScriptTag('extracts-json');
        this._allExtractsCollectionPromise.done(function() {
          deferred.resolve(that._allExtractsCollection);
        });
      }
      else {
        this._allExtractsCollectionPromise.done(function(){
          deferred.resolve(that._allExtractsCollection);
        });
      }
      return deferred.promise();
    }
  });
    
  var _instance;

  return function() {
    if ( !_instance ) {
      _instance = new CollectionManager();
    }
    return _instance;
  };

});