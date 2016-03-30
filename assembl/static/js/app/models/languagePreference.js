'use strict';

var _ = require('../shims/underscore.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    LangString = require("./langstring.js"),
    Types = require('../utils/types.js');

var clean = function(input){
    if (!input){
        return input;
    }
    var tmp;
    if (input.indexOf("_") > -1 ){
        tmp = input.split("_")[0];
    } else {
        tmp = input;
    }
    return tmp;
};

var LanguagePreferenceModel = Base.Model.extend({
  constructor: function LanguagePreferenceModel() {
    Base.Model.apply(this, arguments);
  },
    //The server should also send the string of the locales.
    //locale_code, translate_to_name
    defaults: {
        user: null,
        locale_code: null,
        preferred_order: 0,
        source_of_evidence: null,
        translate_to_name: null
    },

    setExplicitPromise: function(language){
        this.set({"translate_to": language});
        return Promise.resolve(this.save({}));
    },

    isLocale: function(locale){
        var cl = clean(locale),
            clln = clean(this.get('locale_code'));
        return clln === cl;
    },

    isTranslateTo: function(locale){
        var cl = clean(locale),
            clln = clean(this.get('translate_to_name'));
        return clln === cl;
    }
});

/**
 * Language Preferences of the user; there is a privacy setting which will only show an array of user preferences that are bound to the user
 */
var LanguagePreferenceCollection = Base.Collection.extend({
  constructor: function LanguagePreferenceCollection() {
    Base.Collection.apply(this, arguments);
  },
    url: Ctx.getApiV2DiscussionUrl("/all_users/current/language_preference"),
    model: LanguagePreferenceModel,
    cacheDefaultTargetLocale: undefined,
    cachePrefByLocale: undefined,

    //Comparator sorts in ascending order
    comparator: function(lp) {
      return lp.get("source_of_evidence") + (lp.get("preferred_order") / 100.0);
    },

    getExplicitLanguages: function(){
        return this.filter(function(entry){
            return entry.get("source_of_evidence") === 0;
        });
    },

    nonLinguisticPreference: new LanguagePreferenceModel({
        source_of_evidence: 1,
        locale_code: LangString.LocaleUtils.non_linguistic
    }),

    /**
     * @param  String locale
     * This needs to mirror UserLanguagePreferenceCollection.find_locale
     */
    getPreferenceForLocale: function(locale){
      if (this.cachePrefByLocale === undefined) {
        console.warn("getPreferenceForLocale was called before getTranslationData");
        this.getTranslationData();
      }
      if (locale == LangString.LocaleUtils.non_linguistic) {
        return this.nonLinguisticPreference;
      }
      var localeParts = locale.split("_");
      for (var i = localeParts.length; i > 0; i--) {
        locale = localeParts.slice(0, i).join("_");
        var pref = this.cachePrefByLocale[locale];
        if (pref !== undefined) {
          return pref;
        }
      }
      if (LangString.LocaleUtils.localeCompatibility(this.cacheDefaultTargetLocale, locale) !== false) {
        return new LanguagePreferenceModel({
            locale_code: locale
        });
      } else {
          return new LanguagePreferenceModel({
            locale_code: locale,
            translate_to_name: this.cacheDefaultTargetLocale
          });
      }
    },
    getTranslationData: function() {
      // this is when we precalculate the cache
      // We might make the cache into another object someday.
      if (this.cachePrefByLocale === undefined) {
        var that = this,
            prefByLocale = {};
        // assume this.models is sorted, just reverse
        _.map(this.models.reverse(), function(pref) {
          prefByLocale[pref.get("locale_code")] = pref;
        });
        // then add the superlocales
        this.map(function(pref) {
          var locale = pref.get("locale_code");
          locale = LangString.LocaleUtils.superLocale(locale);
          while (locale !== undefined && prefByLocale[locale] == undefined) {
            prefByLocale[locale] = pref;
            locale = LangString.LocaleUtils.superLocale(locale);
          }
        });
        // check if the translation targets are there
        this.map(function(pref) {
          var locale = pref.get("translate_to_name");
          while (locale != undefined) {
            if (prefByLocale[locale] === undefined) {
                prefByLocale[locale] = new LanguagePreferenceModel({
                    locale_code: locale,
                    source_of_evidence: 3, // LanguagePreferenceOrder.DeducedFromTranslation
                    preferred_order: pref.get("preferred_order")});
            }
            locale = LangString.LocaleUtils.superLocale(locale);
          }
        });
        this.cachePrefByLocale = prefByLocale;
        var pref, i;
        for (i = 0; i < this.models.length; i++) {
          pref = this.models[i];
          if (pref.get("translate_to_name") !== null) {
            this.cacheDefaultTargetLocale = pref.get("translate_to_name");
            return this;
          }
        }
        pref = this.first();
        if (pref === undefined) {
          this.cacheDefaultTargetLocale = Ctx.getLocale();
        } else {
          this.cacheDefaultTargetLocale = pref.get("locale_code")
        }
      }
      return this;
    },

    /**
     * Creates a new languagePreference from a given local and does actions based on the succes/error callbacks
     * @param User      currentUser     The Backbone model of the current user
     * @param String    locale          The particular string of the locale to save
     * @param String    translateTo     The string of the locale that @param {locale} translates into 
     * @param Object    options         success and error callbacks
     */
    setPreference: function(currentUser, locale, translateTo, saveOptions){
        //If user is not connected, then do nothing
        if (currentUser){
            // invalidate the cache
            this.cacheDefaultTargetLocale = undefined;
            this.cachePrefByLocale = undefined;
            var user_id = currentUser.id,
                that = this,
                saveOptions = saveOptions || {},
                existingModel = this.find(function(model){
                //Uniqueness constraint from the back-end ensures only 1 model with such parameters
                return (
                    (model.get('user') === user_id) && 
                    (model.get('locale_code') === locale) &&
                    (model.get('source_of_evidence') === 0))
                }),
                ops = {
                    success: function(model, resp, options){
                        that.add(model);
                        if (_.has(saveOptions, "success")){
                            saveOptions.success(model, resp, options);
                        }
                    },
                    error: function(model, resp, options){
                        console.error("Failed to save user language preference of " + model + " to the database", resp);
                        if (_.has(saveOptions, "error")){
                            saveOptions.error(model, resp, options);
                        }
                    }
                };
            if (existingModel) {
                var model = existingModel;
                ops.wait = true;
                model.save({
                    locale_code: locale,
                    translate_to_name: translateTo,
                }, ops);
            }
            else {
                var hash = {
                    locale_code: locale,
                    source_of_evidence: 0,
                    translate_to_name: translateTo,
                    user: user_id,
                    "@type": Types.LANGUAGE_PREFERENCE
                };
                var langPref = new LanguagePreferenceModel(hash, {collection: this});
                ops.wait = false;
                langPref.save(null, ops);
            }
        }
    }
});

var DisconnectedUserLanguagePreferenceCollection = LanguagePreferenceCollection.extend({
  constructor: function DisconnectedUserLanguagePreferenceCollection() {
    LanguagePreferenceCollection.apply(this, arguments);
  },


    getExplicitLanguages: function(){
        return [];
    },

    getPreferenceForLocale: function(locale) {
      // TODO: Cache
      var target_locale = Ctx.getLocale();
      if (LangString.LocaleUtils.localeCompatibility(target_locale, locale) !== false) {
        return new LanguagePreferenceModel({
            locale_code: locale
        });
      } else {
          return new LanguagePreferenceModel({
            locale_code: locale,
            translate_to_name: target_locale,
            source_of_evidence: 1
          });
      }
    },
});



module.exports = {
    Model: LanguagePreferenceModel,
    Collection: LanguagePreferenceCollection,
    DisconnectedUserCollection: DisconnectedUserLanguagePreferenceCollection
}
