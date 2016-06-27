'use strict';
/**
 * 
 * @module app.models.announcement
 */

var $ = require('jquery'),
    Promise = require('bluebird'),
    Base = require('./base.js'),
    i18n = require('../utils/i18n.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js');

/**
 * @class AnnouncementModel
 * Represents an announcement, a mutable message-like object, with an author and
 * a date
 */
var AnnouncementModel = Base.Model.extend({
  /**
   * Defaults
   * @type {Object}
   */
  defaults: {
    //'@type': Types.ANNOUNCEMENT,
    //"creation_date": undefined,
    //"modification_date": undefined,
    "creator": undefined,
    "last_updated_by": undefined, 
    "title": undefined,
    "body": undefined,
    "idObjectAttachedTo": undefined,
    //Only for idea announcements
    "should_propagate_down": undefined
  },

  constructor: function AnnouncementModel() {
    Base.Model.apply(this, arguments);
  },

  initialize: function(options) {
    this.on("invalid", function(model, error) {
      console.log(model.id + " " + error);
    });
  },

  validate: function(attrs, options) {
    if(!this.get('idObjectAttachedTo')) {
      return "Object attached to is missing";
    }
    if(!this.get('last_updated_by')) {
      return "Attached document is missing";
    }
    if(!this.get('creator')) {
      return "Creator is missing";
    }
  },

  /** 
   * Return a promise for the post's creator
   */
  getCreatorPromise: function() {
    var that = this;

    return this.collection.collectionManager.getAllUsersCollectionPromise()
      .then(function(allUsersCollection) {
        var creatorModel = allUsersCollection.get(that.get('creator'));
        if(creatorModel) {
          return Promise.resolve(creatorModel);
        }
        else {
          return Promise.reject("Creator " + that.get('creator') + " not found in allUsersCollection");
        }
        
      });
  }
});

/**
 * @class PartnerOrganizationCollection
 */
var AnnouncementCollection = Base.Collection.extend({
  constructor: function AnnouncementCollection() {
    Base.Collection.apply(this, arguments);
  },

  /**
   * @type {String}
   */
  url: Ctx.getApiV2DiscussionUrl('announcements'),
  
  /**
   * The model
   * @type {PartnerOrganizationModel}
   */
  model: AnnouncementModel
});

module.exports = {
  Model: AnnouncementModel,
  Collection: AnnouncementCollection
};
