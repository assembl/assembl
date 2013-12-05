define(['backbone', 'app'], function(Backbone, app){
    'use strict';

    /**
     * @class Model
     *
     * BaseModel which should be used by ALL models
     */
    var BaseModel = Backbone.Model.extend({

        /**
         * Overwritting the idAttribute
         * @type {String}
         */
        idAttribute: '@id',

        /**
         * Alias for `.get('id') || .get('@id')`
         * @return {string}
         */
        getId: function(){
            return this.get('id') || this.get('@id');
        }
    });

    return BaseModel;
});