'use strict';
/**
 * 
 * @module app.views.groups.groupContent
 */

var Marionette = require('../../shims/marionette.js'),
    Ctx = require('../../common/context.js'),
    i18n = require('../../utils/i18n.js'),
    panelSpec = require('../../models/panelSpec.js'),
    AssemblPanel = require('../assemblPanel.js'),
    PanelWrapper = require('./panelWrapper.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js'),
    Analytics = require('../../internal_modules/analytics/dispatcher.js'),
    Storage = require('../../objects/storage.js'),
    UserCustomData = require('../../models/userCustomData.js');

/** Represents the entire content of a single panel group
* @class  app.views.groups.groupContent.groupContent
*/
var groupContent = Marionette.CompositeView.extend({
  constructor: function groupContent() {
    Marionette.CompositeView.apply(this, arguments);
  },

  template: "#tmpl-groupContent",
  className: "groupContent",
  childViewContainer: ".groupBody",
  childView: PanelWrapper,
  panel_borders_size: 1,


  events: {
    'click .js_closeGroup': 'closeGroup'
  },
  initialize: function(options) {
    this.collection = this.model.get('panels');
    this.groupContainer = options['groupContainer'];
  },
  onRender:function(){
    if (!this.isViewDestroyed()) {
      var navView = this.findViewByType(PanelSpecTypes.NAV_SIDEBAR);
      if (navView) {
        navView.setViewByName(this.model.get('navigationState'), null);
      }
    }
  },
  serializeData: function() {
    return {
      "Ctx": Ctx
    };
  },
  /**
   * Set the given Idea as the current one to be edited
   * @param  {Idea} idea
   */
  setCurrentIdea: function(idea, reason, doScroll) {
    var analytics = Analytics.getInstance();
    if (idea !== this._getCurrentIdea()) {
      if (idea !== null) {
        analytics.changeCurrentPage(analytics.pages.IDEA);
      }
      else {
        //If idea is null, assume we are focussed on the messages
        analytics.changeCurrentPage(analytics.pages.MESSAGES);
      }
      var setReturn = this.model.get('states').at(0).set({currentIdea: idea}, {validate: true});
    }
    else if (idea === null) {
      //Hack for pseudo-ideas, so changes are seen and panel closes
      //Simulate a change event on that model's attribute, to be received by listener in ideaPanel
      this.trigger("change:pseudoIdea", null);
    }
  },
  /**
   * @return: undefined if no idea was set yet.
   * null if it was explicitely set to no idea.
   *
   */
  _getCurrentIdea: function() {
      return this.model.get('states').at(0).get('currentIdea');
    },
  closeGroup: function() {
    this.applyUserCustomDataChangesOnGroupClose();
    this.model.collection.remove(this.model);
    this.groupContainer.resizeAllPanels(true);
  },
  /**
   * Tell the panelWrapper which view to put in its contents
   */
  childViewOptions: function(child, index) {
    return {
      groupContent: this,
      contentSpec: child
    }
  },
  findNavigationSidebarPanelSpec: function() {
    return this.model.findNavigationSidebarPanelSpec();
  },
  isSimpleInterface: function() {
    if (this.findNavigationSidebarPanelSpec()) {
      return true;
    }
    else {
      return false;
    }
  },
  NavigationResetDefaultState: function() {
    return this.NavigationResetDebateState();
  },
  /**
   * Specific to the simple interface.  Does nothing if there is no
   * navigation sidebar panel in this group.
   * If there is, get's it back to the default debate view
   */
  NavigationResetDebateState: function(skip_animation) {
    if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      if (this.findNavigationSidebarPanelSpec()) {
        this.model.set('navigationState', 'debate');
        this.removePanels(PanelSpecTypes.DISCUSSION_CONTEXT, PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
        this.SimpleUIResetMessageAndIdeaPanelState();
        var conversationPanel = this.findViewByType(PanelSpecTypes.MESSAGE_LIST);
      }
    }
  },
  NavigationResetContextState: function() {
    if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      var nav = this.findNavigationSidebarPanelSpec();
      if (nav) {
        this.model.set('navigationState', 'about');
        this.ensureOnlyPanelsVisible(PanelSpecTypes.DISCUSSION_CONTEXT);
      }
    }
  },
  NavigationResetSynthesisMessagesState: function(synthesisInNavigationPanel) {
    if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      if (this.findNavigationSidebarPanelSpec()) {
        this.setCurrentIdea(null);
        this.removePanels(PanelSpecTypes.DISCUSSION_CONTEXT, PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
        this.ensurePanelsVisible(PanelSpecTypes.MESSAGE_LIST);
        this.ensurePanelsHidden(PanelSpecTypes.IDEA_PANEL);
      }
    }
  },
  NavigationResetVisualizationState: function(url) {
    if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      var nav = this.findNavigationSidebarPanelSpec();
      if (nav) {
        this.model.set('navigationState', 'visualizations');
        this.ensureOnlyPanelsVisible(PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
        var vizPanel = this.findViewByType(PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
        vizPanel.setUrl(url);
      }
    }
  },
  SimpleUIResetMessageAndIdeaPanelState: function() {
    if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      var preferences = Ctx.getPreferences();
      // defined here and in collectionManager.getGroupSpecsCollectionPromise
      if (preferences.simple_view_panel_order === "NMI") {
          this.ensurePanelsVisible(PanelSpecTypes.MESSAGE_LIST, PanelSpecTypes.IDEA_PANEL);
      } else {
          this.ensurePanelsVisible(PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST);
      }
      var nav = this.findNavigationSidebarPanelSpec(),
      ideaPanel = this.findPanelWrapperByType(PanelSpecTypes.IDEA_PANEL);
    }
  },
  /**
   * @params panelSpecTypes
   */
  removePanels: function() {
    this.model.removePanels.apply(this.model, arguments);
  },
  addPanel: function(options, position) {
    this.model.addPanel(options, position);
  },
  /**
   * create the model (and corresponding view) if it does not exist.
   */
  ensurePanel: function(options, position) {
    this.model.ensurePanel(options, position);
  },
  /* Typenames are available in the panelType class attribute of each
   * panel class
   *
   */
  findPanelWrapperByType: function(panelSpecType) {
    var model = this.model.getPanelSpecByType(panelSpecType);
    if (model !== undefined) {
      var view = this.children.findByModel(model);
      if (view == null) {
        return undefined;
      }
      else {
        return view;
      }
    }
    return undefined;
  },
  findViewByType: function(panelSpecType) {
      var retval = undefined,
          wrapper = this.findPanelWrapperByType(panelSpecType);

      if (wrapper != null) {
        if (wrapper.contents === undefined) {
          throw new Error("PanelWrapper doesn't have any content");
        }

        retval = wrapper.contents.currentView;
      }
      return retval;
    },
  getNavigationPanel: function(panelSpecType) {
      var retval = undefined,
          navigationPanelSpec = this.model.findNavigationPanelSpec();
      if (navigationPanelSpec) {
        retval = this.findViewByType(navigationPanelSpec);
      }
      return retval;
    },
  /** 
   * ensure only the listed panels, are visible
   * However, all panels are created if necessary
   * @params list of panel names
   */
  ensureOnlyPanelsVisible: function() {
    var that = this,
        args = Array.prototype.slice.call(arguments),
        panels = this.model.get('panels');
    // add missing panels
    this.model.ensurePanelsAt(args, 1);
    // show and hide panels
    _.each(this.model.get('panels').models, function(aPanelSpec) {
      var panelSpecType = aPanelSpec.getPanelSpecType();
      if (panelSpecType === PanelSpecTypes.NAV_SIDEBAR)
          return;
      var view = that.children.findByModel(aPanelSpec);
      if (!view)
          return;
      var shouldBeVisible = _.find(args, function(arg) {
        return panelSpecType === arg
      }) !== undefined;
      aPanelSpec.set('hidden', !shouldBeVisible);
    });
  },
  /**
   * Ensure all listed panels are visible, and in the order listed
   * creating them if necessary.
   * Does not touch visibility of PanelSpecTypes.NAV_SIDEBAR, but creates
   * it if absent
   * @params list of PanelSpecTypes
   */
  ensurePanelsVisible: function() {
    var that = this;
    var args = Array.prototype.slice.call(arguments);
    var panels = this.model.get('panels');
    // add missing panels
    this.model.ensurePanelsAt(args, 1);
    // show and hide panels
    var panelSpecsToMakeVisible = this.model.get('panels').models.filter(function(aPanelSpec) {
      var panelSpecType = aPanelSpec.getPanelSpecType();
      return _.contains(args, panelSpecType);
    });
    if (_.size(args) !== _.size(panelSpecsToMakeVisible)) {
      console.log(args, panelSpecsToMakeVisible);
      throw new Error("Error, unable to find all panels to make visible");
    }
    _.each(panelSpecsToMakeVisible, function(aPanelSpec) {
      aPanelSpec.set('hidden', false);
    });
  },
  /**
   * Ensure all listed panels are hidden if present
   * Skips PanelSpecTypes.NAV_SIDEBAR
   * @params list of panel names
   */
  ensurePanelsHidden: function() {
    var that = this;
    var args = Array.prototype.slice.call(arguments);
    var panels = this.model.get('panels');
    // show and hide panels
    _.each(this.model.get('panels').models, function(aPanelSpec) {
      var panelSpecType = aPanelSpec.getPanelSpecType();
      if (panelSpecType === PanelSpecTypes.NAV_SIDEBAR) {
        return;
      }
      var shouldBeHidden = _.find(args, function(arg) {
        return panelSpecType === arg
      }) !== undefined;
      if (shouldBeHidden) {
        aPanelSpec.set('hidden', true);
      }
    });
  },

  getGroupStoragePrefix: function() {
    var groupContent = this;
    var groupContentIndexInGroupContainer = groupContent.groupContainer.collection.indexOf(groupContent.model);
    var storagePrefix = Storage.getStoragePrefix() + "_group_" + groupContentIndexInGroupContainer;
    return storagePrefix;
  },
  /**
   * When the user closes a panel group, all UserCustomData entries which keys contain the index of the group have to be renamed with their new index.
   */
  applyUserCustomDataChangesOnGroupClose: function() {
    if (!Ctx.isUserConnected()){
      return;
    }
    var groupContent = this;
    var groupContentIndexInGroupContainer = groupContent.groupContainer.collection.indexOf(groupContent.model);
    var sz = groupContent.groupContainer.collection.length;
    var storagePrefix = Storage.getStoragePrefix() + "_group_";
    var storageSuffix = "_table_of_ideas_collapsed_state";
    var i;
    if ( groupContentIndexInGroupContainer < sz-1 ){
      var tableOfIdeasCollapsedStateModels = [];
      var tableOfIdeasCollapsedStatePromises = [];

      for ( i = 0; i < groupContentIndexInGroupContainer; ++i ){
        tableOfIdeasCollapsedStatePromises[i] = Promise.resolve(true);
      }
      for ( i = groupContentIndexInGroupContainer; i < sz ; ++i ){
        tableOfIdeasCollapsedStateModels[i] = new UserCustomData.Model({
          id: storagePrefix + i + storageSuffix
        });
        tableOfIdeasCollapsedStatePromises[i] = tableOfIdeasCollapsedStateModels[i].fetch();
      }
      Promise.all(tableOfIdeasCollapsedStatePromises).then(function(models){
        for ( i = groupContentIndexInGroupContainer; i < sz; ++i ){
          console.log("tableOfIdeasCollapsedStateModels[i]: ", tableOfIdeasCollapsedStateModels[i]);
          // Move table of ideas collapsed state of group number i to one of group number i-1
          tableOfIdeasCollapsedStateModels[i].set("id", storagePrefix + (i-1) + storageSuffix);
          tableOfIdeasCollapsedStateModels[i].save();
        }
      });
    }
  }
});
module.exports = groupContent;
