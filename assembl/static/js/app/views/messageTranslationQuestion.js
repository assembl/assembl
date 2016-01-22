var Marionette = require('../shims/marionette.js'),
    Backbone = require('../shims/backbone.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    i18n = require('../utils/i18n.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Types = require('../utils/types.js'),
    LanguagePreference = require('../models/languagePreference.js');

/**
 * Date: Jan 14, 2016
 * Assumption: Currently, we are NOT showing the translation view if the SUBJECT of a message and only
 * the subject of the message is translated. Rather 'gung ho', but this is the reality. 
 */

var userTranslationStates = {
    CONFIRM: 'confirm',
    DENY: 'deny'
};

var TranslationView = Marionette.ItemView.extend({
    template: '#tmpl-loader',

    ui: {
        setLangPref: '.js_translation-question', //Question region
        langChoiceConfirm: '.js_language-of-choice-confirm',
        langChoiceCancel: '.js_language-of-choice-deny',
        confirmLangPref: '.js_translate-all-confirm-msg',
        langTo: '.js_translate-to-language',
        langSelection: '.js_translate-to-language-selected',
        gotoSettings: '.js_load-profile-settings',
        hideQuestion: '.js_hide-translation-question',
    },

    events: {
        'click @ui.langChoiceConfirm': 'updateLanguagePreferenceConfirm',
        'click @ui.langChoiceCancel': 'updateLanguagePreferenceDeny',
        'click @ui.hideQuestion': 'onHideQuestionClick',
        'click @ui.gotoSettings': 'loadProfile',
        'click @ui.langTo': 'onLanguageSelected'
    },

    initialize: function(options){
        this.message = options.messageModel;
        this.messageView = options.messageView;
        var that = this;
        var cm = new CollectionManager();
        cm.getUserLanguagePreferencesPromise(Ctx)
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
                    // may not be a translation, pretend coming from itself
                    translatedFromLocaleName = translatedToName;
                }
                that.translatedTo = {locale: translatedTo, name: translatedToName};
                that.translatedFrom = {locale: translatedFromLocale, name: translatedFromLocaleName};
                that.langCache = localeToLangNameCache;
                that.languagePreferences = preferences; //Should be sorted already
                that.template = '#tmpl-message_translation_question';
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

    dummyUpdateLanguage: function(state){
        console.log("About to show the confirm message.");
        this.showConfirmMessage(function(){
            console.log("Fade animation is complete!");
        });
    },

    updateLanguagePreference: function(state){
        var that = this,
            preferredLanguageTo = $(this.ui.langSelection).attr("value"),

            createModel = function(locale, translateTo, preferenceCollection){

                commitChanges = {
                    success: function(model, resp, options) {
                        //Ensure that this is in the right order
                        that.languagePreferences.add(model, {merge: true});
                        //this.triggerMethod("translation:defined", 'full_message_list');
                        var cm = that.languagePreferences.collectionManager.getAllMessageStructureCollectionPromise()
                            .then(function(messageStructures){
                                return Promise.resolve(messageStructures.fetch());
                            })
                            .then(function(messages){
                                //do a bit of jquery and THEN refresh the page?
                                console.log("About to show the confirm message.");
                                that.showConfirmMessage(function(){
                                    console.log("Fade animation is complete!");
                                });
                                // setTimeout(function(){
                                //     that.messageView.unknownPreference = false;
                                //     that.messageView.forceTranslationQuestion = false;
                                //     that.messageView.messageListView.render();
                                // }, 4000);
                            });
                    },
                    error: function(model, resp, options) {
                        console.error("Failed to save user language preference of " + model + " to the database", resp);
                    }
                };

                var user_id = Ctx.getCurrentUser().id,
                    existingModel = preferenceCollection.find(function(model){
                        //Uniqueness constraint from the back-end ensures only 1 model with such parameters
                        return (
                            (model.get('user') === user_id) && 
                            (model.get('locale_name') === locale) && 
                            (model.get('source_of_evidence') === 0)                        )
                    });
                if (existingModel) {
                    var model = existingModel;
                    commitChanges.wait = true;
                    if (Ctx.isUserConnected()) {
                        model.save({
                            locale_name: locale,
                            translate_to_name: translateTo,
                        }, commitChanges);
                    }
                }
                else {
                    var hash = {
                        locale_name: locale,
                        source_of_evidence: 0,
                        user: Ctx.getCurrentUser().id,
                        "@type": Types.LANGUAGE_PREFERENCE
                    };
                    if (translateTo){
                        hash.translate_to_name = translateTo;
                    }
                    var langPref = new LanguagePreference.Model(hash, {collection: that.languagePreferences});
                    commitChanges.wait = false;
                    if (Ctx.isUserConnected()) {
                        langPref.save(null, commitChanges);
                    }
                }
                
            };

        if (!preferredLanguageTo) {
            return; // If there is a template error
        }

        if (state === userTranslationStates.CONFIRM) {
            createModel(this.translatedFrom.locale, preferredLanguageTo, this.languagePreferences);
        }

        if (state === userTranslationStates.DENY) {
            createModel(this.translatedFrom.locale, null, this.languagePreferences);
        }
    },

    updateLanguagePreferenceConfirm: function(e){
        // this.updateLanguagePreference(userTranslationStates.CONFIRM);
        this.dummyUpdateLanguage();
    },

    updateLanguagePreferenceDeny: function(e) {
        // this.updateLanguagePreference(userTranslationStates.DENY);
        this.dummyUpdateLanguage();
    },

    onHideQuestionClick: function(e) {
        this.messageView.onHideQuestionClick(e);
    },

    onLanguageSelected: function(e){
        var current = this.$(e.currentTarget),
            val = current.attr("value");
        this.$(this.ui.langSelection).attr("value", val); //This is storing data in the dom, not a very good idea.  benoitg-2015-01-21
        this.$(this.ui.langSelection).find(".dropdown-label").text(current.text());
    },

    showConfirmMessage: function(onComplete){
        var elem = this.$(this.ui.confirmLangPref),
            question = this.$(this.ui.setLangPref); 
        //elem.removeClass("hidden");
        //question.addClass("hidden");
        question.addClass('fade-out');
        elem.addClass('fade-in');
        elem.removeClass('hidden');
    },

    serializeData: function(){
        if (this.template !== "#tmpl-loader") {
            return {
                translationQuestion: i18n.sprintf(i18n.gettext("Translate all messages from %s to "), this.translatedFrom.name),
                supportedLanguages: this.localesAsSortedList(),
                translatedTo: this.translatedTo,
                forceTranslationQuestion: this.messageView.forceTranslationQuestion,
                translatedFromLocale: this.translatedFrom
            };
        }
    }
});

module.exports = TranslationView;
