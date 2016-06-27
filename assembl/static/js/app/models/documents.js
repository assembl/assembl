'use strict';
/**
 * 
 * @module app.models.documents
 */

var $ = require('jquery'),
    Base = require('./base.js'),
    i18n = require('../utils/i18n.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js');

/**
 * Represents a file or document (a remote url or a blob)
 * Frontend model for :py:class:`assembl.models.attachment.Document`
 * @class app.models.documents.DocumentModel
 * @extends app.models.Base.Model
 */

var DocumentModel = Base.Model.extend({
  constructor: function DocumentModel(){
    Base.Model.apply(this, arguments)
  },

  /**
   * @type {String}
   */
  urlRoot: Ctx.getApiV2DiscussionUrl('documents'),

  /**
   * Defaults
   * @type {Object}
   */
  defaults: {
    '@type': Types.DOCUMENT,
    uri: undefined,
    external_url: undefined
  },

  validate: function(attrs, options){
    /**
     * check typeof variable
     * */
  },

  isFileType: function(){
    return this.get('@type') === Types.FILE;
  }
});


var FileModel = DocumentModel.extend({
  constructor: function FileDocumentModel() {
    DocumentModel.apply(this, arguments);
  },

  defaults: _.extend({}, DocumentModel.prototype.defaults, {
    '@type': Types.FILE,
    fileAttribute: 'file' //A Backbone-model-file-upload attribute
  }),

  save: function(attrs, options){
    //This model takes a fileAttribute of raw_data, which the backend
    //will consume using a Multipart form header. In order to make the
    //push a multi-part form header, must pass the option formData.
    if (!options) {
      options = {};
    }
    if (!options.formData) {
      options.formData = true;
    }
    return DocumentModel.prototype.save.call(this, attrs, options);
  },

  isImageType: function(){
    var mime_type = this.get('mime_type');
    return /^image\/\w+/i.test(mime_type);
  }
});


/**
 * @class app.models.documents.PartnerOrganizationCollection
 */
var DocumentCollection = Base.Collection.extend({
  constructor: function DocumentCollection() {
    Base.Collection.apply(this, arguments);
  },

  model: DocumentModel

});

module.exports = {
  DocumentModel: DocumentModel,
  FileModel: FileModel,
  Collection: DocumentCollection
};
