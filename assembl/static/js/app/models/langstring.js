'use strict';

var _ = require('../shims/underscore.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Types = require('../utils/types.js');

function localeCommonLength(locale1, locale2) {
    // how many common components?
    // shortcut
    if (locale1.substr(0, 2) != locale2.substr(0, 2)) {
      return false;
    }
    var l1 = locale1.split("-x-mtfrom-")[0].split("_"),
        l2 = locale2.split("-x-mtfrom-")[0].split("_"),
        max = Math.min(l1.length, l2.length);
    for (var i = 0; i < max; i++) {
      if (l1[i] != l2[i]) {
        break;
      }
    }
    return i;
}

/**
 * @class LangStringEntry
 */
var LangStringEntry = Base.Model.extend({
  /**
   * Defaults
   */
  defaults: {
    "@type": Types.LANGSTRING_ENTRY,
    "@language": "und",
    "value": ""
  },
  isMachineTranslation: function() {
    return this.get("@language").indexOf("-x-mtfrom-") > 0;
  },
  langstring: function() {
    return this.collection.langstring;
  },
  value: function() {
    return this.get("value");
  },
  getLocaleValue: function() {
    return this.get('@language');
  },
  getBaseLocale: function() {
    var locale = this.get('@language');
    return locale.split("-x-mtfrom-")[0];
  },
  getTranslatedFromLocale: function() {
    if (this.isMachineTranslation()) {
      var locale = this.get('@language');
      return locale.split("-x-mtfrom-")[1];
    }
  }
});

/**
 * @class LangStringEntry
 */
var LangStringEntryCollection = Base.Collection.extend({
  // Should I use the subordinate api point? I'd need the langstring url
  urlRoot: Ctx.getApiV2DiscussionUrl("LangStringEntry"),
  model: LangStringEntry,
  initialize: function(models, options) {
    this.langstring = options ? options.langstring : null;
  }
});


/**
 * @class LangString
 */
var LangString = Base.Model.extend({
  parse: function(rawModel, options) {
    rawModel.entries = new LangStringEntryCollection(rawModel.entries, {parse: true});
    return rawModel;
  },
  initialize: function(attributes, options) {
    if (attributes && attributes.entries !== undefined) {
      attributes.entries.langstring = this;
    }
  },

  /**
   * Defaults
   */
  defaults: {
    "@type": Types.LANGSTRING,
    entries: []
  },
  original: function() {
    var originals = this.get("entries").filter(function(e) {return !e.isMachineTranslation();});
    if (originals.length > 1) {
      return this.bestOf(originals);
    }
    return originals[0];
  },

  bestOf: function(available, langPrefs) {
    // Get the best langStringEntry among those available using user prefs.
    // 1. Look at available original languages: get corresponding pref.
    // 2. Sort prefs (same order as original list.)
    // 3. take first applicable w/o trans or whose translation is available.
    // 4. if none, look at available translations and repeat.
    // Logic is painful, but most of the time (single original) will be trivial in practice.

    var i, entry, commonLenF, that = this;
    if (available.length == 1) {
        return available[0];
    }
    
    if (langPrefs !== undefined) {
      for (var useTranslationsC = 0; useTranslationsC < 2; useTranslationsC++) {
        var useTranslations = (useTranslationsC==1),
            prefCandidates = [],
            entryByPrefLocale = {};
        for (var i = 0; i < available.length; i++) {
          entry = available[i];
          var entry_locale = entry.get("@language");
          if (entry.isMachineTranslation() != useTranslations)
            continue;
          var pref = langPrefs.getPreferenceForLocale(entry_locale);
          if (pref !== undefined) {
            entryByPrefLocale[pref.get("locale_name")] = entry;
            prefCandidates.push(pref);
          }
        }
        if (prefCandidates.length) {
          prefCandidates.sort(langPrefs.comparator);
          for (i = 0; i < prefCandidates.length; i++) {
            var pref = prefCandidates[i];
            var translate_to = pref.get("translate_to");
            if (translate_to === undefined) {
              return entryByPrefLocale[pref.get("locale_name")];
            } else {
              // take available with longest common locale string to translation target
              commonLenF = function(entry) {
                return localeCommonLength(entry.get("@language"), pref.get("translate_to_name")) > 0;
              };
              entry = _.max(available, commonLenF);
              if (commonLenF(entry) > 0) {
                return entry;
              }
            }
          }
        }
      }
    } else {
      console.error("No langPref");
    }
    // give up and give first original
    for (i = 0; i < available.length; i++) {
      entry = available[i];
      if (!entry.isMachineTranslation()) {
        return entry;
      }
    }
    // or first entry
    return available[0];
  },
  best: function(langPrefs) {
    return this.bestOf(this.get("entries").models, langPrefs);
  },
  bestValue: function(langPrefs) {
    return this.best(langPrefs).get("value");
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
      "@id": this.id,
      entries: new LangStringEntryCollection(newEntries)
    });
  }
});

var LangStringCollection = Base.Collection.extend({
  parse: function(rawModel, options) {
    rawModel.entries = new LangStringEntryCollection(rawModel.entries, {
        parse: true,
        langstring: this
    });
    return rawModel;
  },
  model: LangString,
  urlRoot: Ctx.getApiV2DiscussionUrl("LangString"),
});

module.exports = {
  Model: LangString,
  Collection: LangStringCollection,
  EntryModel: LangStringEntry,
  EntryCollection: LangStringEntryCollection,
  localeCommonLength: localeCommonLength
};
