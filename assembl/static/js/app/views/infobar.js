'use strict';

var Marionette = require('../shims/marionette.js'),
    $ = require('../shims/jquery.js');

var Infobar = Marionette.LayoutView.extend({
  template: '#tmpl-infobar',
  className: 'content-infobar',
  events: {
    'click .js_closeInfobar': 'closeInfobar',
    'click .js_openSession': 'openSession'
  },

  openSession: function(e, options) {

    var model = new Backbone.Model();
    model.set("id", "local:Widget/2");

    if (options)
        model.set("view", options.view);
    else
        model.set("view", "index");

    var Modal = Backbone.Modal.extend({
      template: _.template($('#tmpl-session-modal').html()),
      model: model
    });

    var modalView = new Modal();
    $('.popin-container').html(modalView.render().el);
    this.$('.groupsContainer').addClass('hasInfobar');
  },

  closeInfobar: function() {
    if (window.localStorage) {
      //benoitg:  Not good, this will close every infobar for every discussion!
      // TODO: should be id idea
      window.localStorage.removeItem('showInfobar');
    }

    this.remove();
    this.unbind();

    $('#wrapper .groupsContainer').animate({
      top: '36px'
    }, 500);
    this.$('.groupsContainer').removeClass('hasInfobar');
  }
});

module.exports = Infobar;
