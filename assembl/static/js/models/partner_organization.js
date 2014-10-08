define(function (require) {
    'use strict';

    var Base = require('models/base'),
        Ctx = require('modules/context'),
        $ = require('jquery'),
        i18n = require('utils/i18n');

    /**
     * @class PartnerOrganizationModel
     */
    var PartnerOrganizationModel = Base.Model.extend({

        /**
         * @type {String}
         */
        url: Ctx.getApiV2DiscussionUrl('partner_organizations/?view=default'),

        /**
         * Defaults
         * @type {Object}
         */
        defaults: {
            id: null,
            name: '',
            description: '',
            homepage: '',
            logo: '',
            is_initiator: false
        }
    });


    /**
     * @class PartnerOrganizationCollection
     */
    var PartnerOrganizationCollection = Base.Collection.extend({
        /**
         * @type {String}
         */
        url: Ctx.getApiV2DiscussionUrl('partner_organizations/?view=default'),

        /**
         * The model
         * @type {PartnerOrganizationModel}
         */
        model: PartnerOrganizationModel
    });

    return {
        Model: PartnerOrganizationModel,
        Collection: PartnerOrganizationCollection
    };

});
