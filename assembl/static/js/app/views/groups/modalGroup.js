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

  title: null,

  /**
   * A modal group has only a single group
   */
  getGroup: function() {
    if(!this.groupsView.isViewRendered() && !this.groupsView.isViewDestroyed()) {
      //so children will work
      this.groupsView.render();
    }
    var firstGroup = this.groupsView.children.first();
    if(!firstGroup) {
      console.log( this.groupsView.children);
      throw new Error("There is no group in the modal!");
    }
    return firstGroup;
  },

  /** Takes a groupSpec as model
   * 
   */
  initialize: function (options) {
    if ( options && "title" in options )
      this.title = options.title;
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
    if(!this.groupsView.isViewDestroyed()) {
      if(!this.groupsView.isViewRendered()) {
        this.groupsView.render();
      }
      this.$('.popin-body').html(this.groupsView.el);
    }
  },

  onShow: function() {
    this.groupsView.onAttach();
  },

  serializeData: function(){
    return {
      "title": this.title
    };
  },

  getGroupContentView: function() {
    console.log("Looking for model:", this.model, "in:", _.clone(this.groupsView.children.indexByModel));
    console.log("Result: ", this.groupsView.children.findByModel(this.groupSpecModel))
    return this.groupsView.children.findByModel(this.groupSpecModel);
  }

});

module.exports = ModalGroup;