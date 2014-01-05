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
         * Alias for `.get('id') || .get('@id') || .cid`
         * @return {string}
         */
        getId: function(){
            return this.get('@id') || this.get('id') || this.cid;
        },

        /**
         * Returns the numberic id
         * example: returns `17` in `ViewPost/17`
         *
         * @return {Number}
         */
        getNumericId: function(){
            var id = this.getId();
            return id.indexOf('/') >= 0 ? id.split('/')[1] : id;
        },

        /**
         * Overwritting backbone's parse function
         * @return {Object} [description]
         */
        parse: function(resp, options) {
            var id = resp['id'];

            if (resp['ok'] === true && id !== undefined){
                if (this.collection !== undefined){
                    var existing = this.collection.get(id);
                    if (existing === null) {
                        this.set('@id', id);
                    } else if (existing !== this) {
                        // those websockets are fast!
                        this.collection.remove(this);
                        this.trigger("replaced", existing);
                    } else {
                        // this should not happen, but no harm.
                    }
                }
            }
            return resp;
        }
    });


    /**
     * @class Collection
     *
     * BaseCollection which should be used by ALL collections
     */
    var BaseCollection = Backbone.Collection.extend({

        /**
         * Get the innerText from the given `id` element
         * Parses the json and execute `.reset` method in the collection
         *
         * @param {String} id The script tag id
         */
        fetchFromScriptTag: function(id){
            var script = document.getElementById(id),
                json;

            if( !script ){
                throw new Error(app.format("Script tag #{0} doesn't exist", id));
            }

            try {
                json = JSON.parse(script.textContent);
            } catch(e){
                throw new Error("Invalid json. " + e.message);
            }

            this.reset(json);
        },
        

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
        },


        /**
         * Removes a model by the given id
         * @param  {string} id
         */
        removeById: function(id){
            var model = this.get(id);
            this.remove(model);
        }

    });

    return {
        Model: BaseModel,
        Collection: BaseCollection
    };
});
