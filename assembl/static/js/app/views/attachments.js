'use strict';

var Marionette = require('../shims/marionette.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
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

  serializeData: function() {

  },

  onRender: function() {
    this.documentView = new DocumentView({model: this.model.getDocument()});
  },

  onShow: function() {
    this.documentEmbeedRegion.show(this.documentView);
  }
});


var AttachmentView = AbstractAttachmentView.extend({
  template: '#tmpl-attachment',

  className: 'attachment'
});

var AttachmentEditableView = AbstractAttachmentView.extend({
  template: '#tmpl-attachmentEditable',

  className: 'attachmentEditable'
});

module.exports = module.exports = {
    AttachmentEditableView: AttachmentEditableView,
    AttachmentView: AttachmentView
  };
