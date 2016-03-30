'use strict';

var $ = require('jquery'),
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
 * Represents the link between an object (ex: Message, Idea) and a remote (url)
 * or eventually local document attached to it.
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
    external_url: undefined
  },

  initialize: function(options) {
  },

  parse: function(rawModel) {
    rawModel.document = new Document.Model(rawModel.document, {parse: true});
    //console.log("AttachmentModel.parse() returning", rawModel);
    return rawModel;
  },

  save: function(attrs, options) {
    var that = this;

    if(this.get('attachmentPurpose') !== attachmentPurposeTypes.DO_NOT_USE.id) {
      Promise.resolve(this.get('document').save()).then(function(){
        //console.log("Saving attachments", attrs, options);
        Backbone.Model.prototype.save.call(that, attrs, options);
      })
    }
  },
  
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
  }
});

/**
 * @class AttachmentCollection
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
  }
});

module.exports = {
  attachmentPurposeTypes: attachmentPurposeTypes,
  Model: AttachmentModel,
  Collection: AttachmentCollection
};
