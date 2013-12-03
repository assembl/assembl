define(['backbone', 'jquery', 'app', 'i18n'], function(Backbone, $, app, i18n){
    'use strict';

    /**
     * @class SynthesisModel
     */
    var SynthesisModel = Backbone.Model.extend({

        /**
         * @init
         */
        initialize: function(){
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
        url: app.getApiUrl('synthesis/'),

        /**
         * Default values
         * @type {Object}
         */
        defaults: {
            subject: i18n.gettext('Add a title'),
            introduction: i18n.gettext('Add an introduction'),
            conclusion: i18n.gettext('Add a conclution')
        },

        /**
         * Overwritting the default method
         * @return {Boolean}
         */
        isNew: function(){
            return false;
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save();
        }

    });



    return {
        Model: SynthesisModel
    };

});
