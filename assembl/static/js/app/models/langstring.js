'use strict';
/**
 * 
 * @module app.models.langstring
 */

var _ = require('underscore'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Types = require('../utils/types.js');

var LocaleUtils = {
    translatorInfo: Ctx.getTranslationServiceData() || {},
    localeCompatibility: function(locale1, locale2) {
        // Are the two locales similar enough to be substituted
        // one for the other. Mostly same language/script, disregard country.
        // shortcut
        if (locale1.substr(0, 2) != locale2.substr(0, 2)) {
          return false;
        }
        // Google special case
        if (locale1 == "zh")
            locale1 = "zh_Hans";
        if (locale2 == "zh")
            locale2 = "zh_Hans";
        var l1 = locale1.split("-x-mtfrom-")[0].split("_"),
            l2 = locale2.split("-x-mtfrom-")[0].split("_"),
            max = Math.min(l1.length, l2.length);
        for (var i = 0; i < max; i++) {
          if (l1[i] != l2[i]) {
            if (i > 0 && l1[i].length == 2) {
                return i;
            }
            return false;
          }
        }
        return i + 1;
    },

    undefined: "und",
    non_linguistic: "zxx",

    stripCountry: function(locale) {
        var locale_parts = locale.split("_");
        if (locale_parts.length > 1 && locale_parts[locale_parts.length-1].length == 2) {
            locale_parts.pop();
            locale = locale_parts.join("_");
        }
        return locale;
    },

    superLocale: function(locale) {
        var pos = locale.lastIndexOf("_");
        if (pos > 0) {
            return locale.substr(0, pos);
        }
    },

    localeAsTranslationService: function(locale) {
        var parts = locale.split("-x-mtfrom-");
        if (parts.length > 1) {
            return [this.localeAsTranslationService(parts[0]),
                    this.localeAsTranslationService(parts[1])].join("-x-mtfrom-");
        }
        var idiosyncrasies = this.translatorInfo['idiosyncrasies'] || {};
        if (idiosyncrasies[locale] !== undefined) {
            return idiosyncrasies[locale];
        } else {
            return locale;
        }
    },

    getServiceShowOriginalString: function(){
      return this.translatorInfo["translation_notice"] || "";
    },

    getServiceShowOriginalUrl: function(){
      return this.translatorInfo["translation_notice_url"] || "";
    },
};

/**
 * @class LangStringEntry
 */
var LangStringEntry = Base.Model.extend({
  constructor: function LangStringEntry() {
    Base.Model.apply(this, arguments);
  },

  /**
   * Defaults
   */
  defaults: {
    "@type": Types.LANGSTRING_ENTRY,
    "@language": LocaleUtils.undefined,
    "error_count": 0,
    "error_code": undefined,
    "value": ""
  },
  isMachineTranslation: function() {
    return this.get("@language").indexOf("-x-mtfrom-") > 0;
  },
  original: function() {
    // shortcut for original
    if (this.collection !== undefined && this.collection.langstring !== undefined) {
        return this.collection.langstring.original();
    }
    // WHY do we get here?
    return this;
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
  },
  getOriginalLocale: function() {
    if (this.isMachineTranslation()) {
      var locale = this.get('@language');
      return locale.split("-x-mtfrom-")[1];
    } else {
        return this.getBaseLocale();
    }
  },
  localeForService: function() {
    return LocaleUtils.localeAsTranslationService(this.get("@language"));
  },
  applyFunction: function(func) {
    return new LangStringEntry({
      value: func(this.get("value")),
      "@language": this.get("@language")
    });
  }
});

/**
 * @class LangStringEntry
 */
var LangStringEntryCollection = Base.Collection.extend({
  constructor: function LangStringEntryCollection() {
    Base.Collection.apply(this, arguments);
  },
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
  constructor: function LangString() {
    Base.Model.apply(this, arguments);
  },
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

  /**
   * Determines the best body string to use according to various settings
   * Get the best langStringEntry among those available using user prefs.
     1. Look at available original languages: get corresponding pref.
     2. Sort prefs (same order as original list.)
     3. take first applicable w/o trans or whose translation is available.
     4. if none, look at available translations and repeat.
     Logic is painful, but most of the time (single original) will be trivial in practice.

   * @param  {LangStringEntry.Collection}       available
   * @param  {LanguagePreference.Collection}    langPrefs
   * @param  {Boolean}                          filter_errors   Used to supress errors
   * @returns {LangStringEntry}          
   */
  bestOf: function(available, langPrefs, filter_errors) {
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
          if (filter_errors && entry.get("error_code"))
            continue;
          var pref = langPrefs.getPreferenceForLocale(entry_locale);
          if (pref !== undefined) {
            entryByPrefLocale[pref.get("locale_code")] = entry;
            prefCandidates.push(pref);
          } else if (useTranslations) {
            // No pref for original, just return the original entry
            return entry;
          }
        }
        if (prefCandidates.length) {
          prefCandidates.sort(langPrefs.comparator);
          for (i = 0; i < prefCandidates.length; i++) {
            var pref = prefCandidates[i],
                translate_to = pref.get("translate_to_name");
            if (!translate_to) {
              return entryByPrefLocale[pref.get("locale_code")];
            } else {
              // take available with longest common locale string to translation target
              commonLenF = function(entry) {
                return LocaleUtils.localeCompatibility(entry.get("@language"), translate_to) !== false;
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
  bestWithErrors: function(langPrefs, filter_errors) {
    if (!langPrefs) {
      return {
        entry: this.original(),
        error: null
      };
    }
    var entry = this.bestOf(this.get("entries").models, langPrefs, filter_errors),
        error_code = entry.get("error_code");
    if (error_code && entry !== undefined) {
      entry = entry.original();
    }
    return {
      entry: entry,
      error: error_code
    };
  },
  applyFunction: function(func) {
    var newEntries = this.get("entries").map(function(lse) {
      return lse.applyFunction(func);
    });
    return new LangString({
      "@id": this.id,
      entries: new LangStringEntryCollection(newEntries)
    });
  }
});

LangString.empty = new LangString({
        entries: new LangStringEntryCollection([
            new LangStringEntry({
                "value": "",
                "@language": "zxx"})])});

var LangStringCollection = Base.Collection.extend({
  constructor: function LangStringCollection() {
    Base.Collection.apply(this, arguments);
  },
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
  LocaleUtils: LocaleUtils
};
