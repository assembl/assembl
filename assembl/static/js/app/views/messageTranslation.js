var Marionette = require('../shims/marionette.js'),
    Backbone = require('../shims/backbone.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    i18n = require('../utils/i18n.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    LanguagePreference = require('../models/languagePreference.js');

/**
 * Date: Jan 14, 2016
 * Assumption: Currently, we are NOT showing the translation view if the SUBJECT of a message and only
 * the subject of the message is translated. Rather 'gung ho', but this is the reality. 
 */

var userTranslationStates = {
    CONFIRM: 'confirm',
    DENY: 'deny'
}

var TranslationView = Marionette.ItemView.extend({
    template: '#tmpl-loader',

    ui: {
        showOriginal: '.js_translation_show_original', //Show original region
        setLangPref: '.js_translation_question', //Question region
        langChoiceConfirm: '.js_language_of_choice_confirm',
        langChoiceCancel: '.js_language_of_choice_deny',
        confirmLangPref: '.js_translate_all_confirm_msg',
        langTo: '.js_translate_to_language',
        gotoSettings: '.js_load_profile_settings',
    },

    events: {
        'click @ui.showOriginal': 'showOriginal',
        'click @ui.confirmLangPref': 'updateLanguagePreferenceConfirm',
        'click @ui.langChoiceCancel': 'updateLangaugePreferenceDeny',
        'click @ui.gotoSettings': 'loadProfile'
    },

    initialize: function(options){
        this.message = options.messageModel;
        var that = this;
        var cm = new CollectionManager();
        cm.getUserLanguagePreferencesPromise()
            .then(function(preferences){
                var localeToLangNameCache = Ctx.getJsonFromScriptTag('locale-names'),
                    originalEntryLang = that.message.get('body').original(),
                    bestSuggestedTranslation = that.message.get('body').best(preferences);

                var bestSuggestedLocale = bestSuggestedLocale.getLocaleValue();
                var bestSuggestedName = localeToLangNameCache[bestSuggestedLocale];
                var languageName; 

                originalLangName = localeToLangNameCache[originalEntryLang.getLocaleValue()];
                if ( !(originalLangName) ){
                    throw new Error("The language " + originalLangName + " is not a part of the locale cache!");
                }
                else {
                    that.languageName = {locale: originalEntryLang.getLocaleValue(), name: originalLangName};
                    that.suggestedTargetLanguage = {locale: bestSuggestedLocale, name: bestSuggestedName};
                    that.langCache = localeToLangNameCache;
                }
                that.languagePreferences = preferences; //Should be sorted already
                that.template = '#tmpl-message_translation';
                that.render();
            });
    },

    showOriginal: function(e){
        console.log('Showing the original');
    },

    updateLanguagePreference: function(object){
        var s = object.state,
            that = this,
            langPrefLocale = $(this.ui.langTo).val(),
            saveModel = function(prefCollection, model, messageView) {
                prefCollection.add(model);
                //Refresh the entire messageList to only include messages not translated from
                //original language to target language
                messageView.messageListView.render();
            },
            errorOnSaveModel = function(model){
                console.error("Failed to save user language preference of " + model + " to the database", resp);
            };

        if (s === userTranslationStates.CONFIRM) {
            var langPref = new LanguagePreference.Model({
                locale: this.languageName.locale,
                translate_to: langPrefLocale,
                source_of_evidence: 0,
                user: Ctx.getCurrentUser().id
            });
            langPref.save(null, {
                success: function(model, resp, options){
                    saveModel(that.languagePreferences, model, that);
                },
                error: function(model, resp, options) {
                    errorOnSaveModel(model);
                }
            });
        }

        if (s === userTranslationStates.DENY) {
            //The user already understands this language
            var langPref = new LanguagePreference.Model({
                locale: this.languageName.locale,
                source_of_evidence: 0,
                user: Ctx.getCurrentUser().id
            });
            langPref.save(null, {
                success: function(model, resp, options){
                    saveModel(that.languagePreferences, model, that);
                },
                error: function(model, resp, options) {
                    errorOnSaveModel(model);
                }
            });
        }
    },

    updateLanguagePreferenceConfirm: function(e){
        console.log('Updating the language preference of the user');
    },

    updateLanguagePreferenceDeny: function(e) {
        console.log('Deny choice. Updating language preference of the user');
    },

    serializeData: function(){
        if (this.template !== "#tmpl-loader") {
            return {
                translationQuestion: i18n.sprintf(i18n.gettext("Translate all messages from %s to "), this.languageName.name),
                supportedLanguages: this.langCache,
                currentLanguage: this.languageName,
                possibleTargetLanguage: this.suggestedTargetLanguage
            } 
        }
    },

    onRender: function(){
        //Whenever a TranslationView is rendered, the message was translated.
        if (this.template !== '#tmpl-loader') {
            var language = this.message.get('body').original(),
                preferredLanguages = this.languagePreferences.getExplicitLanguages();
        
            if ( !(preferredLanguages) && ! (preferredLanguages.find( function(pl) {return pl.isLocale(language.getLocaleValue()); } ) ) ) {
                this.$(this.ui.setLangPref).hide();
            }
        }
    }

});

module.exports = TranslationView;
