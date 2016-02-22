var Marionette = require('../shims/marionette.js'),
    Backbone = require('../shims/backbone.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    i18n = require('../utils/i18n.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Types = require('../utils/types.js'),
    Growl = require('../utils/growl.js'),
    LanguagePreference = require('../models/languagePreference.js');

/**
 * Date: Jan 14, 2016
 * Assumption: Currently, we are NOT showing the translation view if the SUBJECT of a message and only
 * the subject of the message is translated. Rather 'gung ho', but this is the reality. 
 */

var userTranslationStates = {
    CONFIRM: 'confirm',
    DENY: 'deny',
    CANCEL: 'cancel'
};

/*
    Callback function upon successfully setting a language preference;
    Used in both Views in this file.
 */
var processConfirmLanguagePreferences = function(messageView){
    var cm = new CollectionManager();

    //Remove silent, remove messageListView.render()
    if (!messageView.isViewDestroyed()){
        messageView.closeTranslationView(function(){
            cm.getAllMessageStructureCollectionPromise()
                .then(function(messageStructures){
                    return Promise.resolve(messageStructures.fetch());
                })
                .then(function(messages){
                    if (!messageView.isViewDestroyed() ){
                        //Changing these values are useless, as messageView rendering will re-create
                        //the message views with initalized values.
                        messageView.resetTranslationState();
                        messageView.messageListView.render();
                    }
                    else {
                        console.log("View already destroyed [messageTransationQuestionView]");
                    }
            
                });
        });
    }
};

var LanguageSelectionView = Marionette.ItemView.extend({
  constructor: function LanguageSelectionView() {
    Marionette.ItemView.apply(this, arguments);
  },

    template: '#tmpl-message_translation_question_selection',

    ui: {
        selectedLanguage: ".js_translate-to-language",
        confirm: ".js_translation-confirm",
        cancel: ".js_translation-cancel"
    },

    events: {
        "click @ui.confirm": "onConfirmClick",
        "click @ui.cancel": "onCancelClick"
    },

    initialize: function(options){
        this.parentView = options.questionView,
        this.messageView = this.parentView.messageView;
        this.languagePreferences = this.parentView.languagePreferences;
        this.translatedTo = this.parentView.translatedTo;
        this.originalLocale = this.parentView.originalLocale;
        this.langCache = this.parentView.langCache;
    },

    _localesAsSortedList: null,
    hiddenTargetLocales: ['und', 'mul', 'zxx'],
    localesAsSortedList: function() {
        var hiddenTargetLocales = this.hiddenTargetLocales;
        if (this._localesAsSortedList === null) {
            var localeList = _.map(this.langCache, function(name, loc) {
                return [loc, name];
            });
            localeList = _.filter(localeList, function(x) {
                return hiddenTargetLocales.indexOf(x[0]) < 0;
            });
            localeList = _.sortBy(localeList, function(x) {return x[1];});
            Object.getPrototypeOf(this)._localesAsSortedList = localeList;
        }
        return this._localesAsSortedList;
    },

    nameOfLocale: function(locale) {
        var name = this.langCache[locale];
        if (name === undefined) {
            console.error("The language " + locale + " is not a part of the locale cache!");
            return locale;
        }
        return name;
    },

    onConfirmClick: function(e){
        var that = this,
            user = Ctx.getCurrentUser(),
            preferredLanguageTo = $(this.ui.selectedLanguage).val(); //Will return Array

        if (!preferredLanguageTo) {
            Growl.showBottomGrowl(
                Growl.GrowlReason.ERROR,
                i18n.gettext("Please select a language.")
            ); 
            return; 
        }

        else if (preferredLanguageTo.length > 1) {
            Growl.showBottomGrowl(
                Growl.GrowlReason.ERROR,
                i18n.gettext("You cannot select more than one language")
            );
            return;
        }

        else {
            this.parentView.preferredTarget = preferredLanguageTo[0];
            this.parentView.render();
        }
    },

    onCancelClick: function(ev){
        this.parentView.onLanguageSelectedCancelClick();
    },

    serializeData: function(){
        if ( this.template === "#tmpl-message_translation_question_selection" ){
            return {
                supportedLanguages: this.localesAsSortedList(),
                translatedTo: this.translatedTo,
                question: i18n.sprintf(i18n.gettext("Select the language you wish to translate %s to:"), this.nameOfLocale(this.translatedFrom)),
                translatedTo: this.translatedTo,
                translatedFrom: this.translatedFrom
            };
        }
        else return {};
    }
});

var TranslationView = Marionette.LayoutView.extend({
  constructor: function TranslationView() {
    Marionette.LayoutView.apply(this, arguments);
  },

    template: '#tmpl-loader',

    ui: {
        langChoiceConfirm: '.js_language-of-choice-confirm',
        langChoiceDeny: '.js_language-of-choice-deny',
        hideQuestion: '.js_hide-translation-question',
        
        revealLanguages: '.js_language-of-choice-more',
        // revealLanguagesRegion: '.js_translation-reveal-more'
    },

    events: {
        'click @ui.langChoiceConfirm': 'updateLanguagePreferenceConfirm',
        'click @ui.langChoiceDeny': 'updateLanguagePreferenceDeny',
        'click @ui.hideQuestion': 'onHideQuestionClick',

        'click @ui.revealLanguages': "onLanguageRevealClick"
    },

    regions: {
        selectLanguage: ".js_translation-reveal-more"
    },

    initialize: function(options){
        this.message = options.messageModel;
        this.messageView = options.messageView;

        //Toggle flag for more languages view (nice to have)
        this.moreLanguagesViewShown = false;

        var cm = new CollectionManager(),
            that = this;

        cm.getUserLanguagePreferencesPromise(Ctx)
            .then(function(preferences){
                if (!that.isViewDestroyed()){
                    that.langCache = that.messageView.langCache; //For reference
                    var bestSuggestedTranslation = that.message.get('body').best(preferences),
                        original = that.message.get("body").original(),
                        originalLocale = original.getLocaleValue(),
                        translatedFromLocale = bestSuggestedTranslation.getTranslatedFromLocale(),
                        translatedTo = bestSuggestedTranslation.getBaseLocale(),
                        prefsForLocale = preferences.getPreferenceForLocale(originalLocale),
                        preferredTarget = prefsForLocale ? prefsForLocale.get("translate_to_name") : Ctx.getLocale();
                    if ( !(translatedFromLocale) ){
                        // Get the original's locale and name
                        var original = that.message.get("body").original();

                        translatedFromLocale = translatedTo;
                    }
                    that.originalLocale = originalLocale;
                    that.translatedTo = translatedTo;
                    that.translatedFrom = translatedFromLocale;
                    that.preferredTarget = preferredTarget;
                    that.languagePreferences = preferences; //Should be sorted already
                    that.template = '#tmpl-message_translation_question';
                    that.render();
                }
            });
    },

    nameOfLocale: function(locale) {
        var name = this.langCache[locale];
        if (name === undefined) {
            console.error("The language " + locale + " is not a part of the locale cache!");
            return locale;
        }
        return name;
    },

    updateLanguagePreference: function(state){
        var user = Ctx.getCurrentUser(),
            that = this;
        if (state === userTranslationStates.CONFIRM) {
            this.languagePreferences.setPreference(
                user,
                this.originalLocale,
                this.preferredTarget,
                {
                    success: function(model, resp, options){
                        return processConfirmLanguagePreferences(that.messageView);   
                    }
                }
            );
        }

        if (state === userTranslationStates.DENY) {
            this.languagePreferences.setPreference(
                user,
                this.originalLocale,
                null,
                {
                    success: function(model, resp, options){
                        return processConfirmLanguagePreferences(that.messageView);
                    }
                }
            );
        }
    },

    updateLanguagePreferenceConfirm: function(e){
        this.updateLanguagePreference(userTranslationStates.CONFIRM);
    },

    updateLanguagePreferenceDeny: function(e) {
        this.updateLanguagePreference(userTranslationStates.DENY);
    },

    onLanguageRevealClick: function(ev){
        if (!this.moreLanguagesViewShown) {
            this.getRegion('selectLanguage').show(new LanguageSelectionView({
                messageModel: this.message,
                questionView: this
            }));
            this.moreLanguagesViewShown = true;
        }
        else {
            this.onLanguageSelectedCancelClick();
        }
    },

    /*
        Called by child class to destroy itself
        Since parent has to be passed through to child view,
        fuck using events to trigger this. Child explicitly calls this.
     */
    onLanguageSelectedCancelClick: function(){
        this.getRegion('selectLanguage').empty();
        this.moreLanguagesViewShown = false;
    },

    /*
        Hides the translation view into another element of the message
        Currently, that is the "Show More" dropdown
     */
    onHideQuestionClick: function(e) {
        var that = this;
        this.messageView.closeTranslationView(function(){
            console.log("The message is hidden by now");
        });
    },

    serializeData: function(){
        if (this.template !== "#tmpl-loader") {
            var translationQuestion, noAnswer, yesAnswer, toAnother;
            if (this.preferredTarget) {
                translationQuestion = i18n.sprintf(
                    i18n.gettext("Translate all messages from %s to %s?"),
                    this.nameOfLocale(this.originalLocale),
                    this.nameOfLocale(this.preferredTarget));
                // yesAnswer = i18n.sprintf(
                //     i18n.gettext("Yes, translate all messages to %s"),
                //     this.nameOfLocale(this.preferredTarget));
                // noAnswer = i18n.sprintf(
                //     i18n.gettext("No, do not translate all messages to %s"),
                //     this.nameOfLocale(this.preferredTarget));
            } else {
                translationQuestion = i18n.sprintf(
                    i18n.gettext("Keep %s messages untranslated?"),
                    this.nameOfLocale(this.originalLocale));
                // noAnswer = i18n.sprintf(
                //     i18n.gettext("Yes, keep them untranslated"));
            }
            yesAnswer = i18n.gettext("Yes, Thanks!");
            noAnswer = i18n.gettext("Do not translate");
            toAnother = i18n.gettext("Translate to another language");

            return {
                translationQuestion: translationQuestion,
                yes: yesAnswer,
                no: noAnswer,
                toAnother: toAnother,
                preferredTarget: this.preferredTarget,
                originalLocale: this.originalLocale,
                translatedFromLocale: this.translatedFrom,
                translatedTo: this.translatedTo,
                forceTranslationQuestion: this.messageView.forceTranslationQuestion
            };
        }
    }
});

module.exports = TranslationView;
