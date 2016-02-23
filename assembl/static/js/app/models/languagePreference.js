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
        tmp = input.split("_")[0]    
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
    
    //Comparator sorts in ascending order
    comparator: function(lp) {
      return lp.get("source_of_evidence") + (lp.get("preferred_order") / 100.0);
    },

    getExplicitLanguages: function(){
        return this.filter(function(entry){
            return entry.get("source_of_evidence") === 0;
        });
    },

    /**
     * @param  String locale
     */
    getPreferenceForLocale: function(locale){
      // Take pref with longest common locale string
      var that = this,
          savedPref,
      commonLenF = function(pref) {
        return LangString.localeCommonLength(locale, pref.get("locale_code")) > 0;
      };
      var pref = this.max(commonLenF);
      if (commonLenF(pref) > 0) {
        return pref;
      }
      var target_locale, untranslated = this.where({translate_to_name:null});
      if (untranslated.length) {
        //This could bite you back if the user has a cookie preference + an OS preference
        target_locale = untranslated[0].get("locale_code");
      } else {
        target_locale = Ctx.getLocale();
      }
      if (LangString.localeCommonLength(target_locale, locale)) {
        savedPref = new LanguagePreferenceModel({
            locale_code: locale
        });
        this.add(savedPref);
        return savedPref;

      } else {
          savedPref = new LanguagePreferenceModel({
            locale_code: locale,
            translate_to_name: target_locale
          });
          this.add(savedPref);
          return savedPref;
      }
    },
    getTranslationData: function() {
      // If we want to create an optimized collection someday...
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

    getPreferenceForLocale: function(locale){
      var target_locale = Ctx.getLocale();
      if (LangString.localeCommonLength(target_locale, locale)) {
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
