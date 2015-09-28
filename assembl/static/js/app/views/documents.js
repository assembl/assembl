'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Document = require('../models/documents.js');

var FileView = Marionette.ItemView.extend({
  template: '#tmpl-fileEmbed',

  className: 'embeddedFile',

  initialize: function(options) {

    if (!this.model) {
      throw new Error('file needs a model');
    }
  },

  ui: {
    mainfield: '.ckeditorField-mainfield',
    saveButton: '.ckeditorField-savebtn',
    cancelButton: '.ckeditorField-cancelbtn'
  },

  events: {
    'click @ui.mainfield': 'changeToEditMode',
    'click @ui.saveButton': 'saveEdition',
    'click @ui.cancelButton': 'cancelEdition'
  },

  serializeData: function() {
    return {
      url: this.model.get('uri')
    }
  },

  onRender: function() {
    var that = this;

    var LoaderView = require('../views/loader.js'),
    loader = new LoaderView(),
    loaderHtml = loader.render().el;
    
    this.$el.html(loaderHtml);

    this.$el.oembed(this.model.get('uri'), {
      //initiallyVisible: false,
      embedMethod: "fill",

      //apikeys: {
      //etsy : 'd0jq4lmfi5bjbrxq2etulmjr',
      //},
      maxHeight: "300px", maxWidth: "100%",
      debug: false,
      onEmbedFailed: function() {
        console.log("onEmbedFailed (assembl)");
        this.addClass("hidden");
      },
      afterEmbed: function() {
        //console.log("Embeeding done");
      }
    });

  }
});

module.exports = FileView;
