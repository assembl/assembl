'use strict';

var _ = require('../shims/underscore.js'),
    Promise = require('bluebird'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Types = require('../utils/types.js'),
    Permissions = require('../utils/permissions.js');

/**
 * @class LangStringEntry
 */
var LangStringEntry = Base.Model.extend({
  /**
   * Defaults
   */
  defaults: {
    id: '',
    "@language": "und",
    "value": ""
  },
  isTranslation: function() {
    return ;
  }
});

/**
 * @class LangStringEntry
 */
var LangStringEntryCollection = Base.Collection.extend({
  // Should I use the subordinate api point? I'd need the langstring url
  urlRoot: Ctx.getApiV2DiscussionUrl("LangStringEntry"),
  model: LangStringEntry
});


/**
 * @class LangString
 */
var LangString = Base.Model.extend({
  parse: function(rawModel, options) {
    rawModel.entries = new LangStringEntryCollection(rawModel.entries, {parse: true});
    return rawModel;
  },
  
  /**
   * Defaults
   */
  defaults: {
    id: '',
    entries: []
  },
  original: function() {
    var originals = this.get("entries").filter(function(e) {return !e.isTranslation();});
    if (originals.length > 1) {
      return this.bestOf(originals);
    }
    return originals[0];
  },
  bestOf: function(available) {
    // Get the best langStringEntry among those available using user prefs.
    var that = this,
        // TODO: Replace by a method giving multiple preferences.
        expected = [Ctx.getLocale()],
        alternatives = [];
    for (var i=0; i < expected.length; i++) {
      var expectedLocale = expected[i];
      // find locale, or wider locale.
      var locale_parts = expectedLocale.split("_");
      while (locale_parts.length > 0) {
        var sublocale = locale_parts.join("_");
        if (sublocale in expected) {
          // We'll get at it in due time
          continue;
        }
        for (var j = 0; j < available.length; j++) {
          var existing = available[j],
              ex_locale = existing.get("@language");
          if (ex_locale == sublocale) {
            return existing;
          }
          if (ex_locale.length > sublocale.length &&
              ex_locale.substring(0, sublocale.length) == sublocale) {
            alternatives.push(existing);
          }
        }
        locale_parts.pop();
      }
    }
    if (alternatives.length) {
      return alternatives[0];
    }
    return available[0];
  },
  best: function() {
    return this.bestOf(this.get("entries").models);
  },
  bestValue: function() {
    return this.best().get("value");
  },
  originalValue: function() {
    return this.original().get("value");
  },
  applyFunction: function(func) {
    var newEntries = this.get("entries").map(function(lse) {
      return new LangStringEntry({
        value: func(lse.get("value")),
        "@language": lse.get("@language")
      });
    });
    return new LangString({
      entries: new LangStringCollection(newEntries)
    });
  }
});

var LangStringCollection = Base.Collection.extend({
  parse: function(rawModel, options) {
    rawModel.entries = new LangStringEntryCollection(rawModel.entries, {parse: true});
    return rawModel;
  },
  model: LangString,
  urlRoot: Ctx.getApiV2DiscussionUrl("LangString"),
});

module.exports = {
  Model: LangString,
  Collection: LangStringCollection,
  EntryModel: LangStringEntry,
  EntryCollection: LangStringEntryCollection
};
