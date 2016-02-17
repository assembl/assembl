var Marionette = require('../shims/marionette.js'),
    $ = require('../shims/jquery.js'),
    i18n = require('../utils/i18n.js'),
    Promise = require('bluebird'),
    Growl = require('../utils/growl.js');


/**
 * An abstract class that defines the Marionette View
 * to use for the editing of each source in a source list
 * view.
 */
module.exports = Marionette.ItemView.extend({
  constructor: function exports() {
    Marionette.ItemView.apply(this, arguments);
  },

    ui: {
        submit: '.js_saveSource',
    },

    events: {
        'click @ui.submit': 'submitForm'
    },

    submitForm: function(e) {
        e.preventDefault();
        this.saveModel();
    },

    /**
     * A function to override by sub-class to get the
     * model changed values
     * @return Object of values for the model to change
     */
    fetchValues: function(){
        throw new Error("Cannot call fetchValues on an abstract class!");
    },

    saveModel: function(){
        var values = this.fetchValues();
        this.model.set(values);
        this.model.save(null, {
            success: function(model, resp){
                Growl.showBottomGrowl(Growl.GrowlReason.SUCCESS, i18n.gettext('Your settings were saved!'));
            },

            error: function(model, resp){
              Growl.showBottomGrowl(Growl.GrowlReason.ERROR, i18n.gettext('Your settings failed to update.'));  
            }
        });
    }
});
