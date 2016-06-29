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
   * Ensure that the front_end and back_end
   * share the same values!
   */
//Currently supported:
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
  constructor: function AttachmentModel() {
    Base.Model.apply(this, arguments);
  },

  /**
   * @type {String}
   */
  urlRoot: function() {
    //console.log("urlRoot called on ", this, this.get('objectAttachedToModel'));
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

  initialize: function(options) {
  },

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
    
    //console.log("AttachmentModel.parse() returning", rawModel);  
    return rawModel;
  },

  _saveMe: function(attrs, options){
    var d = this.getDocument();
    this.set('idAttachedDocument', d.id);
    return Backbone.Model.prototype.save.call(this, attrs, options); 
  },

  save: function(attrs, options) {
    if (this.isFailed()){
      //Don't know how good that is.
      return;
    }

    var that = this;

    if(this.get('attachmentPurpose') !== attachmentPurposeTypes.DO_NOT_USE.id) {
      
      /**
       * Update
       * =======
       *
       * The architecture to load attachments + documents has now changed
       * Documents are eagerly saved to the database upon creation.
       * The AttachmentView is responsible for the lifecycle of the document model.
       * As a result, the attachment model save should no longer do a two-step
       * save process. It is only responsible for saving itself.
       */
      if (options === undefined) {
        options = {};
      }
      var d = this.getDocument();
      //If the document was not STILL saved at the time of the attachment being saved
      if ( d.isNew() ) {
        Promise.resolve(this.get('document').save()).then(function(){
          //console.log("Saving attachments", attrs, options);
          return that._saveMe(attrs, options);
        })
      }
      else {
        return this._saveMe(attrs, options);
      }
    }
  },
  
  sync: function(method, model, options) {
    // console.log("attachment sync is called with arguments", arguments);
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
  
  validate: function(attrs, options) {
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

  getDocument: function() {
    return this.get('document');
  },

  getCreationDate: function(){
    var date = this.get('creation_date');
    if ( (date) && (typeof date === 'string') ){
      date = new Moment(date);
    }
    return date;
  },

  destroy: function(options){
    var d = this.getDocument(),
        that = this;
    return d.destroy({
      success: function(model, response){
        console.log('in document destroy success callback');
        return Base.Model.prototype.destroy.call(that);
      }
    });
  },

  /*
    Override toJSON of the attachment model in order to ensure that
    backbone does NOT try to parse the an object that causes
    recursive read, as there is a message object which contains
    the attachment model.
   */
  toJSON: function(options){
    var old = Base.Model.prototype.toJSON.call(this, options);
    //Remove the message attribute, as there is a circular dependency
    delete old['objectAttachedToModel'];
    return old;
  },

  /*
    Utility function. Makes the model unsavable.
   */
  setFailed: function(){
    this.setFailed = true;
  },

  isFailed: function(){
    return this.setFailed === true;
  }

});

/**
 * Attachements collection
 * Frontend model for :py:class:`assembl.models.attachment.Attachment`
 * @class app.models.attachments.AttachmentCollection
 * @extends app.models.base.BaseCollection
 */
 
var AttachmentCollection = Base.Collection.extend({
  constructor: function AttachmentCollection() {
    Base.Collection.apply(this, arguments);
  },

  /**
   * @type {String}
   */
  url: function() {
    //console("AttachmentCollection::url() about to return:", this.objectAttachedToModel.urlRoot() + '/' + this.objectAttachedToModel.getNumericId() + '/attachments');
    return this.objectAttachedToModel.urlRoot() + '/' + this.objectAttachedToModel.getNumericId() + '/attachments';
  },

  /**
   * The model
   * @type {PartnerOrganizationModel}
   */
  model: AttachmentModel,

  initialize: function(models, options) {
    if (!options.objectAttachedToModel) {
      console.log(options);
      throw new Error("objectAttachedToModel must be provided to calculate url");
    }
    else {
      this.objectAttachedToModel = options.objectAttachedToModel;
    }
  },

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

  destroyAll: function(options){
    return this.destroy(this.models, options);
  },

  saveAll: function(options){
    return this.save(this.models, options);
  }
});

module.exports = {
  attachmentPurposeTypes: attachmentPurposeTypes,
  Model: AttachmentModel,
  Collection: AttachmentCollection
};
