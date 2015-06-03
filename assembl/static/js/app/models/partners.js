'use strict';

var $ = require('../shims/jquery.js'),
    Base = require('./base.js'),
    i18n = require('../utils/i18n.js'),
    Ctx = require('../common/context.js');

/**
 * @class PartnerOrganizationModel
 */
var PartnerOrganizationModel = Base.Model.extend({

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

    validate: function(attrs, options){
        /**
         * check typeof variable
         * */

    }
});


/**
 * @class PartnerOrganizationCollection
 */
var PartnerOrganizationCollection = Base.Collection.extend({
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
