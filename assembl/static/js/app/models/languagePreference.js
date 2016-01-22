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
    //The server should also send the string of the locales.
    //locale_name, translate_to_name
    defaults: {
        user: null,
        locale_name: null,
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
            clln = clean(this.get('locale_name'));
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
      commonLenF = function(pref) {
        return LangString.localeCommonLength(locale, pref.get("locale_name")) > 0;
      };
      var pref = this.max(commonLenF);
      if (commonLenF(pref) > 0) {
        return pref;
      }
    },
    getTranslationData: function() {
      // If we want to create an optimized collection someday...
      return this;
    }
});


var DisconnectedUserLanguagePreferenceCollection = LanguagePreferenceCollection.extend({

    getExplicitLanguages: function(){
        return [];
    },

    getPreferenceForLocale: function(locale){
        return new LanguagePreferenceModel({
          locale_name: locale,
          source_of_evidence: 0
        });
    },
});



module.exports = {
    Model: LanguagePreferenceModel,
    Collection: LanguagePreferenceCollection,
    DisconnectedUserCollection: DisconnectedUserLanguagePreferenceCollection
}
