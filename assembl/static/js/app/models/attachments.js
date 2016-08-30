'use strict';
/**
 * Represents the link between an object (ex: Message, Idea) and a remote (url) or eventually local document attached to it.
 * @module app.models.attachments
 */
var $ = require('jquery'),
    _ = require('underscore'),
    Moment = require("moment"),
    Base = require('./base.js'),
    i18n = require('../utils/i18n.js'),
    Ctx = require('../common/context.js'),
    Promise = require('bluebird'),
    Types = require('../utils/types.js'),
    Document = require('../models/documents.js');
    
var attachmentPurposeTypes = {
  /** 
   * Ensure that the front_end and back_end share the same values!
   */
  /**
   * Currently supported:
   */
  DO_NOT_USE: {
    id: 'DO_NOT_USE', 
    label: i18n.gettext('Do not show anything special')
  },
  EMBED_ATTACHMENT: {
    id: 'EMBED_ATTACHMENT',
    label: i18n.gettext('Show the following preview at the end of your message')
  }
  /** 
   * Future:
   * 'EMBED_INLINE'
   * 'BACKGROUND_IMAGE'
   * 'FORCE_DOWNLOAD_DOCUMENT'
   */
};
/**
 * Attachement model
 * Frontend model for :py:class:`assembl.models.attachment.Attachment`
 * @class app.models.attachments.AttachmentModel
 * @extends app.models.base.BaseModel
 */
var AttachmentModel = Base.Model.extend({
  /**
   * @function app.models.attachments.AttachmentModel.constructor
   */
  constructor: function AttachmentModel() {
    Base.Model.apply(this, arguments);
  },
  /**
   * Returns api url dedicated to attachments
   * @returns {String}
   * @function app.models.attachments.AttachmentModel.urlRoot
   */
  urlRoot: function() {
    return this.get('objectAttachedToModel').getApiV2Url() + '/attachments';
  },
  /**
   * Defaults
   * @type {Object}
   */
  defaults: {
    id: undefined,
    // Link to the Document model's id
    idAttachedDocument: undefined,
    document: undefined,
    idObjectAttachedTo: undefined,
    objectAttachedToModel: undefined,
    // Who created the attachment
    idCreator: undefined,
    title: undefined,
    description: undefined,
    attachmentPurpose: attachmentPurposeTypes.EMBED_ATTACHMENT.id,
    external_url: undefined,
    creation_date: new Moment().utc()
  },
  /**
   * Returns the model of the attachment according to its type (document or file)
   * @returns {BaseModel}
   * @function app.models.attachments.AttachmentModel.parse
   */
  parse: function(rawModel) {
    switch (rawModel.document['@type']){
      case Types.DOCUMENT:
        rawModel.document = new Document.DocumentModel(rawModel.document, {parse: true});
        break;
      case Types.FILE:
        rawModel.document = new Document.FileModel(rawModel.document, {parse: true});
        break;
      default:
        return new Error("The document model does not have a @type associated!" + rawModel.document);
    }
    return rawModel;
  },
  /**
   * Set the id of the model attachment and save the model into database  
   * @param {Object} attrs
   * @param {Object} options
   * @returns {jqXHR}
   * @function app.models.attachments.AttachmentModel._saveMe
   */
  _saveMe: function(attrs, options){
    var d = this.getDocument();
    this.set('idAttachedDocument', d.id);
    return Backbone.Model.prototype.save.call(this, attrs, options); 
  },
  /**
   * Update
   * =======
   *
   * The architecture to load attachments + documents has now changed.
   * Documents are eagerly saved to the database upon creation.
   * The AttachmentView is responsible for the lifecycle of the document model.
   * As a result, the attachment model save should no longer do a two-step save process.
   * It is only responsible for saving itself.
   * @param {Object} attrs
   * @param {Object} options
   * @function app.models.attachments.AttachmentModel.save
   */
  save: function(attrs, options) {
    if (this.isFailed()){
      //Don't know how good that is.
      return;
    }
    var that = this;
    if(this.get('attachmentPurpose') !== attachmentPurposeTypes.DO_NOT_USE.id) {
      if (options === undefined) {
        options = {};
      }
      var d = this.getDocument();
      //If the document was not STILL saved at the time of the attachment being saved
      if ( d.isNew() ) {
        Promise.resolve(this.get('document').save()).then(function(){
          return that._saveMe(attrs, options);
        })
      }
      else {
        return this._saveMe(attrs, options);
      }
    }
  },
  /**
   * This method uses a switch according to a CRUD operation
   * Default: Used to persist the state of the model to the server.
   * Update: It does nothing
   * Create: Set the type attribute to the model
   * @param {String} method - update/create/read/delete methods
   * @param {BaseModel} model - the model to be save
   * @param {Object} options - It fires success or error message
   * @function app.models.attachments.AttachmentModel.sync
   */
  sync: function(method, model, options) {
    switch(method) {
      case 'update':
      case 'create':
        model.set('idAttachedDocument', this.get('document').id);
        var objectAttachedToBaseType = Types.getBaseType(this.get('objectAttachedToModel').get('@type'));
        if(objectAttachedToBaseType === Types.POST) {
          model.set('@type', Types.POST_ATTACHMENT);
        }
        else if(objectAttachedToBaseType === Types.IDEA) {
          model.set('@type', Types.IDEA_ATTACHMENT);
        }
        else {
          throw new Error("Unknown objectAttachedToBaseType");
        }
      default:
        return Backbone.sync(method, model, options);
    }
  },
  /**
   * Returns an error message if one of those attributes (objectAttachedToModel, document, idCreator) is missing
   * @returns {String}
   * @function app.models.attachments.AttachmentModel.validate
   */
  validate: function() {
    if(!this.get('objectAttachedToModel')) {
      return "Object attached to is missing";
    }
    if(!this.get('document')) {
      return "Attached document is missing";
    }
    if(!this.get('idCreator')) {
      return "Creator is missing";
    }
  },
  /**
   * Returns the document attributes from the model
   * @returns {Object}
   * @function app.models.attachments.AttachmentModel.getDocument
   */
  getDocument: function() {
    return this.get('document');
  },
  /**
   * Returns the creation date of the attachment
   * @returns {Moment}
   * @function app.models.attachments.AttachmentModel.getCreationDate
   */
  getCreationDate: function(){
    var date = this.get('creation_date');
    if ( (date) && (typeof date === 'string') ){
      date = new Moment(date);
    }
    return date;
  },
  /**
   * Destroys or removes the document from the server by using the Backbone.sync method which delegates the HTTP "delete" request.
   * @function app.models.attachments.AttachmentModel.destroy
   */
  destroy: function(options){
    var d = this.getDocument(),
        that = this;
    return d.destroy({
      success: function(model, response){
        return Base.Model.prototype.destroy.call(that);
      },
      error: function(model, response){
        console.warn("Could NOT destroy document model id " + d.id
                     + "\nContinuing to destroy attachment id " + this.id);
        return Base.Model.prototype.destroy.call(that); 
      }
    });
  },
  /**
   * Return a copy of the model's attributes for JSON stringification.
   * Override toJSON of the attachment model in order to ensure that backbone does NOT try to parse the an object that causes recursive read, as there is a message object which contains the attachment model.
   * @param {Object} options
   * @returns {Object}
   * @function app.models.attachments.AttachmentModel.toJSON
   */
  toJSON: function(options){
    var old = Base.Model.prototype.toJSON.call(this, options);
    //Remove the message attribute, as there is a circular dependency
    delete old['objectAttachedToModel'];
    return old;
  },
  /**
   * Utility function. Makes the model unsavable.
   * @function app.models.attachments.AttachmentModel.setFailed
   */
  setFailed: function(){
    this.setFailed = true;
  },
  /**
   * Returns if the model is unsavable.
   * @returns {Boolean}
   * @function app.models.attachments.AttachmentModel.isFailed
   */
  isFailed: function(){
    return this.setFailed === true;
  }
});
/**
 * Attachements collection
 * @class app.models.attachments.AttachmentCollection
 * @extends app.models.base.BaseCollection
 */
var AttachmentCollection = Base.Collection.extend({
  /**
   * @function app.models.attachments.AttachmentCollection.constructor
   */
  constructor: function AttachmentCollection() {
    Base.Collection.apply(this, arguments);
  },
  /**
   * Returns api url dedicated to attachments
   * @returns {String}
   * @function app.models.attachments.AttachmentCollection.url
   */
  url: function() {
    return this.objectAttachedToModel.urlRoot() + '/' + this.objectAttachedToModel.getNumericId() + '/attachments';
  },
  /**
   * The model
   * @type {PartnerOrganizationModel}
   */
  model: AttachmentModel,
  /**
   * @function app.models.attachments.AttachmentCollection.initialize
   */
  initialize: function(models, options) {
    if (!options.objectAttachedToModel) {
      throw new Error("objectAttachedToModel must be provided to calculate url");
    }
    else {
      this.objectAttachedToModel = options.objectAttachedToModel;
      _.each(models, function(model){
        model.objectAttachedToModel = options.objectAttachedToModel; 
      });
    }
    
    this.limits = options.limits || {};
    this.isFailed = options.failed || false;
  },
  /**
   * Compares dates between 2 documents
   * @returns {Number}
   * @function app.models.attachments.AttachmentCollection.comparator
   */
  comparator: function(one, two){
    var d1 = one.getDocument(),
        d2 = two.getDocument();
    var cmp = function (a, b){
      if ( a.getCreationDate().isBefore(b.getCreationDate()) ){
        return -1;
      }
      if ( b.getCreationDate().isBefore(a.getCreationDate()) ){
        return 1;
      }
      else {
        return 0;
      }
    };
    if ( ((d1.isFileType()) && (d2.isFileType())) || ((!d1.isFileType()) && (!d2.isFileType())) ){
      return cmp(one, two);
    }
    else if ( (d1.isFileType()) && (!d2.isFileType()) ){
      return -1;
    }
    else if ( (!d1.isFileType()) && (d2.isFileType()) ){
      return 1;
    }
    else { return 0; }
  },
  
  /**
   * Helper method to destroy the models in a collection
   * @param  {Array|Backbone.Model} models    Model or Array of models  
   * @param  {Object} options   Options hash to send to every model when destroyed
   * @returns {Promse} if model was persisted, returns jqXhr else false
   * @function app.models.attachments.AttachmentCollection.destroy
   */
  destroy: function(models, options){
    if (!models){
      return Promise.resolve(false);
    }
    if (!_.isArray(models)){
      return Promise.resolve(models.destroy(options));
    }
    return Promise.each(models, function(model){
      model.destroy(options);
    });
  },
  /**
  * Save models into database
  * @param {Object} models
  * @param {Object} options
  * @returns {Promise}
  * @function app.models.attachments.AttachmentCollection.save
  */ 
  save: function(models, options){
    if (!models){
      return Promise.resolve(false);
    }
    if (!_.isArray(models)){
      return Promise.resolve(models.save(options));
    }
    return Promise.each(models, function(model){
      model.save(options);
    });
  },
  /**
  * Destroy the collection
  * @param {Object} options
  * @returns {jqXHR}
  * @function app.models.attachments.AttachmentCollection.destroyAll
  */ 
  destroyAll: function(options){
    return this.destroy(this.models, options);
  },
  /**
  * Save models into database
  * @param {Object} options
  * @returns {jqXHR}
  * @function app.models.attachments.AttachmentCollection.saveAll
  */ 
  saveAll: function(options){
    return this.save(this.models, options);
  },

  /*
    takes an array of models and makes validation check
   */
  addValidation: function(models){
    //If there is a count limit, override the old data (remove them first, though)
    //The removal is done in a FIFO format
    
    if (!models){
      return [];
    }

    var correctedNumberModelsCollection = models,
        that = this;

    if (!this.isCountLimitCorrect(models)){
      correctedNumberModelsCollection= this.getCorrectCountedCollection(models);
      if (this.length > models.length){
        for (var i in correctedNumberModelsCollection.count){
          var modelToRemove = this.shift();
          modelToRemove.destroy();
        }
      }
      else {
        this.each(function(model){
          model.destroy();
        });
      }

      correctedNumberModelsCollection = correctedNumberModelsCollection.collection;
    }

    _.each(correctedNumberModelsCollection, function(model){
      if (!that.isTypeLimitCorrect(model)){
        model.typeLimitReached = true;
        model.trigger("limit", "type");
      }
    });
    
    //Remove the naughty models from the collection
    models = _.filter(correctedNumberModelsCollection, function(model){
      return model.typeLimitReached !== true;
    });
    //If it passes both checks, return it
    return models;
  },

  /*
    Override the add operation to set limits, if any exists
   */
  add: function(models, options){
    if (!this.limits || this.isFailed){
      return Base.Collection.prototype.add.apply(this, arguments);
    }

    if (!(_.isArray(models))){
      models = [models];
    }
    models = this.addValidation(models);

    if (!(models) && (models.length > 0)) {
      return;  //This might be the wrong operation
    }

    return Base.Collection.prototype.add.call(this, models, options);
  },

  isTypeLimitCorrect: function(model){
    if (model === undefined || (_.isArray(model) && _.isEmpty(model))){
      //Not relevant
      return true;
    }
    if ((this.limits.type !== null) && (_.isString(this.limits.type)) ){
      if ( !(model.getDocument().get('mime_type').includes(this.limits.type)) ){
        return false;
      }
    }
    return true;
  },

  isCountLimitCorrect: function(models){
    if (models === undefined || (_.isArray(models) && _.isEmpty(models))){
      //Not relevant
      return true;
    }
    if ((this.limits.count) && (_.isNumber(this.limits.count)) ){
      if (_.isArray(models)){
        if (this.length + models.length > this.limits.count){
          return false;
        }
      }
      //Plus one because models has a count of 1 if it is not an array
      if (this.length + 1 > this.limits.count) {
        return false;
      }
    }
    return true;
  },

  getCorrectCountedCollection: function(models){
    if (_.isArray(models)){
      if (models.length > this.limits.count){
        return {
          collection: models.slice(0, this.limits.count-1),
          count: this.collection.length  
        }
      }
    }
    return {
      collection: [models],
      count: 1
    }
  },
});

module.exports = {
  attachmentPurposeTypes: attachmentPurposeTypes,
  Model: AttachmentModel,
  Collection: AttachmentCollection
};
