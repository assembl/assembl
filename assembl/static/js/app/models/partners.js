'use strict';
/**
 * 
 * @module app.models.partners
 */

var $ = require('jquery'),
    Base = require('./base.js'),
    i18n = require('../utils/i18n.js'),
    Ctx = require('../common/context.js');

/**
 * @class app.models.partners.PartnerOrganizationModel
 */
var PartnerOrganizationModel = Base.Model.extend({
  constructor: function PartnerOrganizationModel() {
    Base.Model.apply(this, arguments);
  },

  /**
   * @type {String}
   */
  urlRoot: Ctx.getApiV2DiscussionUrl('partner_organizations'),

  /**
   * Defaults
   * @type {Object}
   */

  defaults: {
    name: '',
    description: '',
    homepage: '',
    logo: '',
    is_initiator: false
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  }
});

/**
 * @class app.models.partners.PartnerOrganizationCollection
 */
var PartnerOrganizationCollection = Base.Collection.extend({
  constructor: function PartnerOrganizationCollection() {
    Base.Collection.apply(this, arguments);
  },

  /**
   * @type {String}
   */
  url: Ctx.getApiV2DiscussionUrl('partner_organizations'),

  /**
   * The model
   * @type {PartnerOrganizationModel}
   */
  model: PartnerOrganizationModel
});

module.exports = {
  Model: PartnerOrganizationModel,
  Collection: PartnerOrganizationCollection
};
