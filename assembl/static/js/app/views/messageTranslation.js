var Marionette = require('../shims/marionette.js'),
    Backbone = require('../shims/backbone.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    i18n = require('../utils/i18n.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js');

var TranslationView = Marionette.LayoutView.extend({
    template: '#tmpl-message_translation',

    ui: {
        showOriginal: '.js_translation_show_original', //Show original region
        setLangPref: '.js_translation_question', //Question region
        langChoiceConfirm: '.js_language_of_choice_confirm',
        langChoiceCancel: '.js_language_of_choice_deny',
        confirmLangPref: '.js_translate_all_confirm_msg',
        gotoSettings: '.js_load_profile_settings',
    },

    regions: {
        original: '@ui.showOriginal',
        setLangPref: '@ui.setLangPref'
    },

    events: {
        'click @ui.showOriginal': 'showOriginal',
        'click @ui.confirmLangPref': 'updateLanguagePreference',
        'click @ui.gotoSettings': 'loadProfile'
    },

    initialize: function(options){
        this.message = options.messageModel;
        this.showOriginalView = Marionette.ItemView.extend({
            // @AY: Your approach did not, and I think cannot work. Let's review together. MAP.
            template: //$(this.ui.showOriginal).html()
            "<div class='js_translation_show_original'>" +
            "<span class='js_trans_show_origin'>{{ gettext('View the original message') }} </span>" +
            "<span>{{ gettext('Translated by Google Translate') }} </span></div>"
        });

        this.setLangPrefView = Marionette.ItemView.extend({
            template: //$(this.ui.setLangPref).html()
            "<div class='js_translation_question'><span>{{ gettext('Translate all message from ') }} </span><span><select><% _.each(supportedLanguages, function(lang){ %><option><%= lang %></option><% }) %></select></span><span class='js_language_of_choice_confirm'>{{ gettext('Yes') }}</span><span class='js_language_of_choice_deny'>{{ gettext('Do not translate') }} </span></div>"
        });

        var that = this;
        var cm = new CollectionManager();
        cm.getUserLanguagePreferencesPromise()
            .then(function(preferences){
                that.languagePreferences = preferences; //Should be sorted already
            });
    },

    showOriginal: function(e){
        console.log('Showing the original');
    },

    updateLanguagePreference: function(e){
        console.log('Updating the language preference of the user')
    },

    serializeData: function(){
        //Currently debugging mode, this must be the list of languages available for google translate
        return {
            supportedLanguages: ['English', 'French', 'German', 'Farsi', 'Turkish']
        }
    },

    onRender: function(){
        //Whenever a TranslationView is rendered, the message was translated.
        
        //Always show the see original
        this.getRegion("original").show(new this.showOriginalView());

        //Show the question if the user does not yet have an explicit language preference?
        //THIS IS INCOMPLETE
        this.getRegion("setLangPref").show(new this.setLangPrefView());
    }

});

module.exports = TranslationView;
