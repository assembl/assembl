"use strict";
/**
 * Discussion preferences
 * @module app.models.discussionPreference
 */
var Backbone = require("backbone"),
    Ctx = require("../common/context.js");


/**
 * An individual preference value.
 * We do not use Base.Model.extend(), because we want to keep Backbone's default behaviour with model urls.
 * Generic case: preference value can be any json, not necessarily a dict.
 * So put it in "value" attribute of this model.
 * @class app.models.discussionPreference.DiscussionIndividualPreferenceModel
 */
var DiscussionIndividualPreferenceModel = Backbone.Model.extend({
  /**
   * @function app.models.discussionPreference.DiscussionIndividualPreferenceModel.constructor
   */
  constructor: function DiscussionIndividualPreferenceModel() {
    Backbone.Model.apply(this, arguments);
  },
  /**
   * @function app.models.discussionPreference.DiscussionIndividualPreferenceModel.parse
   */
  parse: function(resp, options) {
    this._subcollectionCache = undefined;
    if (resp.value !== undefined && resp.id !== undefined)
      return resp;
    return {value: resp};
  },
  /**
   * @function app.models.discussionPreference.DiscussionIndividualPreferenceModel.toJSON
   */
  toJSON: function(options) {
    return _.clone(this.get("value"));
  },
  /**
   * @function app.models.discussionPreference.DiscussionIndividualPreferenceModel.valueAsCollection
   * The preference is a list or dict of something. Return a collection of that something, or dict items.
   */
  valueAsCollection: function(preferenceData) {
    if (this._subcollectionCache === undefined) {
      var collection, that = this, value = this.get('value');
      if (Array.isArray(preferenceData.default)) {
        if (!Array.isArray(value)) {
          // Error in value type
          // shallow clone, hopefully good enough
          value = _.clone(preferenceData.default);
          this.set('value', value);
        }
        collection = new DiscussionPreferenceSubCollection(value, {parse: true});
        this.listenTo(collection, "reset change add remove", function(model) {
            var val = model.collection.map(
              function(aModel) {
                return aModel.get('value');
              });
            that.set('value', val);
        });
      } else if (_.isObject(preferenceData.default)) {
        if (!_.isObject(value)) {
          // Error in value type
          // shallow clone, hopefully good enough
          value = _.clone(preferenceData.default);
          this.set('value', value);
        }
        // In that case, transform {"value": {k,v}} into [{"key":k, "value": v}]
        var items = [];
        _.mapObject(value, function(v, k) {
          items.push({ key: k, value: v });
        });
        collection = new DiscussionPreferenceSubCollection(items);
        this.listenTo(collection, "reset change add remove", function(model) {
            var val = {};
            model.collection.map(
              function(aModel) {
                val[aModel.get('key')] = aModel.get('value');
              });
            that.set('value', val);
        });
      } else {
        console.error("valueAsCollection called on an elementary object?");
        collection = new DiscussionPreferenceSubCollection();
        // Ideally recreate from the model's default.
      }
      this._subcollectionCache = collection;
    }
    return this._subcollectionCache;
  },
});


/**
 * Subcase: pref is a dictionary, so we can use normal backbone
 * @class app.models.discussionPreference.DiscussionPreferenceDictionaryModel
 */
var DiscussionPreferenceDictionaryModel = Backbone.Model.extend({
  /**
   * @function app.models.discussionPreference.DiscussionPreferenceDictionaryModel.constructor
   */
  constructor: function DiscussionPreferenceDictionaryModel() {
    Backbone.Model.apply(this, arguments);
  },
  /**
   * @function app.models.discussionPreference.DiscussionPreferenceDictionaryModel.url
   */
  url: function() {
    return Ctx.getApiV2DiscussionUrl("settings/"+this.id);
  },
  /**
   * @function app.models.discussionPreference.DiscussionIndividualPreferenceModel.valueAsCollection
   * The preference is a list of something. Return a collection of that something.
   */
  valueAsCollection: function() {
    if (this._subcollectionCache !== undefined) {
      return this._subcollectionCache;
    }
    var value = this.get('value'),
        that = this,
        collection,
        items = [];
        _.mapObject(value, function(v, k) {
          items.push({ key: k, value: v });
        });
        collection = new DiscussionPreferenceSubCollection(items, {parse: true});
    this.listenTo(collection, "reset change add remove", function(model) {
        var val = {};
        model.collection.map(
          function(aModel) {
            val[aModel.get('key')] = aModel.get('value');
          });
        that.set('value', val);
    });
    this._subcollectionCache = collection;
    return collection;
  },
});


/**
 * @class app.models.discussionPreference.DiscussionPreferenceSubCollection
 */
var DiscussionPreferenceSubCollection = Backbone.Collection.extend({
  /**
   * @function app.models.discussionPreference.DiscussionPreferenceSubCollection.constructor
   */
  constructor: function DiscussionPreferenceSubCollection() {
    Backbone.Collection.apply(this, arguments);
  },
  model: DiscussionIndividualPreferenceModel
});


/**
 * @class app.models.discussionPreference.DiscussionPreferenceCollection
 */
var DiscussionPreferenceCollection = Backbone.Collection.extend({
  /**
   * @function app.models.discussionPreference.DiscussionPreferenceCollection.constructor
   */
  constructor: function DiscussionPreferenceCollection() {
    Backbone.Collection.apply(this, arguments);
  },
  url: Ctx.getApiV2DiscussionUrl("settings"),
  model: DiscussionIndividualPreferenceModel,
  /**
   * @function app.models.discussionPreference.DiscussionPreferenceCollection.parse
   */
  parse: function(resp, options) {
    // does this go through model.parse afterwards? That would be trouble.
    var preference_data = resp.preference_data;
    return _.map(preference_data, function(pref_data) {
      var id = pref_data.id;
      return {id: id, value: resp[id]};
    });
  },
  /**
   * @function app.models.discussionPreference.DiscussionPreferenceCollection.toJSON
   */
  toJSON: function(options) {
    var prefs = {};
    this.models.map(function(m) {
      prefs[m.id] = m.toJson(options);
    });
    return prefs;
  },
});


/**
 * @class app.models.discussionPreference.UserPreferenceRawCollection
 * @extends app.models.discussionPreference.DiscussionPreferenceCollection
 */
var UserPreferenceRawCollection = DiscussionPreferenceCollection.extend({
  // TODO: Subset of editable? Assume viewable already filtered by backend.
  /**
   * @function app.models.discussionPreference.UserPreferenceRawCollection.constructor
   */
  constructor: function UserPreferenceRawCollection() {
    DiscussionPreferenceCollection.apply(this, arguments);
  },
  url: Ctx.getApiV2DiscussionUrl("all_users/current/preferences"),
});


module.exports = {
  DictModel: DiscussionPreferenceDictionaryModel,
  DiscussionPreferenceCollection: DiscussionPreferenceCollection,
  UserPreferenceCollection: UserPreferenceRawCollection,
  Model: DiscussionIndividualPreferenceModel
};
