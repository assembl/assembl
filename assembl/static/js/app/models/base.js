'use strict';

var Backbone = require('../shims/backbone.js'),
    Promise = require('bluebird'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js');

/**
 * @class Model
 *
 * BaseModel which should be used by ALL models
 */
var BaseModel = Backbone.Model.extend({

    /**
     * Get the numeric id fro the id string
     * ex: finds '30' if given 'local:ModelName/30'
     *
     * @param {Number} id
     * @return {BaseModel}
     */
    getNumericId: function () {
        var re = /\d+$/;
        if (re.test(this.id)) {
            //Return the numeric part

            return re.exec(this.id)[0]
        }
        else {
            //Cheat, return the id unmodified.  Useful for special
            //id's like "next_synthesis";
            return this.id;
        }
    },

    getCssClassFromId: function() {
        var re = /^(\w+):(\w+)\/(\d+)$/;
        if (re.test(this.id)) {
            return this.id.replace(re,"$1-$2-$3");
        }
        else {
            return this.id;
        }
    },

    /**
     * Get the innerText from the given `id` element
     * Parses the json and execute `.reset` method in the Model
     *
     * @param {String} id The script tag id
     */
    fetchFromScriptTag: function (id) {
        var json = null;
        try {
            json = Ctx.getJsonFromScriptTag(id);
        } catch (e) {
            throw new Error("Invalid json. " + e.message);
        }
        this.set(json);
    },

    toScriptTag: function (id) {
        Ctx.writeJsonToScriptTag(this.toJSON(), id);
    },

    url: function () {
        var base =
            _.result(this, 'urlRoot') ||
            _.result(this.collection, 'url') ||
            urlError();
        if (this.isNew()) return base;
        return base.replace(/([^\/])$/, '$1/') + encodeURIComponent(this.getNumericId());
    },

    /**
     * Overwritting the idAttribute
     * @type {String}
     */
    idAttribute: '@id',

    /**
     * Alias for `.get('id') || .get('@id') || .cid`
     * @return {string}
     */
    getId: function () {
        return this.get('@id') || this.get('id') || this.cid;
    },

    getBEType: function() {
        return this.get('@type');
    },

    getBaseType: function() {
        return Types.getBaseType(this.getBEType());
    },

    isInstance: function(type) {
        return Types.isInstance(this.getBEType(), type);
    },

    /**
     * Overwritting backbone's parse function
     * @return {Object} [description]
     */
    parse: function (resp, options) {
        var id = resp[this.idAttribute];

        if (resp['ok'] === true && id !== undefined) {
            if (this.collection !== undefined) {
                var existing = this.collection.get(id);
                if (existing === null || existing === undefined) {
                    this.set(this.idAttribute, id);
                    this.trigger("acquiredId");
                } else if (existing !== this) {
                    /* Those websockets are fast!
                     *
                     * We are in the case where the websocket created an
                     * object before 'this' got an id.  It means that the
                     * oldest object is 'this', and the 'existing' object
                     * is a duplicate we do not want.
                     */
                    //console.log("Existing: ", existing, "replacing by: ", this);
                    /* Views that do not listen to remove on the collection
                     * will have trouble...
                     */
                    this.collection.remove(existing);
                    //Normally this happens later, but we have to make sure
                    //the collection will see the duplicate
                    this.set(this.idAttribute, id);
                    this.trigger("acquiredId", existing);
                    //Re-merge the object from the socket, it may have more
                    //information.  Since we haven't set anything except the
                    //id yey, there is no chance we overwrite anything we
                    //do not want­.
                    this.collection.add(existing, {merge: true});

                    //Views should listen to this event an replace their model if necessary.
                    existing.trigger("replacedBy", this);
                    //console.log('replacing '+existing.cid+' with '+this.cid);
                } else {
                    console.log("base:parse(): this should not happen, but no harm...");
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
    fetchFromScriptTag: function (id) {
      var that = this;

      return Promise.delay(1).then(function () {
        var script = document.getElementById(id),
        json;
        if (!script) {
          throw new Error(Ctx.format("Script tag #{0} doesn't exist", id));
        }

        try {
          json = JSON.parse(script.textContent);
        } catch (e) {
          throw new Error("Invalid json. " + e.message);
        }
        that.reset(json);
        return that;
      });
    },

    /**
     * Find the model by the given cid
     * @return {BaseModel}
     */
    getByCid: function (cid) {
        var result = null;
        this.each(function (model) {
            if (model.cid === cid) {
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
    getByNumericId: function (id) {
        var re = new RegExp(id + '$'),
            i = 0,
            model = this.models[i];

        while (model) {
            if (re.test(model.getId())) {
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
    removeById: function (id) {
        var model = this.get(id);
        this.remove(model);
    },

    /**
     * Updates the given model into the collection
     * @param {object} item
     */
    updateFromSocket: function (item) {
        var model = this.get(item['@id']);
        var debug = false;
        if (item['@tombstone']) {
            if (debug) {
                console.log("Ignoring tombstone not in collection for id: " + item['@id']);
            }
            if (model) {
                if (debug) {
                    console.log("Removing from socket (tombstoned):", model)
                }
                this.remove(model);
            }
        }
        else if (model === null || model === undefined) {
            // oops, doesn't exist
            this.add(item);
            if (debug) {
                console.log("Adding from socket:")
                console.log(item);
            }

        }
        else {
            // yeah, it exists
            if (debug) {
                console.log("Merging from socket:")
                console.log(item);
            }
            this.add(item, {merge: true});
            if (debug) {
                console.log("Item is now:");
                console.log(item);
            }
        }
        if (debug) {
            console.log("collection is now:");
            console.log(this);
        }
    }

});

module.exports = {
    Model: BaseModel,
    Collection: BaseCollection
};


