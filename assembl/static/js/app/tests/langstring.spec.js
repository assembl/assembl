/**
 * Load Ctx and set the env to test first. Revert back after all tests.
 */

var Ctx = require('../common/context.js');
Ctx.setApplicationUnderTest();

var _ = require('../shims/underscore.js'),
    LangString = require("../models/langstring.js"),
    UserLanguagePreference = require('../models/languagePreference.js'),
    userLanguagePreferencesJson = require('./fixtures/languagePreferences.json'),
    langstringEntriesJson = require('./fixtures/langstringEntry.json'),
    localsJson = require('./fixtures/languageLocales.json'),
    langstringJson = require('./fixtures/langstring.json'),
    assert = require('chai').assert;

/**
 * These tests depends on the server to supply several peices of logic to the
 * DOM via the backend templating system. As a result, these tests will not
 * run on a discussion that does not have translation service already.
 * TODO: Make tests run without the #translation_service_data being passed
 * from backend.
 */


var clone = function(other){
  return JSON.parse(JSON.stringify(other));
};

describe("Langstring Spec", function(){
  var codes = localsJson;

  after(function(){
    Ctx.setApplicationUnderProduction();
  });

  describe("User Language Preference Spec", function(){

    var ls_en,
        ls_fr,
        ls_en_fr_x,
        ls_fr_en_x;

    var ulp_en_cookie,
        ulp_fr_cookie,
        ulp_en,
        ulp_fr,
        ulp_en_from_fr,
        ulp_fr_from_en;


    beforeEach(function(){
      Ctx._test_set_locale("en");

        ls_en = clone(langstringJson);
        ls_en.entries.push(langstringEntriesJson["en"]);

        ls_fr = clone(langstringJson);
        ls_fr.entries.push(langstringEntriesJson["fr"]);

        ls_en_fr_x = clone(langstringJson);
        ls_en_fr_x.entries.push(langstringEntriesJson["en"]);
        ls_en_fr_x.entries.push(langstringEntriesJson["fr_from_en"]);

        ls_fr_en_x = clone(langstringJson);
        ls_fr_en_x.entries.push(langstringEntriesJson["fr"]);
        ls_fr_en_x.entries.push(langstringEntriesJson["en_from_fr"]);


        ulp_en_cookie = clone(userLanguagePreferencesJson["en_cookie"]);
        ulp_fr_cookie = clone(userLanguagePreferencesJson["fr_cookie"]);
        ulp_en_from_fr = clone(userLanguagePreferencesJson["en_from_fr"]);
        ulp_fr_from_en = clone(userLanguagePreferencesJson["fr_from_en"]);
        ulp_en = clone(userLanguagePreferencesJson["en"]);
        ulp_fr = clone(userLanguagePreferencesJson["fr"]);

    });

    describe("No User Language Spec", function(){

      var ulp; 

      beforeEach("Set up disconnected user language preference", function(){
        Ctx._test_set_locale("en");
        ulp = new UserLanguagePreference.DisconnectedUserCollection();
      });

      it("A disconnected user with 'en' locale, and an 'en' langstring entry only", function(){
          var e = clone(ls_en);
          var langstring = new LangString.Model(e, {parse: true});
          var best = langstring.best(ulp);
          assert.isFalse(best.isMachineTranslation(), "The entry was machine translated");
          assert.strictEqual(best.getLocaleValue(), codes["en"]);
      });

      it("A disconnected user with 'fr' locale, and an 'en & fr-x-mtfrom-en' locales", function(){
          
          Ctx._test_set_locale("fr");
          var e = clone(ls_en_fr_x);
          var langstring = new LangString.Model(e, {parse: true});
          var best = langstring.best(ulp);
          assert.isTrue(best.isMachineTranslation(), "The entry is machine translated");
          assert.strictEqual(best.getLocaleValue(), codes["fr_from_en"]);
      });
    });

    describe("Cookie Language Spec", function(){

      var ulp;

      beforeEach(function(){
        Ctx._test_set_locale("en");
      });

      it("An 'en' user language preference with an 'en' langstring", function(){
        ulp = new UserLanguagePreference.Collection([ulp_en_cookie]);
        var e = clone(ls_en);
        var langstring = new LangString.Model(e, {parse: true});
        var best = langstring.best(ulp);
        assert.isFalse(best.isMachineTranslation(), "The entry is not machine translated");
        assert.strictEqual(best.getLocaleValue(), codes["en"]);
      });

      it("An 'fr' user language preference with 'en and fr-x-mtfrom-en' langstring", function(){
        Ctx._test_set_locale("fr");
        ulp = new UserLanguagePreference.Collection([ulp_fr_cookie]);
        var e = clone(ls_en_fr_x);
        var langstring = new LangString.Model(e, {parse: true});
        var best = langstring.best(ulp);
        assert.isTrue(best.isMachineTranslation(), "The entry is machine translated");
        assert.strictEqual(best.getLocaleValue(), codes["fr_from_en"]);
      });
    });

    describe("Explicit Language Spec", function(){

      var ulp;

      beforeEach(function(){
        Ctx._test_set_locale("en");
      });

      it("An en-> fr user language preference with an 'en and fr-x-mtfrom-en' langstring", function(){
        Ctx._test_set_locale("en");
        ulp = new UserLanguagePreference.Collection([ulp_fr, ulp_fr_from_en]);
        var e = clone(ls_en_fr_x);
        var langstring = new LangString.Model(e, {parse: true});
        var best = langstring.best(ulp);
        assert.isTrue(best.isMachineTranslation(), "The entry is machine translated");
        assert.strictEqual(best.getLocaleValue(), codes["fr_from_en"]);        
      });

      it("An 'en' preferred order 1 and an 'fr' preferred order 0, with " +
         "an 'fr and en-x-mtfrom-fr langstring'", function(){

        Ctx._test_set_locale("en");
        var en = clone(ulp_en);
        var fr = clone(ulp_fr);
        en['preferred_order'] = 1;
        fr['preferred_order'] = 0;
        ulp = new UserLanguagePreference.Collection([en, fr]);
        var e = clone(ls_fr_en_x);
        var langstring = new LangString.Model(e, {parse: true});
        var best = langstring.best(ulp);
        assert.isFalse(best.isMachineTranslation(), "The entry is not machine translated");
        assert.strictEqual(best.getLocaleValue(), codes["fr"]); 
      });

    });
  });
});
