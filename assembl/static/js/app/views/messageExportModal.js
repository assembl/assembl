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
    initialize: function (options) {
      this.$('.bbm-modal').addClass('popin');
      this.messageCreator = null;
      this.model = options.model;
      this.formType = undefined; 
      this.currentView = undefined;

      this.vent = options.vent; //Event Aggregator
      //_.bindAll(this, "loadFbView"); //Useful for bind function
      this.vent.on("loadFbView", this.loadFbView, this);
      this.vent.on('submitted', this.submitted, this);

      console.log('modal being initialized');
      var that = this;
      this.model.getCreatorPromise().then(function(user){
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
    loadFbView: function(token){
      var fbView = new facebook.root({
        creator: this.messageCreator,
        model: this.model,
        vent: this.vent,
        token: token
      });
      //Is this the best way to remove everything from the previous view?
      this.$el.empty();
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

      switch(value){
        case 'facebook':
          var that = this;
          facebook.resolveState(function(fbState) {
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
                  errorState: fbState.error,
                  vent: that.vent
              });
              that.$('.js_source-specific-form').html(errView.render().el);
              that.currentView = errView;
            }
          });
          
          break;

        default:
          this.$('.js_source-specific-form').empty();
          this.currentView = null;
          break;
      }
    },
    submitForm: function(e){
      console.log('submitting form');
      e.preventDefault();
      if (!this.formType) {
        console.log('Cannot continue. Form is incomplete.');
      }
      else {
        console.log('currentView', this.currentView);
        var that = this;
        this.currentView.submitForm(function(){
          that.destroy();
        });
      }
    }
});

module.exports = Modal
