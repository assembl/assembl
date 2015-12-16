'use strict';

var Backbone = require('../shims/backbone.js'),
    Promise = require('bluebird'),
    Ctx = require('../common/context.js'),
    _ = require('../shims/underscore.js'),
    Types = require('../utils/types.js');

/**
 * @class BaseModel
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
  getNumericId: function() {
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
      return this.id.replace(re, "$1-$2-$3");
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
  fetchFromScriptTag: function(id) {
    var json = null;
    try {
      json = Ctx.getJsonFromScriptTag(id);
    } catch (e) {
      throw new Error("Invalid json. " + e.message);
    }

    this.set(json);
  },

  toScriptTag: function(id) {
    Ctx.writeJsonToScriptTag(this.toJSON(), id);
  },

  url: function() {
    var base =
        _.result(this, 'urlRoot') ||
        _.result(this.collection, 'url');
    if (!base) {
      // equivalent to private Backbone.urlError
      throw new Error('A "url" property or function must be specified');
    }

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
  getId: function() {
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
  parse: function(resp, options) {
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
  },

  /**
   * The base of the Router URL for this class. Set in app/router.js.
   * 2015/11/25 Currently only defined on post, idea and users
   */
  routerBaseUrl: null,

  /**
   * Get the Router URL of an object
   *
   * @param {Object} options - optionally pass in options 
   * @param {boolean} options.relative - Optional. Default URL is absolute. Can force to be relative by setting passing {'relative' : true}
   * @param {Object} options.parameters - Optional. Can pass in query string as an object. Eg. {'foo': 'bar', 'baz': 'cookie'}
   * @return {String|null} The fully composed URL of the post/idea
  */
  getRouterUrl: function(options){
      if (!this.id || this.routerBaseUrl === null) {
        return null;
      }
      var encodedId = encodeURIComponent(this.id),
          relPath = this.routerBaseUrl + encodedId,
          params = _.has(options, 'parameters') ? options.parameters : {};

      if (options){
        if (_.has(options, 'relative') && options.relative === true){
          return Ctx.appendExtraURLParams(
            Ctx.getRelativeURLFromDiscussionRelativeURL(relPath),
            params
          );
        }
      }

      return Ctx.appendExtraURLParams(
        Ctx.getAbsoluteURLFromDiscussionRelativeURL(relPath),
        params
      );
  }

});

/**
 * @class BaseCollection
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
  fetchFromScriptTag: function(id) {
      var that = this;

      return Promise.delay(1).then(function() {
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
  getByCid: function(cid) {
    var result = null;
    this.each(function(model) {
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
  getByNumericId: function(id) {
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
  removeById: function(id) {
    var model = this.get(id);
    this.remove(model);
  },

  /**
   * Updates the given model into the collection
   * @param {object} item
   */
  updateFromSocket: function(item) {
    var model = this.get(item['@id']);
    var debug = Ctx.debugSocket;
    if (item['@tombstone']) {
      if (model) {
        if (debug) {
          console.log("updateFromSocket(): Removing from socket (tombstoned):", model.get('@type'), model.id);
        }
        this.remove(model);
      }
      else {
        if (debug) {
          console.log("updateFromSocket(): Ignoring tombstone not in collection: ", item['@type'], item['@id'], item);
        }
      }
    }
    else if (model === null || model === undefined) {
      // oops, doesn't exist
      if (debug) {
        console.log("Adding from socket:", item['@type'], item['@id'], item)
      }
      var addResult = this.add(item, {parse: true});
      console.log(addResult);
    }
    else {
      // yeah, it exists
      if (debug) {
        console.log("updateFromSocket(): Merging from socket:", item['@type'], item['@id'], item)
      }

      this.add(item, {merge: true, parse: true});
      if (debug) {
        console.log("updateFromSocket(): Model ", model.id, "is now:", model);
      }
    }

    if (debug) {
      console.log("updateFromSocket(): collection is now:", this);
    }
  }

});


/**
 * @class RelationsCollection
 *
 * Collection of relationships to objects which "exist" in another
 * BaseCollection, but the relationships are not materialized.
 * So add/remove should not create/delete object, but relation.
 */
var RelationsCollection = BaseCollection.extend({
  // Add a model, or list of models to the set.
  add: function(models, options) {
    models = Backbone.Collection.prototype.add.apply(this, arguments);
    // use previousModels to detect whether called from reset
    if (options === undefined || options.previousModels === undefined) {
      var that = this, singular = !_.isArray(models),
          modelsArray = singular ? [models] : models;
      _.forEach(modelsArray, function(model) {
        Backbone.sync("create", model, {url: that.url});
      });
    }
    return models;
  },

  // Remove a model, or a list of models from the set.
  remove: function(models, options) {
    models = Backbone.Collection.prototype.remove.apply(this, arguments);
    // use previousModels to detect whether called from reset
    if (options === undefined || options.previousModels === undefined) {
      var that = this, singular = !_.isArray(models),
          modelsArray = singular ? [models] : models;
      _.forEach(modelsArray, function(model) {
        var id = model.getNumericId();
        Backbone.sync("delete", models, {url: that.url + "/" + id});
      });
    }
    return models;
  }
});

module.exports = {
  Model: BaseModel,
  Collection: BaseCollection,
  RelationsCollection: RelationsCollection
};

