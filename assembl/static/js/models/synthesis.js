define(['backbone', 'zepto', 'app'], function(Backbone, $, app){
    'use strict';

    /**
     * @class SynthesisModel
     */
    var SynthesisModel = Backbone.Model.extend({

        /**
         * @init
         */
        initialize: function(){
            this.on('change:subject', this.onAttrChange, this);
        },

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
            subject: 'Add a title'
        },

        isNew: function(){
            return false;
        },

        /**
         * @event
         */
        onAttrChange: function(){
            this.save({ subject: 'nada' });
        }

    });



    return {
        Model: SynthesisModel
    };

});
