var Backbone = require('../shims/backbone.js'),
    Marionette = require('../shims/marionette.js'),
    i18n = require('../utils/i18n.js')
$ = require('../shims/jquery.js'),
_ = require('../shims/underscore.js'),
Promise = require('bluebird'),
facebook = require('./facebookModal.js');

var Modal = Backbone.Modal.extend({
  template: '#tmpl-loader',
  className: 'group-modal popin-wrapper',
  cancelEl: '.js_close',
  keyControl: false,
  initialize: function(options) {
      console.log('initializing Modal');
      this.$('.bbm-modal').addClass('popin');
      this.$('.js_export_error_message').empty(); //Clear any error message that may have been put there
      this.messageCreator = null;
      this.model = options.model;
      this.formType = undefined; 
      this.currentView = undefined;

      this.vent = options.vent; //Event Aggregator
      //_.bindAll(this, "loadFbView"); //Useful for bind function
      this.vent.on("loadFbView", this.loadFbView, this);
      this.vent.on('submitted', this.submitted, this);
      this.vent.on('clearError', this.clearError, this);

      var that = this;
      this.model.getCreatorPromise().then(function(user) {
        that.messageCreator = user;
        that.template = '#tmpl-exportPostModal';
        that.render();
      });
    },
  events: {
      'change .js_export_supportedList': 'generateView',
      'click .js_ok_submit': 'submitForm'
    },
  serializeData: function() {
      if (this.messageCreator) {
        return {
          creator: this.messageCreator.get('name')
        }
      }
    },
  clearError: function() {
      this.$('.js_export_error_message').empty();
    },
  loadFbView: function(token) {
      var fbView = new facebook.root({
        creator: this.messageCreator,
        model: this.model,
        vent: this.vent,
        token: token
      });

      this.$('.js_source-specific-form').html(fbView.render().el);
      this.currentView = fbView;
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
          var that = this;
          facebook.resolveState(function(fbState) {
            console.log('The state of the checkState function', fbState);
            if (fbState.ready) {
              var fbView = new facebook.root({
                creator: that.messageCreator,
                model: that.model,
                vent: that.vent
              });
              that.$('.js_source-specific-form').html(fbView.render().el);
              that.currentView = fbView;  
            }
            else {
              var errView = new facebook.error({
                ready: fbState.ready,
                errorState: fbState.errorState,
                vent: that.vent
              });
              that.$('.js_source-specific-form').html(errView.render().el);
              that.currentView = errView;
            }
          });
          
          break;

        default:
          this.$('.js_source-specific-form').empty();
          this.$('.js_export_error_message').empty();
          this.currentView = null;
          break;
      }
    },
  submitForm: function(e) {
      console.log('submitting form');
      e.preventDefault();
      if (!this.formType) {
        console.log('Cannot continue. Form is incomplete.');
        var er = i18n.gettext("Please select a destination to export to before continuing");
        $('.js_export_error_message').text(er);
      }
      else {
        var that = this;
        console.log('currentView', this.currentView);
        this.currentView.submitForm(function() {
          that.destroy();
        }, function() {
          var text = i18n.gettext("Facebook was unable to create the post. Close the box and try again.")
          that.$('.js_export_error_message').text(text);
        });
      }
    }
});

module.exports = Modal
