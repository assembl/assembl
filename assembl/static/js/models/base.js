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
         * Overwritting backbone's parse function
         * @return {Object} [description]
         */
        parse: function(resp, options) {
            var id = resp['id'];

            if (resp['ok'] === true && id !== undefined){
                if (this.collection !== undefined){
                    var existing = this.collection.get(id);
                    if (existing === null || existing === undefined) {
                        this.set('@id', id);
                    } else if (existing !== this) {
                        console.log(existing);
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
         * Find the model by the given cid
         * @return {BaseModel}
         */
        getByCid: function(cid){
            var result = null;
            this.each(function(model){
                if(model.cid === cid){
                    result = model;
                }
            });
            return result;
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
        },

        /**
         * Updates the given model into the collection
         * @param {object} item
         */
        updateFromSocket: function(item){
            var model = this.get(item['@id']);
            var debug = false;
            if( item['@tombstone'] ){
                if (debug){
                    console.log("Removing from socket:")
                    console.log(model);
                }
                this.remove(model);
            }
            else if( model === null || model === undefined ){
                // oops, doesn't exist
                this.add(item);
                if (debug){
                    console.log("Adding from socket:")
                    console.log(item);
                }

            } 
            else {
                // yeah, it exists
                if (debug){
                    console.log("Merging from socket:")
                    console.log(item);
                }
                this.add(item, {merge: true});
                if (debug){
                    console.log("Item is now:");
                            console.log(item);
                }
            }
            if (debug){
                console.log("collection is now:");
                console.log(this);
            }
        }

    });

    return {
        Model: BaseModel,
        Collection: BaseCollection
    };
});
