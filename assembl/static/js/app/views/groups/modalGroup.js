'use strict';

var Marionette = require('../../shims/marionette.js'),
    _ = require('../../shims/underscore.js'),
    Assembl = require('../../app.js'),
    Ctx = require('../../common/context.js'),
    i18n = require('../../utils/i18n.js'),
    //panelSpec = require('../../models/panelSpec'),
    //PanelSpecTypes = require('../../utils/panelSpecTypes'),
    //viewsFactory = require('../../objects/viewsFactory'),
    groupSpec = require('../../models/groupSpec'),
    GroupContainer = require('../groups/groupContainer');

var ModalGroup = Backbone.Modal.extend({
  template: _.template($('#tmpl-groupModal').html()),

  className: 'panelGroups-modal popin-wrapper',

  cancelEl: '.close, .js_close',

  keyControl: false,

  /** Takes a groupSpec as model
   * 
   */
  initialize: function () {
    this.$('.bbm-modal').addClass('popin');
    var groupSpecCollection = new groupSpec.Collection([this.model]);
    this.groupsView = new GroupContainer({
      collection: groupSpecCollection
    });
  },

  events: {
    'submit #partner-form' :'validatePartner'
  },

  onRender: function() {
    this.groupsView.render();
    this.$('.popin-body').html(this.groupsView.el);
  },

  getGroupContentView: function() {
    console.log("Looking for model:", this.model, "in:", _.clone(this.groupsView.children.indexByModel));
    console.log("Result: ", this.groupsView.children.findByModel(this.groupSpecModel))
    return this.groupsView.children.findByModel(this.groupSpecModel);
  }

});

module.exports = ModalGroup;