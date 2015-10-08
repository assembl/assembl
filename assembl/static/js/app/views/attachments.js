'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    i18n = require('../utils/i18n.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Attachments = require('../models/attachments.js'),
    Documents = require('../models/documents.js'),
    DocumentView = require('./documents.js');

/** 
 * Represents the link between an object (ex: Message, Idea) and a remote (url)
 * or eventually local document attached to it.
 */
var AbstractAttachmentView = Marionette.LayoutView.extend({

  initialize: function(options) {
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
      url: this.model.getDocument().get("uri"),
      i18n: i18n
    };
  },

  onRender: function() {
    //console.log("AbstractAttachmentView: onRender with this.model:",this.model);
    //console.log(this.model.get('attachmentPurpose'), Attachments.attachmentPurposeTypes.DO_NOT_USE.id);
    if(this.model.get('attachmentPurpose') !== Attachments.attachmentPurposeTypes.DO_NOT_USE.id) {
      var documentView = new DocumentView({model: this.model.getDocument()});
      this.documentEmbeedRegion.show(documentView);
    }
  },

  onShow: function() {

  }
});


var AttachmentView = AbstractAttachmentView.extend({
  template: '#tmpl-attachment',

  className: 'attachment'
});

var AttachmentEditableView = AbstractAttachmentView.extend({
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
  
  
  
  
  onRender: function() {
    AbstractAttachmentView.prototype.onRender.call(this);
    this.renderAttachmentPurposeDropdown();
  },

  /**
   * Renders the messagelist view style dropdown button
   */
  renderAttachmentPurposeDropdown: function() {
    var that = this,
        purposesHtml = [];

    _.each(Attachments.attachmentPurposeTypes, function(attachmentPurposeDef) {
      purposesHtml.push('<li><a class="js_attachmentPurposeDropdownListItem" data-id="' + attachmentPurposeDef.id + '" data-toggle="tooltip" title="" data-placement="left" data-original-title="' + attachmentPurposeDef.id + '">' + attachmentPurposeDef.label + '</a></li>');
        });

    var html = "";
    html += '<a href="#" class="dropdown-toggle" data-toggle="dropdown" aria-expanded="false">';
    html += Attachments.attachmentPurposeTypes[this.model.get('attachmentPurpose')].label;
    html += '<span class="icon-arrowdown"></span></a>';
    html += '<ul class="dropdown-menu">';
    html += purposesHtml.join('');
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

module.exports = module.exports = {
    AttachmentEditableView: AttachmentEditableView,
    AttachmentView: AttachmentView
  };
