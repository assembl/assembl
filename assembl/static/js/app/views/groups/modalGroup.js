'use strict';

var Marionette = require('../../shims/marionette.js'),
    _ = require('underscore'),
    Assembl = require('../../app.js'),
    Ctx = require('../../common/context.js'),
    i18n = require('../../utils/i18n.js'),

    //panelSpec = require('../../models/panelSpec'),
    //PanelSpecTypes = require('../../utils/panelSpecTypes'),
    //viewsFactory = require('../../objects/viewsFactory'),
    groupSpec = require('../../models/groupSpec'),
    GroupContainer = require('../groups/groupContainer');

var ModalGroupView = Backbone.Modal.extend({
  constructor: function ModalGroupView() {
    Backbone.Modal.apply(this, arguments);
  },

  template: _.template($('#tmpl-groupModal').html()),

  className: 'panelGroups-modal popin-wrapper',

  cancelEl: '.close, .js_close',

  keyControl: false,

  title: null,

  /**
   * A modal group has only a single group
   */
  getGroup: function() {
    if (!this.groupsView.isViewRendered() && !this.groupsView.isViewDestroyed()) {
      //so children will work
      this.groupsView.render();
    }

    var firstGroup = this.groupsView.children.first();
    if (!firstGroup) {
      console.log(this.groupsView.children);
      throw new Error("There is no group in the modal!");
    }

    return firstGroup;
  },

  /** Takes a groupSpec as model
   * 
   */
  initialize: function(options) {
    if (options && "title" in options)
      this.title = options.title;
    this.$('.bbm-modal').addClass('popin');
    var groupSpecCollection = new groupSpec.Collection([this.model]);
    this.groupsView = new GroupContainer({
      collection: groupSpecCollection
    });
  },

  events: {
    'submit #partner-form':'validatePartner'
  },

  onRender: function() {
    if (!this.groupsView.isViewDestroyed()) {
      if (!this.groupsView.isViewRendered()) {
        this.groupsView.render();
      }

      this.$('.popin-body').html(this.groupsView.el);
    }
  },

  serializeData: function() {
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
/**
 * @param title:  title of the modal
 * @param filters: an array of objects:
 *   filterDef:  a member of availableFilters in postFilter.js
 *   value:  the value to be filtered
 * @return: {modal: modal, messagePanel: messagePanel}
 *  modal is a fully configured instance of ModalGroup.
 */
var filteredMessagePanelFactory = function(modal_title, filters) {
  var panelSpec = require('../../models/panelSpec.js');
  var PanelSpecTypes = require('../../utils/panelSpecTypes.js');
  var viewsFactory = require('../../objects/viewsFactory');

  var defaults = {
      panels: new panelSpec.Collection([
                                        {type: PanelSpecTypes.MESSAGE_LIST.id, minimized: false}
                                        ],
                                        {'viewsFactory': viewsFactory })
  };
  var groupSpecModel = new groupSpec.Model(defaults);
  var modal = new ModalGroupView({"model": groupSpecModel, "title": modal_title});
  var group = modal.getGroup();

  var messagePanel = group.findViewByType(PanelSpecTypes.MESSAGE_LIST);
  messagePanel.setViewStyle(messagePanel.ViewStyles.THREADED, true)
  _.each(filters, function(filter){
    messagePanel.currentQuery.initialize();
    //messagePanel.currentQuery.addFilter(this.messageListView.currentQuery.availableFilters.POST_IS_DESCENDENT_OR_ANCESTOR_OF_POST, this.model.id);
    messagePanel.currentQuery.addFilter(filter.filterDef, filter.value);
  });

  //console.log("About to manually trigger messagePanel render");
  //Re-render so the changes above are taken into account
  messagePanel.render();
  return {modal: modal, messageList: messagePanel};
}
module.exports = { 
    View: ModalGroupView,
    filteredMessagePanelFactory: filteredMessagePanelFactory
  }
