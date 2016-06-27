/**
 * 
 * @module app.views.messageExportModal
 */
var Backbone = require('backbone'),
    Marionette = require('../shims/marionette.js'),
    i18n = require('../utils/i18n.js'),
    $ = require('jquery'),
    _ = require('underscore'),
    Source = require('../models/sources.js'),
    FacebookViews = require('./facebookViews.js');

var Modal = Backbone.Modal.extend({
  constructor: function Modal() {
    Backbone.Modal.apply(this, arguments);
  },

  template: '#tmpl-loader',
  className: 'group-modal popin-wrapper',
  cancelEl: '.js_close',
  keyControl: false,
  initialize: function(options) {
      console.log('initializing Modal');
      this.$('.bbm-modal').addClass('popin');
      this.$('.js_export_error_message').empty(); //Clear any error message that may have been put there
      this.messageCreator = null;
      this.exportedMessage = options.exportedMessage;
      this.formType = undefined; 
      this.currentView = undefined;

      Ctx.setCurrentModalView(this);

      var that = this;
      this.exportedMessage.getCreatorPromise().then(function(user) {
        that.messageCreator = user;
        that.template = '#tmpl-exportPostModal';
        that.render();
      });
    },
  events: {
      'change .js_export_supportedList': 'generateView'
    },
  serializeData: function() {
      if (this.messageCreator) {
        return {
          creator: this.messageCreator.get('name')
        }
      }
    },
  loadFbView: function() {
      var fbView = new FacebookViews.init({
        exportedMessage: this.exportedMessage,
        model: new Source.Model.FacebookSinglePostSource()
      });

      this.$('.js_source-specific-form').html(fbView.render().el);
      //Because we are not yet using marionette's version of Backbone.modal.
      fbView.onShow();
    },
  generateView: function(event) {
      //Whilst checking for accessTokens, make the region where
      //facebook will be rendered a loader

      var value = this.$(event.currentTarget)
                      .find('option:selected')
                      .val();

      this.formType = value;

      console.log('Generating the view', value);

      switch (value){
        case 'facebook':
          this.loadFbView();
          break;

        default:
          this.$('.js_source-specific-form').empty();
          this.$('.js_export_error_message').empty();
          break;
      }
    }
});

module.exports = Modal
