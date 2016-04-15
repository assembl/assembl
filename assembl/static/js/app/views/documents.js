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
    
    //this.$el.html(loaderHtml);

    this.doOembed();

  },

  /**
   * Override to alter the Oembed failure condition
   */
  onRenderOembedFail: function(){
    this.$el.html("<a href="+ this.uri + ">"+ this.uri + "</a>");
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
      name: this.model.get('name'),
      url: this.uri,
      percent: null
    }
  },

  onRenderOembedFail: function(){
    this.$el.html("<a href="+ this.uri + ">"+ this.model.get('name') + "</a>");
  }
});


var AbstractEditView =  AbstractDocumentView.extend({
  constructor: function AbstractEditView(){
    AbstractDocumentView.apply(this, arguments);
  },

  template: "#tmpl-loader",

  modelEvents: {
    'progress': 'onShowProgress',
    'doNotDelete': 'onDoNotDelete'
  },

  initialize: function(options){
    
    AbstractDocumentView.prototype.initialize.call(this, options);
    this.showProgress = false;
    this.percentComplete = 0; // Float from 0-100
    this.rightToDelete = true;
    var that = this;
    if (options.showProgress) {
      this.showProgress = true;
    }

    Promise.resolve(this.model.save()).then(function(){
      if (!that.isViewDestroyed()){
        that.initalizeCallback();
      }
    });
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
    this.onBeforeDestroy();
  },

  /*
    Since lifecycle of the document is bound to the view lifecycle,
    we use an override to ensure when an attachment is finally saved,
    the document is no longer deleted
   */
  onDoNotDelete: function(){
    console.log("onDoNotDelete for model", this.model);
    this.rightToDelete = false;
  },

  onBeforeDestroy: function(){
    if (this.rightToDelete){
      this.model.destroy();
    }
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
      name: this.model.get('name'),
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
    var string = "<a href="+ this.uri + ">"+ this.model.get('name') + "</a>";
    if (this.percentComplete){
      this.$el.html(string + " (100%)");
    }
    else {
      this.$el.html(string);
    }
  }
});


var DocumentEditUploadView = Marionette.LayoutView.extend({
  //This will have a region for the upload button
  //And a collection view for the collection of entities
  //
  //Can add a wrapper class for the models that will be appended to the
  //collection (ie. attachment models) and the respective views.

  constructor: function DocumentEditUploadView(){
    Marionette.LayoutView.apply(this, arguments);
  },

  template: 'tmpl-uploadView',

  ui: {
    'collectionView': '.js_collection-view',
    'uploadButton': '.js_upload-button'
  },

  events: {
    'change @ui.uploadButton': 'onFileUpload'
  },

  regions: {
    'collectionRegion': '@ui.collectionView'
  },

  initialize: function(options){
    this.collection = options.collection;
    this.CollectionViewClass = options.collectionView;
    this.autoBox = options.autoBoxFunc;

    if (!this.collection || !this.CollectionViewClass) {
      throw new Error("Cannot instantiate a DocumentEditUploadView without a collection and a CollectionViewClass!");
    }
  },

  onShow: function(){
    var view = new this.CollectionViewClass({collection: this.collection})
    this.collectionRegion.show(view);
  },

  onFileUpload: function(e){
    var fs = e.target.files,
        that = this;
    console.log("A file has been uploaded");

    _.each(fs, function(f){
      var d = new Documents.FileModel({
        name: f.name,
        mime_type: f.type
      });
      d.set('file', f);

      if ( (that.autoBox) && (_.isFunction(that.autoBox)) ) {
        try {
          var boxed = that.autoBox(d);
          that.collection.add(boxed);
        }
        catch (error) {
          console.error("Autoboxing Document model creation failed. Adding document to collection.");
          that.collection.add(d);
        }
      }
    });
  }

});


module.exports = {
  DocumentView: DocumentView,
  DocumentEditView: DocumentEditView,
  FileView: FileView,
  FileEditView: FileEditView
};
