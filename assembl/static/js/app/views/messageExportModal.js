var Backbone = require('../shims/backbone.js'),
    Marionette = require('../shims/marionette.js'),
    i18n = require('../utils/i18n.js')
    $ = require('../shims/jquery.js'),
    _ = require('../shims/underscore.js'),
    Promise = require('bluebird');

var Modal = Backbone.Modal.extend({
    template: '#tmpl-loader',
    className: 'group-modal popin-wrapper',
    cancelEl: '.js_close',
    keyControl: false,
    initialize: function (options) {
      this.$('.bbm-modal').addClass('popin');
      this.messageCreator = null;
      var that = this; //modal view context
      console.log('modal being initialized');
      options.model.getCreatorPromise().then(function(user){
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
    generateView: function(event) {
      var value = this.$(event.currentTarget)
                      .find('option:selected')
                      .val();
      console.log('the facebook module', facebook);
      switch(value){
        case 'facebook':
          var status = facebook.state();
          console.log('In modal, after status call', status);

          //if (! (facebook.status == facebook.statusEnum.CONNECTED)) {
          if (true) {
            this.$('.js_source-specific-form').html(
              new facebook.error({message: 'whatever'}).render().el);
            break;
          }
          else {
            var fbView = new facebook.root();
            this.$('.js_source-specific-form').html(fbView.render().el);
            break;

          }
        default:
          this.$('.js_source-specific-form').html("");
          break;
      }
    }
});

module.exports = Modal
