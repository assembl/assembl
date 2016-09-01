'use strict';
/**
 * 
 * @module app.views.attachments
 */

var Marionette = require('../shims/marionette.js'),
    _ = require('underscore'),
    $ = require('jquery'),
    i18n = require('../utils/i18n.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Types = require('../utils/types.js'),
    Attachments = require('../models/attachments.js'),
    Documents = require('../models/documents.js'),
    DocumentViews = require('./documents.js');


const TARGET = {
  IDEA: 'IDEA',
  MESSAGE: 'MESSAGE'
};

/** 
 * Represents the link between an object (ex: Message, Idea) and a remote (url)
 * or eventually local document attached to it.
 */
var AbstractAttachmentView = Marionette.LayoutView.extend({
  constructor: function AbstractAttachmentView() {
    Marionette.LayoutView.apply(this, arguments);
  },


  initialize: function(options) {
    var d = this.model.getDocument();
    this.uri = d.get('external_url') ? d.get('external_url') : d.get('uri');
  },

  ui: {
    documentEmbeed: '.js_regionDocumentEmbeed'
  },

  regions: {
    documentEmbeedRegion: '@ui.documentEmbeed'
  },

  events: {

  },

  modelEvents: {
    'change': 'render'
  },

  serializeData: function() {
    return {
      url: this.uri,
      i18n: i18n
    };
  },

  renderDocument: function(){
    var documentModel = this.model.getDocument(),
        hash = {
          model: documentModel
        },
        documentView;
    
    if (documentModel.isFileType()) {
      documentView = new DocumentViews.FileView(hash);
    }
    else {
      documentView = new DocumentViews.DocumentView(hash);
      
    }
    this.documentEmbeedRegion.show(documentView);
  },
  onRender: function() {
    //console.log("AbstractAttachmentView: onRender with this.model:",this.model);
    //console.log(this.model.get('attachmentPurpose'), Attachments.attachmentPurposeTypes.DO_NOT_USE.id);
    if(this.model.get('attachmentPurpose') !== Attachments.attachmentPurposeTypes.DO_NOT_USE.id) {
      this.renderDocument();
    }
  },

  onShow: function() {
  }
});


var AttachmentView = AbstractAttachmentView.extend({
  constructor: function AttachmentView() {
    AbstractAttachmentView.apply(this, arguments);
  },

  template: '#tmpl-attachment',

  className: 'attachment'
});

var AttachmentEditableView = AbstractAttachmentView.extend({
  constructor: function AttachmentEditableView() {
    AbstractAttachmentView.apply(this, arguments);
  },

  template: '#tmpl-attachmentEditable',

  className: 'attachmentEditable',
  
  ui: _.extend({}, AbstractAttachmentView.prototype.ui, {
    attachmentPurposeDropdown: '.js_attachmentPurposeDropdownRegion'
  }),
  
  regions: _.extend({}, AbstractAttachmentView.prototype.regions, {
    attachmentPurposeDropdownRegion: '@ui.attachmentPurposeDropdown'
  }),
  
  events:_.extend({}, AbstractAttachmentView.prototype.events, {
    'click .js_attachmentPurposeDropdownListItem': 'purposeDropdownListClick' //Dynamically rendered, do NOT use @ui
  }),
  
  extras: {},

  initialize: function(options){
    //A parent view is passed which will be used to dictate the lifecycle of document creation/deletion
    AbstractAttachmentView.prototype.initialize.call(this, options);
    //parentView => the container around AttachmentEditableCollectionView, if passed 
    this.parentView = options.parent ? options.parent : null;
    var that = this;
    this.extrasAdded = {};
    _.each(that.extras, function(v,k){
      that.extrasAdded[k] = false;
    });
  },

  serializeData: function(){
    return {
      header: i18n.sprintf(i18n.gettext("For URL %s in the text above"), this.uri)
    }
  },
  
  renderDocument: function(){
    var documentModel = this.model.getDocument(),
        documentView;
    
    if (documentModel.isFileType()) {
      documentView = new DocumentViews.FileEditView({
        model: documentModel,
        showProgress: true,
        parentView: this
      });
    }
    else {
      documentView = new DocumentViews.DocumentEditView({
        model: documentModel,
        parentView: this
      });
      
    }
    this.documentEmbeedRegion.show(documentView);
  },

  onRender: function() {
    //console.log("AttachmentEditableView onRender called for model", this.model.id);
    AbstractAttachmentView.prototype.onRender.call(this);
    this.populateExtras();
    this.renderAttachmentPurposeDropdown(
      this._renderAttachmentPurpose()
    );
  },

  _updateExtrasCompleted: function(){
    var that = this;
    _.each(that.extras, function(v, k){
      that.extrasAdded[k] = true;
    });
  },

  populateExtras: function(){
    /*
      Override to populate extras array with HTML array which will be appended to the end of the
      attachment purpose dropdown
      Ensure to update the cache of extras completed. Otherwise, each render will introduce 1 more of the
      extras
     */
    this._updateExtrasCompleted();
  },

  _renderAttachmentPurpose: function(){
    var purposesHtml = [],
        that = this;
    if(this.model.get('@type') !== 'IdeaAttachment'){
      _.each(Attachments.attachmentPurposeTypes, function(attachmentPurposeDef) {
        purposesHtml.push('<li><a class="js_attachmentPurposeDropdownListItem" data-id="' + attachmentPurposeDef.id + '" data-toggle="tooltip" title="" data-placement="left" data-original-title="' + attachmentPurposeDef.id + '">' + attachmentPurposeDef.label + '</a></li>');
      });
    }
    if (this.extras) {
      _.each(that.extras, function(v,k){
        if (!that.extrasAdded[k]) {
          purposesHtml.push(v);
        }
      });
    }

    return purposesHtml;
  },
  /**
   * Renders the messagelist view style dropdown button
   */
  renderAttachmentPurposeDropdown: function(purposesList) {
    var that = this,
        html = "";

    html += '<a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">';
    html += '<span class="dropdown-label">';
    html += Attachments.attachmentPurposeTypes[this.model.get('attachmentPurpose')].label;
    html += '</span>';
    html += '<span class="icon-arrowdown"></span></a>';
    html += '<ul class="dropdown-menu">';
    html += purposesList ? purposesList.join(''): "";
    html += '</ul>';
    this.ui.attachmentPurposeDropdown.html(html);

  },
  
  purposeDropdownListClick: function(ev) {
    // console.log('purposeDropdownListClick():', ev.currentTarget.dataset.id);
    if(Attachments.attachmentPurposeTypes[ev.currentTarget.dataset.id] === undefined) {
      throw new Error("Invalid attachment purpose: ", ev.currentTarget.dataset.id);
    }
    this.model.set('attachmentPurpose', ev.currentTarget.dataset.id);
  },

  onRemoveAttachment: function(ev){
    ev.stopPropagation();
    //The model is not persisted if it is in an EditableView, so this does not call DELETE
    //to the backend
    this.model.destroy();
  },

});


var AttachmentFileEditableView = AttachmentEditableView.extend({
  constructor: function AttachmentFileEditableView(){
    AttachmentEditableView.apply(this, arguments);
  },

  className: "fileAttachmentEditable",

  ui: _.extend({}, AttachmentEditableView.prototype.ui, {
    remove: ".js_removeAttachment"
  }),

  events: _.extend({}, AttachmentEditableView.prototype.events, {
    'click .js_removeAttachment': 'onRemoveAttachment'
  }),

  populateExtras: function(){
    var a = "<li><a class='js_removeAttachment' data-toggle='tooltip' title='' data-placement='left' data-id='CANCEL_UPLOAD' data-original-title='CANCEL_UPLOAD'>" + i18n.gettext("Remove") + "</a></li>"
    this.extras["REMOVE"] = a;
    // this._updateExtrasCompleted();
  },

  serializeData: function(){
    return {
      header: i18n.gettext("For the uploaded file")
    }
  }

});


/*
  The view used for attachments in the idea panel when attachment is editable
  ie. when the user has the permission to upload a file.
 */
var AttachmentFileEditableViewIdeaPanel = AttachmentFileEditableView.extend({
  initialize: function(options){
    //Save the attachment as soons as the document is saved
    var doc = this.model.getDocument();
    this.listenToOnce(doc, 'sync', this.onDocumentSave);
    AttachmentFileEditableView.prototype.initialize.call(this, options);
  },

  modelEvents: {
    'add': 'onAdd',
    'destroy': 'onDestroy'
  },

  onDocumentSave: function(documentModel, resp, options){
    //Save the attachment model as well, as in the idea panel, there is no confirmation
    //to save the attachment
    this.model.save();
  },  

  /*
    There is a limit of 1 attachment, so this *should* only be called once
   */
  onAdd: function(e){
    var domObject = $(".content-ideapanel");
    domObject.css('top', '250px');
  },

  onDestroy: function(e){
    var domObject = $(".content-ideapanel");
    domObject.css('top', '0px');
  }
});

/*
  Generic view for a file-based attachment that failed to load
 */
var AttachmentEditableErrorView = AttachmentView.extend({
  constructor: function AttachmentEditableErrorView(){
    AttachmentEditableView.apply(this, arguments);
  },

  initialize: function(options){
    AttachmentView.prototype.initialize.call(this, options);
  },

  onRender: function(){
    var fileName = this.model.getDocument().get('file').name
    var text = i18n.sprintf(
      i18n.gettext("We are sorry, there was an error during the upload of the file \"%s\". Please try again."), fileName
    );
    this.$el.html("<div class='error-message'>"+ text +"</div>");
  }
}); 


/*
  The collection view that will display all the attachment types that the message can support in an editable state
 */
var AttachmentEditableCollectionView = Marionette.CollectionView.extend({
  constructor: function AttachmentEditableCollectionView() {
    Marionette.CollectionView.apply(this, arguments);
  },

  initialize: function(options){
    this.parentView = options.parentView ? options.parentView : null;
    this.limits = options.limits || {};
  },

  /*
    To change the kind of view generated dynamically, subclass and
    override this method to define new behaviour.
   */
  getFileEditView: function(){
    return AttachmentFileEditableView;
  },

  getChildView: function(item){

    if (item.isFailed()){
      return AttachmentEditableErrorView;
    }

    var d = item.getDocument();
    switch (d.get('@type') ) {
      case Types.DOCUMENT:
        return AttachmentEditableView
        break;
      case Types.FILE:
        return this.getFileEditView();
        break;
      default:
        return new Error("Cannot create a CollectionView with a document of @type: " + d.get('@type'));
        break;
    }
  },

  childViewOptions: function(){
    return {
      parent: this,
      limits: this.limits
    }
  }
});


/*
  An editable view for attachments in the idea panel
 */
var AttachmentEditableCollectionViewIdeaPanel = AttachmentEditableCollectionView.extend({
  constructor: function AttachmentEditableCollectionViewIdeaPanel(){
    AttachmentEditableCollectionView.apply(this, arguments);
  },

  getFileEditView: function(){
    return AttachmentFileEditableViewIdeaPanel;
  }

});

/*
  A contained view that will show attachments
 */
var AttachmentEditUploadView = Marionette.LayoutView.extend({

  constructor: function AttachmentEditUploadView(){
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-uploadView',

  ui: {
    'collectionView': '.js_collection-view',
    'errorView': '.js_collection-view-failed'
  },

  regions: {
    'collectionRegion': '@ui.collectionView',
    'collectionFailedRegion': '@ui.errorView'
  },

  initialize: function(options){
    this.collection = options.collection;
    this.target = options.target || TARGET.MESSAGE;
    this.limits = options.limits;
    //For internal use only. NEVER save this collection to the server!
    this.failedCollection = new Attachments.Collection([],{
      objectAttachedToModel: this.collection.objectAttachedToModel,
      failed: true //Add the flag, so that attachment does not try to validate the collection
    });

    if (!this.collection) {
      throw new Error("Cannot instantiate a DocumentEditUploadView without a collection!");
    }

    var that = this;
    var createAttachmentEditableCollectionView = function(parent, collection){
      if (that.target === TARGET.IDEA) {
        return new AttachmentEditableCollectionViewIdeaPanel({
          collection: collection,
          limits: that.limits,
          parentView: parent
        });
      }
      return new AttachmentEditableCollectionView({
        collection: collection,
        parentView: parent
      });
    }
    
    this.collectionView = createAttachmentEditableCollectionView(this, this.collection);
    this.collectionFailedView = createAttachmentEditableCollectionView(this, this.failedCollection);
  },

  onShow: function(){
    this.collectionRegion.show(this.collectionView);
    this.collectionFailedRegion.show(this.collectionFailedView);
  },

  failModels: function(models){
    _.each(models, function(model){
      model.setFailed();
    });
    this.collection.remove(models);
    this.failedCollection.add(models);
  },

  failModel: function(model){
    return this.failModels([model]);
  },

  getFailedCollection: function(){
    return this.failedCollection;
  }

});

/*
  Another collection view displaying all attachment types that an IDEA PANEL can support in an EDITABLE state
 */
var AttachmentEditUploadViewModal = Backbone.Modal.extend({
  template: '#tmpl-modalWithoutIframe',
  className: 'modal-token-vote-session popin-wrapper',
  cancelEl: '.close, .js_close',

  ui: {
    'body': '.js_modal-body'
  },

  initialize: function(options){
    this.collection = options.collection;
  },

  onRender: function(){
    var resultView = new AttachmentEditUploadView({collection: this.collection, target: TARGET.IDEA});
    this.$(this.ui.body).html(resultView.render().el);
  },

  serializeData: function(){
    return {
      modal_title: i18n.gettext("Upload an Image to the Idea Panel")
    }
  },
});


/*
  The button view that will be the stand-alone view for the attachment button
 */
var AttachmentUploadButtonView = Marionette.ItemView.extend({
  constructor: function AttachmentUploadButtonView(){
    return Marionette.ItemView.apply(this, arguments);
  },

  template: "#tmpl-attachmentButton",

  ui: {
    button: '.js_upload'
  },

  events: {
    'change @ui.button': 'onButtonClick'
  },

  initialize: function(options){
    this.collection = options.collection;
    this.objectAttachedToModel = options.objectAttachedToModel;
    this.limits = options.limits || null;
    this.errorCollection = options.errorCollection || null;
    if (!this.collection || !this.objectAttachedToModel){
      return new Error("Cannot instantiate an AttachmentUploadButtonView without passing " +
                       "an attachment collection that it would affect!");
    }
  },

  clearErrors: function(){
    if (this.errorCollection) {
      this.errorCollection.reset();
    }
  },

  onButtonClick: function(e){
    //Clear out the errorCollection if passed in
    this.clearErrors();
    this.onFileUpload(e);
  },

  onFileUpload: function(e){
    var fs = e.target.files,
        that = this;

    fs = _.map(fs, function(f){
      //There will be file duplication because the file is already on the DOM if previously added
      
      var d = new Documents.FileModel({
        name: f.name,
        mime_type: f.type
      });
      d.set('file', f);

      var attachment = new Attachments.Model({
        document: d,
        objectAttachedToModel: that.objectAttachedToModel,
        idCreator: Ctx.getCurrentUser().id
      });

      return attachment;
    });
    
    this.collection.add(fs);
    //Set to the idea model
  }
});

var AttachmentUploadTextView = AttachmentUploadButtonView.extend({
  constructor: function AttachmentUploadTextView(){
    AttachmentUploadButtonView.prototype.apply(this, arguments);
  },

  template: "#tmpl-attachmentText"
})

module.exports = module.exports = {
    AttachmentEditableView: AttachmentEditableView,
    AttachmentView: AttachmentView,
    AttachmentEditableCollectionView: AttachmentEditableCollectionView,
    AttachmentUploadButtonView: AttachmentUploadButtonView,
    AttachmentUploadTextView: AttachmentUploadTextView,
    AttachmentEditUploadView: AttachmentEditUploadView,
    TARGET: TARGET
  };
