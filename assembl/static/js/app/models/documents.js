'use strict';
/**
 * Represents a file or document (a remote url or a blob)
 * @module app.models.documents
 */
var $ = require('jquery'),
    Base = require('./base.js'),
    i18n = require('../utils/i18n.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js');
/**
 * Document model
 * Frontend model for :py:class:`assembl.models.attachment.Document`
 * @class app.models.documents.DocumentModel
 * @extends app.models.base.BaseModel
 */
var DocumentModel = Base.Model.extend({
  /**
   * @function app.models.documents.DocumentModel.constructor
   */
  constructor: function DocumentModel(){
    Base.Model.apply(this, arguments)
  },
  /**
   * @member {string} app.models.documents.DocumentModel.urlRoot
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
  /**
   * Validate the model attributes
   * @function app.models.discussionSource.sourceModel.validate
   */
  validate: function(attrs, options){
    /**
     * check typeof variable
     * */
  },
  /**
   * Checks if document type is a file
   * @returns {Boolean}
   * @function app.models.documents.DocumentModel.isFileType
   */
  isFileType: function(){
    return this.get('@type') === Types.FILE;
  }
});
/**
 * File model
 * Frontend model for :py:class:`assembl.models.attachment.Document`
 * @class app.models.documents.FileModel
 * @extends app.models.documents.DocumentModel
 */
var FileModel = DocumentModel.extend({
  /**
   * @function app.models.documents.FileModel.constructor
   */
  constructor: function FileDocumentModel() {
    DocumentModel.apply(this, arguments);
  },
  /**
   * Defaults
   * @type {Object}
   */
  defaults: _.extend({}, DocumentModel.prototype.defaults, {
    '@type': Types.FILE,
    fileAttribute: 'file' //A Backbone-model-file-upload attribute
  }),
  /**
   * Save the model into database
   * This model takes a fileAttribute of raw_data, which the backend will consume using a Multipart form header.
   * In order to make the push a multi-part form header, must pass the option formData.
   * @returns {jqXHR}
   * @function app.models.documents.FileModel.save
   */
  save: function(attrs, options){
    if (!options) {
      options = {};
    }
    if (!options.formData) {
      options.formData = true;
    }
    return DocumentModel.prototype.save.call(this, attrs, options);
  },
  /**
   * Returns a mime type 
   * @returns {String}
   * @function app.models.documents.FileModel.isImageType
   */
  isImageType: function(){
    var mime_type = this.get('mime_type');
    return /^image\/\w+/i.test(mime_type);
  }
});
/**
 * Documents collection
 * @class app.models.documents.DocumentCollection
 * @extends app.models.base.BaseCollection
 */
var DocumentCollection = Base.Collection.extend({
  /**
   * @function app.models.documents.DocumentCollection.constructor
   */
  constructor: function DocumentCollection() {
    Base.Collection.apply(this, arguments);
  },
  /**
   * The model
   * @type {DocumentModel}
   */
  model: DocumentModel
});

module.exports = {
  DocumentModel: DocumentModel,
  FileModel: FileModel,
  Collection: DocumentCollection
};
