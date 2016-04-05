'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('underscore'),
    $ = require('jquery'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js');

var DocumentView = Marionette.ItemView.extend({
  constructor: function DocumentView() {
    Marionette.ItemView.apply(this, arguments);
  },

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
        //this.addClass("hidden");
        
        //The current accepted failure case is to simply present the url as is.
        var url = $(this).text().trim();
        if (url){
          $(this).empty().append("<a href="+url+">"+url+"</a>");
        }
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
