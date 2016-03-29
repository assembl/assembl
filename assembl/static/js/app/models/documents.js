'use strict';

var $ = require('jquery'),
    Base = require('./base.js'),
    i18n = require('../utils/i18n.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js');

/**
 * @class FileModel
 * Represents a file or document (a remote url or a blob)
 */
var DocumentModel = Base.Model.extend({
  constructor: function DocumentModel() {
    Base.Model.apply(this, arguments);
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
    uri: undefined
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  }
});

/**
 * @class PartnerOrganizationCollection
 */
var DocumentCollection = Base.Collection.extend({
  constructor: function DocumentCollection() {
    Base.Collection.apply(this, arguments);
  },
  /**
   * @type {String}
   */
//  url: Ctx.getApiV2DiscussionUrl('partner_organizations'),

  /**
   * The model
   * @type {PartnerOrganizationModel}
   */
  model: DocumentModel
});

module.exports = {
  Model: DocumentModel,
  Collection: DocumentCollection
};
