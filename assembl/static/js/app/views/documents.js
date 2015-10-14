'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Document = require('../models/documents.js');

var DocumentView = Marionette.ItemView.extend({
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

  doOembed: function() {
    //console.log (this.model.get('uri'));
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
      onError: function(externalUrl, embedProvider, textStatus, jqXHR) {
        if (jqXHR) {
          // Do not reload assembl for an embed failure
          jqXHR.handled = true;
        }
        console.log('err:', externalUrl, embedProvider, textStatus);
      },
      afterEmbed: function() {
        //console.log("Embeeding done");
      },
      proxyHeadCall: function(url) {
        return "/api/v1/mime_type?url=" + encodeURIComponent(url);
      }
    });
  },

  onRender: function() {
    var that = this;

    var LoaderView = require('../views/loader.js'),
        loader = new LoaderView(),
        loaderHtml = loader.render().el;
    
    //this.$el.html(loaderHtml);

    this.doOembed();

  },

  onAttach: function() {
    //console.log("DocumentView.onAttach()");
    //this.doOembed();
  }
});

module.exports = DocumentView;
