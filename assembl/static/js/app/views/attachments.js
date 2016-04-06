'use strict';

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

  onRender: function() {
    //console.log("AbstractAttachmentView: onRender with this.model:",this.model);
    //console.log(this.model.get('attachmentPurpose'), Attachments.attachmentPurposeTypes.DO_NOT_USE.id);
    if(this.model.get('attachmentPurpose') !== Attachments.attachmentPurposeTypes.DO_NOT_USE.id) {
      var documentModel = this.model.getDocument(),
          documentView;
      
      if (documentModel.isFileType()) {
        documentView = new DocumentViews.FileView({model: documentModel});
      }
      else {
        documentView = new DocumentViews.DocumentView({model: documentModel});
        
      }
      this.documentEmbeedRegion.show(documentView);
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
    var that = this;
    this.extasAdded = {};
    _.each(this.extras, function(v,k){
      that.extasAdded[k] = false;
    });
  },

  serializeData: function(){
    return {
      header: i18n.sprintf(i18n.gettext("For URL %s in the text above"), this.uri)
    }
  },
  
  onRender: function() {
    AbstractAttachmentView.prototype.onRender.call(this);
    this.populateExtas();
    this.renderAttachmentPurposeDropdown(
      this._renderAttachmentPurpose()
    );
  },

  _updateExtasCompleted: function(){
    _.each(this.extras, function(v, k){
      this.extasAdded[k] = true;
    });
  },

  populateExtas: function(){
    /*
      Override to populate extras array with HTML array which will be appended to the end of the
      attachment purpose dropdown
      Ensure to update the cache of extas completed. Otherwise, each render will introduce 1 more of the
      extras
     */
    this._updateExtasCompleted();
  },

  _renderAttachmentPurpose: function(){
    var purposesHtml = [],
        that = this;
    _.each(Attachments.attachmentPurposeTypes, function(attachmentPurposeDef) {
      purposesHtml.push('<li><a class="js_attachmentPurposeDropdownListItem" data-id="' + attachmentPurposeDef.id + '" data-toggle="tooltip" title="" data-placement="left" data-original-title="' + attachmentPurposeDef.id + '">' + attachmentPurposeDef.label + '</a></li>');
    });

    if (this.extras) {
      _.each(this.extras, function(v,k){
        if (!that.extasAdded[k]) {
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
    html += Attachments.attachmentPurposeTypes[this.model.get('attachmentPurpose')].label;
    html += '<span class="icon-arrowdown"></span></a>';
    html += '<ul class="dropdown-menu">';
    html += purposesList ? purposesList.join(''): "";
    html += '</ul>';
    this.ui.attachmentPurposeDropdown.html(html);

  },
  
  purposeDropdownListClick: function(ev) {
    console.log('purposeDropdownListClick():', ev.currentTarget.dataset.id);
    if(Attachments.attachmentPurposeTypes[ev.currentTarget.dataset.id] === undefined) {
      throw new Error("Invalid attachment purpose: ", ev.currentTarget.dataset.id);
    }
    this.model.set('attachmentPurpose', ev.currentTarget.dataset.id);
  }

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

  populateExtas: function(){
    var a = "<li><a class='js_removeAttachment' data-toggle='tooltip' title='' data-placement='left' data-id='CANCEL_UPLOAD' data-original-title='CANCEL_UPLOAD'>" + i18n.gettext("Remove") + "</a></li>"
    this.extras["REMOVE"] = a;
  },

  onRemoveAttachment: function(ev){
    console.log('Attachment was deleted!');
  },

  serializeData: function(){
    return {
      header: i18n.gettext("For the uploaded file")
    }
  }

});

var AttachmentEditableCollectionView = Marionette.CollectionView.extend({
  constructor: function AttachmentEditableCollectionView() {
    Marionette.CollectionView.apply(this, arguments);
  },

  getChildView: function(item){

    var d = item.getDocument();
    switch (d.get('@type') ) {
      case Types.DOCUMENT:
        return AttachmentEditableView
        break;
      case Types.FILE:
        return AttachmentFileEditableView;
        break;
      default:
        return new Error("Cannot create a CollectionView with a document of @type: " + d.get('@type'));
        break;
    }
  }
});

module.exports = module.exports = {
    AttachmentEditableView: AttachmentEditableView,
    AttachmentView: AttachmentView,
    AttachmentEditableCollectionView: AttachmentEditableCollectionView
  };
