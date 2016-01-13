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
            template: $(this.ui.showOriginal).html()
        });

        this.setLangPrefView = Marionette.ItemView.extend({
            template: $(this.ui.setLangPref).html()
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
        this.regions.original.show(this.showOriginalView);

        //Show the question if the user does not yet have an explicit language preference?
        //THIS IS INCOMPLETE
        this.regions.setLangPref.show(this.setLangPrefView);
    }

});

module.exports = TranslationView;
