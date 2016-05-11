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
    /*
      The container view of the document.
      The document's first parent is an attachment view
      The parent is the parent of the attachment view.
     */
    this.parentView = options.parentView ? options.parentView : null;
    this.uri = this.model.get('external_url') ? this.model.get('external_url') : this.model.get('uri');
  },

  doOembed: function() {
    //console.log (this.model.get('external_url'));
    var that = this;
    this.$el.oembed(this.uri, {
      //initiallyVisible: false,
      embedMethod: "fill",

      //apikeys: {
      //etsy : 'd0jq4lmfi5bjbrxq2etulmjr',
      //},
      maxHeight: "300px", maxWidth: "100%",
      debug: false,
      onEmbedFailed: function() {
        if (Ctx.debugOembed){
          console.log("onEmbedFailed (assembl)");
        }
        //this.addClass("hidden");
        
        // //The current accepted failure case is to simply present the url as is.
        // var url = $(this).text().trim();
        // if (url){
        //   $(this).empty().append("<a href="+url+">"+url+"</a>");
        // }
        that.onRenderOembedFail();
      },
      onError: function(externalUrl, embedProvider, textStatus, jqXHR) {
        if (jqXHR) {
          // Do not reload assembl for an embed failure
          jqXHR.handled = true;
        }
        if (Ctx.debugOembed){
          console.log('err:', externalUrl, embedProvider, textStatus);
        }
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
    
    this.$el.html(loaderHtml); //First, put a loader, then oembed
    this.doOembed();

  },

  /**
   * Override to alter the Oembed failure condition
   */
  onRenderOembedFail: function(){
    this.$el.html("<a href="+ this.uri + " target='_blank'>"+ this.uri + "</a>");
  }

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
  },

  onRender: function(){
    console.log("[doingOembed] uri:", this.uri);
    if (!this.uri){
      console.error("[DocumentView Failed] uri does not exist for model id " + this.model.id +
                    " and external_url " + this.model.get('external_url'));
    }
    AbstractDocumentView.prototype.onRender.call(this);
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
      name: this.model.get('title'),
      url: this.uri,
      percent: null
    }
  },

  onRender: function(){
    console.log("[doingOembed] uri:", this.uri);
    if (!this.uri){
      console.error("[FileView Failed] uri does not exist for model id " + this.model.id +
                    " and external_url " + this.model.get('external_url'));
    }
    AbstractDocumentView.prototype.onRender.call(this);
  },

  onRenderOembedFail: function(){
    this.$el.html("<a href="+ this.uri + " target='_blank'>"+ this.model.get('title') + "</a>");
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
    this.percentComplete = 0; // Float from 0-100
    var that = this;
    if (options.showProgress) {
      this.showProgress = true;
    }

    /*
      For lifecycle of a document model, the model must be saved, in order
      for file types to be servable and renderable via the backend. Therefore,
      upon view init, save the model.

      However, upon attachment re-render, the view is re-instantiated.
      Therefore, do not PUT on the model if it is already been saved.
     */
    if (this.model.isNew()){
      Promise.resolve(this.model.save()).then(function(){
        if (!that.isViewDestroyed()){
          that.initalizeCallback();
        }
      });
    }
    else {
      if (!that.isViewDestroyed()){
        that.initalizeCallback();
      }
    }
  },

  initalizeCallback: function(model){
    /*
      Override in subclasses to override what the view will initalize after
      saving its model to the backend.
     */
    // this.$(window).on("beforeunload", function(ev){this.onBeforeUnload(ev)});
    throw new Error("Cannot instantiate an AbstractDocumentEditView");
  },

  /**
   * Override in child classes 
   */
  onShowProgress: function(ev){
    if (this.showProgress) {
      console.log("Show the progress of the file upload in view with event", ev);
    }
  },

  onBeforeUnload: function(ev){
    console.log("AbstractEditView onBeforeUnload called with args", arguments);
    this.$(window).off('beforeunload');
    this.parentView.model.destroy(); //Eh, doubt this will work?
  }
});

var DocumentEditView = AbstractEditView.extend({
  constructor: function DocumentEditView(){
    AbstractEditView.apply(this, arguments);
  },

  template: "#tmpl-fileEmbed",

  initialize: function(options){
    AbstractEditView.prototype.initialize.call(this, options);
  },

  initalizeCallback: function(){
    if (!this.isViewDestroyed()){
      this.render();
    }
  },

  serializeData: function(){
    return {
      url: this.uri
    }
  }

});

var FileEditView = AbstractEditView.extend({
  constructor: function FileEditView(){
    AbstractEditView.apply(this, arguments);
  },

  template: "#tmpl-fileUploadEmbed",

  initalize: function(options){
    AbstractEditView.prototype.initalize.call(this, options);
  },

  initalizeCallback: function(){
    this.uploadComplete = true;
    this.uri = this.model.get('external_url');
    if (!this.isViewDestroyed()){
      this.render();
    }
  },

  serializeData: function(){
    return {
      name: this.model.get('title'),
      url: this.uploadComplete ? this.uri : "javascript:void(0)",
      percent: this.percentComplete
    }
  },

  onShowProgress: function(ev){
    // console.log("FileEditView progress bar has been made!", ev);
    this.percentComplete = ev * 100;
    if (!this.isViewDestroyed()){
      this.render();
    }
  },

  /*
    This is poorly done. It overrides the current template. Want to be using
    the template logic here to maintain flexibility and keeping DRY
   */
  onRenderOembedFail: function(){
    var string = "<a href="+ this.uri + " target='_blank'>"+ this.model.get('title') + "</a>";
    if (this.percentComplete){
      this.$el.html(string + " (100%)");
    }
    else { 
      this.$el.html(string);
    }
  }
});


module.exports = {
  DocumentView: DocumentView,
  DocumentEditView: DocumentEditView,
  FileView: FileView,
  FileEditView: FileEditView
};
