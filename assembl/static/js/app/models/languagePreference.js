'use strict';

var _ = require('../shims/underscore.js'),
    Base = require('./base.js'),
    Ctx = require('../common/context.js'),
    i18n = require('../utils/i18n.js'),
    Types = require('../utils/types.js');

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
        return this.get('locale_name') === locale ? true : false;
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
            //Hackish. Should use the source_of_evidence instead
            entry.get('translate_to') !== null;
        });
    },
    getTranslationData: function() {
      return this;
    }
});



module.exports = {
    Model: LanguagePreferenceModel,
    Collection: LanguagePreferenceCollection
}
