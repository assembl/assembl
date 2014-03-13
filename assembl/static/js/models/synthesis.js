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
            app.on('user:loaded', function(user) {
                that.set('canSave', user.can(Permissions.EDIT_SYNTHESIS) );
                that.set('canSend', user.can(Permissions.SEND_SYNTHESIS) );
            });
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
            conclusion: i18n.gettext('Add a conclusion'),
            canSave: false,
            canSend: false
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
            if (this.get('canSave')) {
                this.save();
            }
        },

    });

    return {
        Model: SynthesisModel
    };

});
