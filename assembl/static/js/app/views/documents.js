'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('underscore'),
    $ = require('jquery'),
    Assembl = require('../app.js'),
    Promise = require('bluebird'),
    Ctx = require('../common/context.js');


var AbstractDocumentView = Marionette.ItemView.extend({
  constructor: function AbstractDocumentView(){
    Marionette.ItemView.apply(this, arguments);
  },

  className: 'embeddedFile',

  initialize: function(options){
    if (!this.model) {
      throw new Error('file needs a model');
    }

    this.uri = this.model.get('external_url') ? this.model.get('external_url') : this.model.get('uri');
  },

  // ui: {
  //   mainfield: '.ckeditorField-mainfield',
  //   saveButton: '.ckeditorField-savebtn',
  //   cancelButton: '.ckeditorField-cancelbtn'
  // },

  // events: {
  //   'click @ui.mainfield': 'changeToEditMode',
  //   'click @ui.saveButton': 'saveEdition',
  //   'click @ui.cancelButton': 'cancelEdition'
  // },

  doOembed: function() {
    //console.log (this.model.get('external_url'));
    this.$el.oembed(this.uri, {
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

});


var DocumentView = AbstractDocumentView.extend({
  constructor: function DocumentView() {
    AbstractDocumentView.apply(this, arguments);
  },

  template: '#tmpl-fileEmbed',

  initialize: function(options){
    AbstractDocumentView.prototype.initialize.call(this, options);
  },

  serializeData: function() {
    return {
      url: this.uri
    }
  }
});


var FileView = AbstractDocumentView.extend({
  constructor: function FileView(){
    AbstractDocumentView.apply(this, arguments);
  },

  template: "#tmpl-fileUploadEmbed",

  initialize: function(options){
    AbstractDocumentView.prototype.initialize.call(this, options);
  },

  serializeData: function(){
    return {
      name: this.model.get('name')
    }
  }   
});


var AbstractEditView =  AbstractDocumentView.extend({
  constructor: function AbstractEditView(){
    AbstractDocumentView.apply(this, arguments);
  },

  template: "#tmpl-loader",

  modelEvents: {
    'progress': 'onShowProgress'
  },

  initialize: function(options){
    
    AbstractDocumentView.prototype.initialize.call(this, options);
    this.showProgress = false;
    var that = this;

    if (options.showProgress) {
      this.showProgress = true;
    }

    // Promise.resolve(this.model.save()).then(function(model){
    //   initalizeCallback(model);
    // });
    setTimeout(function(){
      if (!that.isViewDestroyed() ){
        that.initalizeCallback();
      }
    }, 10000);
  },

  initalizeCallback: function(model){
    /*
      Override in subclasses to override what the view will initalize after
      saving its model to the backend.
     */
    throw new Error("Cannot instantiate an AbstractDocumentEditView");
  },

  onShowProgress: function(ev){
    if (this.showProgress) {
      console.log("Show the progress of the file upload in view");
    }
  }
});

var DocumentEditView = AbstractEditView.extend({
  constructor: function DocumentEditView(){
    AbstractEditView.apply(this, arguments);
  },

  initialize: function(options){
    AbstractEditView.prototype.initialize.call(this, options);
  },

  initalizeCallback: function(model){
    console.log("Callback made here.");
    this.template = "#tmpl-fileEmbed";
    this.render();
  },

  serializeData: function(){
    return {
      url: this.model.get('uri')
    }
  }

});

var FileEditView = AbstractEditView.extend({
  constructor: function FileEditView(){
    AbstractEditView.apply(this, arguments);
  },

  initialize: function(options){
    AbstractEditView.prototype.initialize.call(this, options);
  },

  initalizeCallback: function(model){
    this.template = "#tmpl-fileUploadEmbed";
    this.uploadComplete = false;
    this.render();
  },

  onRender: function(){
    if (this.uploadComplete) {
      AbstractEditView.prototype.onRender.apply(this, arguments);
    }
    else {
      Marionette.ItemView.prototype.onRender.apply(this, arguments);
    }
  },

  serializeData: function(){
    return {
      name: this.model.get('name')
    }
  },

  onShowProgress: function(ev){
    console.log("FileEditView progress bar has been made!", ev);
    this.render();
  }
});


module.exports = {
  DocumentView: DocumentView,
  DocumentEditView: DocumentEditView,
  FileView: FileView,
  FileEditView: FileEditView
};
