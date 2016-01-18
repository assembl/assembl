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
                var localeToLangNameCache = Ctx.getJsonFromScriptTag('translation-locale-names'),
                    bestSuggestedTranslation = that.message.get('body').best(preferences);

                var translatedFromLocale = bestSuggestedTranslation.getTranslatedFromLocale(),
                    translatedFromLocaleName = localeToLangNameCache[translatedFromLocale],
                    translatedTo = bestSuggestedTranslation.getBaseLocale(),
                    translatedToName = localeToLangNameCache[translatedTo];
                if ( !(translatedToName) ){
                    console.error("The language " + translatedToName + " is not a part of the locale cache!");
                    translatedToName = translatedTo;
                }
                if ( !(translatedFromLocaleName) ){
                    console.error("The language " + translatedFromLocale + " is not a part of the locale cache!");
                    translatedFromLocaleName = translatedFromLocale;
                }
                that.translatedTo = {locale: translatedTo, name: translatedToName};
                that.translatedFromLocale = {locale: translatedFromLocale, name: translatedFromLocaleName};
                that.langCache = localeToLangNameCache;
                that.languagePreferences = preferences; //Should be sorted already
                that.template = '#tmpl-message_translation';
                that.render();
            });
    },

    _localesAsSortedList: null,
    localesAsSortedList: function() {
        if (this._localesAsSortedList === null) {
            var localeToLangName = Ctx.getJsonFromScriptTag('translation-locale-names'),
                localeList = _.map(localeToLangName, function(name, loc) {
                    return [loc, name];
                });
            localeList = _.sortBy(localeList, function(x) {return x[1];});
            Object.getPrototypeOf(this)._localesAsSortedList = localeList;
        }
        return this._localesAsSortedList;
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
                locale: this.translatedTo.locale,
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
                locale: this.translatedTo.locale,
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
                translationQuestion: i18n.sprintf(i18n.gettext("Translate all messages from %s to "), this.translatedFromLocale.name),
                supportedLanguages: this.localesAsSortedList(),
                translatedTo: this.translatedTo,
                translatedFromLocale: this.translatedFromLocale
            };
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
