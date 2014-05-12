define(['models/base', 'jquery', 'app', 'i18n', 'permissions'], function(Base, $, app, i18n, Permissions){
    'use strict';

    /**
     * @class SynthesisModel
     */
    var SynthesisModel = Base.Model.extend({

        /**
         * @init
         */
        initialize: function(){
            var that = this;
            this.on('change', this.onAttrChange, this);
        },
        
        /**
         * Overwritting the idAttribute
         * @type {String}
         */
        idAttribute: '@id',
        
        /**
         * The url
         * @type {String}
         */
        url: app.getApiUrl('explicit_subgraphs/synthesis/next_synthesis'),

        /**
         * Default values
         * @type {Object}
         */
        defaults: {
            subject: i18n.gettext('Add a title'),
            introduction: i18n.gettext('Add an introduction'),
            conclusion: i18n.gettext('Add a conclusion'),
        },

        /**
         * Overwritting the default method
         * @return {Boolean}
         */
        isNew: function(){
            return false;
        },


    });

    return {
        Model: SynthesisModel
    };

});
