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
        url: app.getApiUrl('next_synthesis/'),

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
            var currentUser = app.getCurrentUser();

            if( currentUser.can(Permissions.EDIT_SYNTHESIS) ){
                this.save();
            }
        }

    });

    return {
        Model: SynthesisModel
    };

});
