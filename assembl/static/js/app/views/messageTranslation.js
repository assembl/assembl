var Marionette = require('../shims/marionette.js'),
    Backbone = require('../shims/backbone.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    i18n = require('../utils/i18n.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js');

/**
 * Date: Jan 14, 2016
 * Assumption: Currently, we are NOT showing the translation view if the SUBJECT of a message and only
 * the subject of the message is translated. Rather 'gung ho', but this is the reality. 
 */

var TranslationView = Marionette.ItemView.extend({
    template: '#tmpl-message_translation',

    ui: {
        showOriginal: '.js_translation_show_original', //Show original region
        setLangPref: '.js_translation_question', //Question region
        langChoiceConfirm: '.js_language_of_choice_confirm',
        langChoiceCancel: '.js_language_of_choice_deny',
        confirmLangPref: '.js_translate_all_confirm_msg',
        gotoSettings: '.js_load_profile_settings',
    },

    events: {
        'click @ui.showOriginal': 'showOriginal',
        'click @ui.confirmLangPref': 'updateLanguagePreference',
        'click @ui.gotoSettings': 'loadProfile'
    },

    initialize: function(options){
        this.message = options.messageModel;

        var that = this;
        var cm = new CollectionManager();
        cm.getUserLanguagePreferencesPromise()
            .then(function(preferences){
                that.languagePreferences = preferences; //Should be sorted already
            });

        var localeToLangNameCache = Ctx.getJsonFromScriptTag('locale-names'),
            origialEntryLang = this.message.get('body').original(),
            languageName; 

        originalLangName = localeToLangNameCache[origialEntryLang.getLocaleValue()];
        if ( !(languageName) ){
            throw new Error("The language " + originalLangName + " is not a part of the locale cache!");
        }
        else {
            this.languageName = {locale: origialEntryLang.getLocaleValue(), name: originalLangName};
            this.langCache = localeToLangNameCache;
        }
        console.log("Translation view initialize is called");
    },

    showOriginal: function(e){
        console.log('Showing the original');
    },

    updateLanguagePreference: function(e){
        console.log('Updating the language preference of the user');
    },

    serializeData: function(){
        console.log("Transation view serialzeData is called");
        //Currently debugging mode, this must be the list of languages available for google translate
        if (this.languageName) {
            return {
                //translationQuestion: i18n.sprintf(i18n.gettext("Translate all messages from %s to "), this.languageName.name),
                supportedLanguages: this.langCache,
                currentLanguage: this.languageName
            } 
        }
        else return {
            //translationQuestion: "",
            supportedLanguages: []
        };
    },

    onRender: function(){
        //Whenever a TranslationView is rendered, the message was translated.
        console.log("Translation view onRender is called");
        var language = this.message.get('body').original(),
            preferredLanguages = this.languagePreferences.getExplicitLanguages();
        
        if ( ! (preferredLanguages.find( function(pl) {return pl.isLocale(language.getLocaleValue()); } ) ) ) {
            this.$(this.ui.setLangPref).hide()
        }
    }

});

module.exports = TranslationView;
