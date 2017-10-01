'use strict';
/**
 *
 * @module app.views.reusableDataFields.EditableLSField
 */

var Marionette = require('../../shims/marionette.js'),
    _ = require('underscore'),
    $ = require('jquery'),
    Assembl = require('../../app.js'),
    Permissions = require('../../utils/permissions.js'),
    LangString = require('../../models/langstring.js'),
    CK = require('ckeditor'),
    EditableField = require('./editableField.js'),
    Ctx = require('../../common/context.js');



var EditableLSField = EditableField.extend({
  constructor: function EditableLSField() {
    EditableField.apply(this, arguments);
  },

  /**
   * CkLSeditor default configuration
   * @type {object}
   */

  initialize: function(options) {
    if (this.model === null) {
      throw new Error('EditableField needs a model');
    }
    if (this.translationData === null) {
      // Or just current Ctx.getLocale()?
      throw new Error('EditableField needs translationData');
    }
    this.translationData = options.translationData;
    EditableField.prototype.initialize.apply(this, arguments)
  },

  getTextValue: function() {
    var ls = this.model.get(this.modelProp);
    if (!ls) {
      return '';
    }
    if (this.editing) {
      // use interface value for edition
      return ls.forInterfaceValue() || '';
    }
    return ls.bestValue(this.translationData);
  },

  setTextValue: function(text) {
    var lse, attrs = {}, ls = this.model.get(this.modelProp);
    if (!ls) {
      ls = new LangString.Model();
      ls.initFromDict({});
    }
    lse = ls.forInterface();
    if (!lse) {
      lse = new LangString.EntryModel({
        value: text,
        '@language': Ctx.getLocale(),
      });
      ls.get("entries").add(lse);
    } else {
      lse.set('value', text);
    }
    attrs[this.modelProp] = ls;
    this.model.save(attrs, {
      success: function(model, resp) {},
      error: function(model, resp) {
        console.error('ERROR: saveEdition', resp.toJSON());
      },
    });
  },
});

module.exports = EditableLSField;
