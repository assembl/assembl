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


    /**
     * @class Collection
     *
     * BaseCollection which should be used by ALL collections
     */
    var BaseCollection = Backbone.Collection.extend({

        /**
         * Find the model by numeric id instead of string
         * ex: finds 'local:ModelName/30' if given '30'
         *
         * @param {Number} id
         * @return {BaseModel}
         */
        getByNumericId: function(id){
            var re = new RegExp(id+'$'),
                i = 0,
                model = this.models[i];

            while( model ){
                if( re.test(model.getId()) ){
                    break;
                }

                i += 1;
                model = this.models[i];
            }

            return model;
        }

    });

    return {
        Model: BaseModel,
        Collection: BaseCollection
    };
});
