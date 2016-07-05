"use strict";
/**
 * Discussion preferences
 * @module app.models.discussionPreference
 */
var Backbone = require("backbone"),
    Ctx = require("../common/context.js");
/**
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
   */
  valueAsCollection: function() {
    var value = this.get("value");
    if (Array.isArray(value)) {
      if (this._subcollectionCache === undefined) {
        var that = this, collection;
        collection = new DiscussionPreferenceSubCollection(value, {parse: true});
        this.listenTo(collection, "reset change add remove", function(model) {
            var value = model.collection.map(
              function(aModel) {
                return aModel.get("value");
              });
            that.set("value", value);
        });
        this._subcollectionCache = collection;
      }
      return this._subcollectionCache;
    }
  }
});
/**
 * Subcase: pref is a dictionary, so we can use normal backbone
 * @class app.models.discussionPreference.DiscussionPreferenceDictionaryModel
 */
var DiscussionPreferenceDictionaryModel = Backbone.Model.extend({
  constructor: function DiscussionPreferenceDictionaryModel() {
    Backbone.Model.apply(this, arguments);
  },
  /**
   * @function app.models.discussionPreference.DiscussionPreferenceDictionaryModel.url
   */
  url: function() {
    return Ctx.getApiV2DiscussionUrl("settings/"+this.id);
  },
});
/**
 * @class app.models.discussionPreference.DiscussionPreferenceSubCollection
 */
var DiscussionPreferenceSubCollection = Backbone.Collection.extend({
  constructor: function DiscussionPreferenceSubCollection() {
    Backbone.Collection.apply(this, arguments);
  },
  model: DiscussionIndividualPreferenceModel
});
/**
 * @class app.models.discussionPreference.DiscussionPreferenceCollection
 */
var DiscussionPreferenceCollection = Backbone.Collection.extend({
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
