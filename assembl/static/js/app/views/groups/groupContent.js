'use strict';

var Marionette = require('../../shims/marionette.js'),
    ctx = require('../../common/context.js'),
    i18n = require('../../utils/i18n.js'),
    panelSpec = require('../../models/panelSpec.js'),
    AssemblPanel = require('../assemblPanel.js'),
    PanelWrapper = require('./panelWrapper.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js'),
    Analytics = require('../../internal_modules/analytics/dispatcher.js'),
    Storage = require('../../objects/storage.js'),
    UserCustomData = require('../../models/userCustomData.js');

/** Represents the entire content of a single panel group */
var groupContent = Marionette.CompositeView.extend({
  constructor: function groupContent() {
    Marionette.CompositeView.apply(this, arguments);
  },

  template: "#tmpl-groupContent",
  className: "groupContent",
  childViewContainer: ".groupBody",
  childView: PanelWrapper,
  panel_borders_size: 1,
  minPanelSize:AssemblPanel.prototype.minimized_size,

  initialize: function(options) {
    var that = this;
    this.options = options;
    this.collection = this.model.get('panels');
    this.groupContainer = this.options['groupContainer'];
    setTimeout(function() {
      if (!that.isViewDestroyed()) {
        var navView = that.findViewByType(PanelSpecTypes.NAV_SIDEBAR);
        if (navView) {
          navView.setViewByName(that.model.get('navigationState'), null);
        }
      }
      that.resizePanel(true);
    }, 200); //FIXME:  Magic delay...
    $(window).on("resize",function(){
      that.resizePanel(true);
    });
  },
  events: {
    'click .js_closeGroup': 'closeGroup'
  },
  resizePanel:function(skipAnimation){
    var that = this;
    var screenSize = window.innerWidth;
    _.each(that.groupContainer.collection.models,function(group){
      _.each(group.attributes.panels.models,function(panel){
        var panelMinWidth = panel.get('minWidth');
        var isPanelMinimized = panel.get('minimized');
        var panelWidth = that.getPanelWidth(panelMinWidth,isPanelMinimized);
        var panelId = '#' + panel.cid;
        if(skipAnimation){
          $(that.groupContainer.el).find(panelId).css({'min-width':panelMinWidth});
          $(that.groupContainer.el).find(panelId).width(panelWidth);
        }else{
          var totalWidth = that.getTotalWidth();
          if(totalWidth < screenSize){
            $(that.groupContainer.el).find(panelId).css({'min-width':0});
            $(that.groupContainer.el).find(panelId).animate({'width': panelWidth}, 1000, 'swing',function(){
              $(that.groupContainer.el).find(panelId).css({'min-width':panelMinWidth});
            });
          }else{
            $(that.groupContainer.el).find(panelId).animate({'min-width': panelMinWidth}, 1000, 'swing');
          }
        }
      });
    });
  },
  getPanelWidth:function(panelMinWidth,isPanelMinimized){
    var screenSize = window.innerWidth;
    var criticalSize = 600;
    var panelWIdth = 0;
    if(isPanelMinimized){
      panelWIdth = this.minPanelSize;
    }else{
      if(screenSize > criticalSize){
        var totalWidth = this.getTotalWidth();
        var panelWidthInPercent = (panelMinWidth * 100) / totalWidth;
        var totalMinimized = this.getTotalMinimized();
        var panelWidthInPixel = (panelWidthInPercent * (screenSize-totalMinimized)) / 100;
        panelWIdth = panelWidthInPixel;        
      }else{
        panelWIdth = screenSize;
      }
    }
    return panelWIdth;
  },
  getTotalWidth:function(){
    var totalWidth = 0;
    _.each(this.groupContainer.collection.models,function(group){
      _.each(group.attributes.panels.models,function(panel){
        var isPanelMinimized = panel.get('minimized');
        if(!isPanelMinimized){
          totalWidth += panel.get('minWidth');
        }
      });
    });
    return totalWidth;
  },
  getTotalMinimized:function(){
    var that = this;
    var totalMinimized = 0;
    _.each(this.groupContainer.collection.models,function(group){
      _.each(group.attributes.panels.models,function(panel){
        var isPanelMinimized = panel.get('minimized');
        if(isPanelMinimized){
          totalMinimized += that.minPanelSize;
        }
      });
    });
    return totalMinimized;
  },



  serializeData: function() {
    return {
      "Ctx": ctx
    };
  },



  resizePanelGroup:function(){
    
    //console.log(resizePanelGroup);
  },





  /**
   * Set the given Idea as the current one to be edited
   * @param  {Idea} [idea]
   */
  setCurrentIdea: function(idea, reason, doScroll) {
    var analytics = Analytics.getInstance();

    //console.log("setCurrentIdea() fired", idea, reason, doScroll);
    //console.log(this.model);
    //console.log("current state was: ", this.model.get('states').at(0));
    if (idea !== this._getCurrentIdea()) {
      //console.log("About to set current idea on group:", this.cid);
      //console.log("currentIdea was: ", this.model.get('states').at(0).get('currentIdea'));
      if (idea !== null) {
        analytics.changeCurrentPage(analytics.pages.IDEA);
      }
      else {
        //If idea is null, assume we are focussed on the messages
        analytics.changeCurrentPage(analytics.pages.MESSAGES);
      }
      var setReturn = this.model.get('states').at(0).set({currentIdea: idea}, {validate: true});
      //console.log("Return was:", setReturn, "currentIdea is now: ", this.model.get('states').at(0).get('currentIdea'));
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
      //console.log("_getCurrentIdea() fired, returning", this.model.get('states').at(0).get('currentIdea'));
      return this.model.get('states').at(0).get('currentIdea');
    },

  closeGroup: function() {
    this.applyUserCustomDataChangesOnGroupClose();
    this.model.collection.remove(this.model);
    this.resizePanel(true);
  },

  calculateGridSize: function() {
    /*var gridSize = 0;
    this.children.each(function(panelWrapper) {
      if (panelWrapper.model.get('hidden'))
          return 0;
      if (panelWrapper.model.get('minimized'))
          return 0;
      gridSize += panelWrapper.gridSize;
    });
    return gridSize;*/
  },

  calculateMinWidth: function() {
    /*var minWidth = 0;
    this.children.each(function(panelWrapper) {
      if (panelWrapper.model.get('hidden'))
          return;
      if (panelWrapper.model.get('minimized'))
          minWidth += AssemblPanel.prototype.minimized_size;
      else
          minWidth += panelWrapper.minWidth;
    });
    return minWidth;*/
  },

  getExtraPixels: function(include_embedded_idea_panel) {
    /*var extraPixels = 0, that = this;
    this.children.each(function(panelWrapper) {
      if (panelWrapper.model.get('hidden'))
          return;
      if (!include_embedded_idea_panel
          && panelWrapper.model.get('minimized')
          && that.groupContainer.isOneNavigationGroup()
          && panelWrapper.model.getPanelSpecType() === PanelSpecTypes.IDEA_PANEL) {
        return;
      }

      extraPixels += that.panel_borders_size + panelWrapper.getExtraPixels();
    });
    return extraPixels;*/
  },

  useCurrentSize: function() {
    /*this.$el.stop();
    this.children.each(function(panelWrapper) {
      if (panelWrapper.model.get('hidden'))
          return;
      panelWrapper.useCurrentSize();
    });
    var width = this.$el[0].style.width;
    if (width == "" || width.indexOf('%') >= 0) {
      this.$el.width(this.$el.width());
    }

    this.$el.addClass("animating");*/
  },

  animateTowardsPixels: function(pixels_per_unit, percent_per_unit, extra_pixels, num_units, total_pixels, skip_animation) {
    /*var that = this,
        group_extra_pixels = this.getExtraPixels(false),
        group_units = this.calculateGridSize(),
        myCorrection = group_extra_pixels - (extra_pixels * group_units / num_units),
        width = (100 * group_units / num_units) + "%",
        target = total_pixels * group_units / num_units,
        group_min_size = this.calculateMinWidth(),
        animationDuration = 1000;

    myCorrection = Math.round(myCorrection);

    // minimize use of calc
    if (Math.abs(myCorrection) > 3) {
      target += myCorrection;
      var sign = (myCorrection > 0) ? "+" : "-";
      width = "calc(" + width + " " + sign + " " + Math.abs(myCorrection) + "px)";
    }

    target = Math.max(target, group_min_size);
    var before = that.$el.width();

    var currentRatio = this.$el.width() / this.$el.parent().width();
    var targetRatio = (group_units / num_units) + (myCorrection / this.$el.parent().width());
    var shouldNotResize = false;
    var skipAnimation = skip_animation;
    if (Math.abs(currentRatio - targetRatio) < 0.05 && this.groupContainer.collection.size() == 1) {
      shouldNotResize = true;
    }
    else if (Math.abs(currentRatio - targetRatio) > 0.75 && this.groupContainer.collection.size() == 1) { // big expand of a single group, for example when the user arrives on the website
      skipAnimation = true;
      that.$el.width(width);
    }

    var onAnimationComplete = function() {
      that.$el.width(width);

      // console.log(" group. target width:", width, "=", target, "actual:", before, "->", that.$el.width());
      that.$el.removeClass("animating");
      that.$el.css("min-width", group_min_size);
    };
    if (shouldNotResize) {
      window.setTimeout(onAnimationComplete, animationDuration);
    }
    else {
      this.$el.animate({'width': target}, animationDuration, 'swing', onAnimationComplete);
    }

    this.children.each(function(panelWrapper) {
      if (panelWrapper.model.get('hidden'))
          return;
      panelWrapper.animateTowardsPixels(pixels_per_unit, percent_per_unit, group_extra_pixels, num_units, group_units, total_pixels, skipAnimation);
    });*/
  },

  containerAdjustGridSize: function() {
      /*if (this.groupContainer) {
        this.groupContainer.adjustGridSize();
      }*/
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
        //this.groupContainer.suspendResize();
        this.model.set('navigationState', 'debate');

        this.removePanels(PanelSpecTypes.DISCUSSION_CONTEXT, PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
        this.SimpleUIResetMessageAndIdeaPanelState();

        var conversationPanel = this.findViewByType(PanelSpecTypes.MESSAGE_LIST);

        /*if (skip_animation === false) {
          this.groupContainer.resumeResize(false);
        }
        else {
          this.groupContainer.resumeResize(true);
        }*/
      }
    }
  },

  
  NavigationResetContextState: function() {
    if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      var nav = this.findNavigationSidebarPanelSpec();
      if (nav) {
        //this.groupContainer.suspendResize();
        this.model.set('navigationState', 'about');
        this.ensureOnlyPanelsVisible(PanelSpecTypes.DISCUSSION_CONTEXT);
        //this.groupContainer.resumeResize();
      }
    }
  },

  NavigationResetSynthesisMessagesState: function(synthesisInNavigationPanel) {
    if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      if (this.findNavigationSidebarPanelSpec()) {
        //this.groupContainer.suspendResize();
        this.setCurrentIdea(null);
        this.removePanels(PanelSpecTypes.DISCUSSION_CONTEXT, PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
        this.ensurePanelsVisible(PanelSpecTypes.MESSAGE_LIST);
        this.ensurePanelsHidden(PanelSpecTypes.IDEA_PANEL);
        this.resetMessagePanelWidth();
        //this.groupContainer.resumeResize(true);
      }
    }
  },

  NavigationResetVisualizationState: function(url) {
    if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      var nav = this.findNavigationSidebarPanelSpec();
      if (nav) {
        //this.groupContainer.suspendResize();
        this.model.set('navigationState', 'visualizations');
        this.ensureOnlyPanelsVisible(PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
        var vizPanel = this.findViewByType(PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
        vizPanel.setUrl(url);
        //this.groupContainer.resumeResize();
      }
    }
  },

  resetMessagePanelWidth: function() {
    /*if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      var messagePanel = this.findPanelWrapperByType(PanelSpecTypes.MESSAGE_LIST);
      if (this.groupContainer.isOneNavigationGroup()) {
        var ideaPanel = this.findPanelWrapperByType(PanelSpecTypes.IDEA_PANEL);
        if (ideaPanel.isPanelMinimized() || ideaPanel.isPanelHidden()) {
          messagePanel.setGridSize(AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE); // idea + message
          messagePanel.minWidth = messagePanel.contents.currentView.getMinWidthWithOffset(ideaPanel.minWidth);
        } 
        else {
          messagePanel.setGridSize(AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE);
          messagePanel.minWidth = messagePanel.contents.currentView.getMinWidthWithOffset(0);
        }
      }
      else if (messagePanel != null) {
        messagePanel.setGridSize(AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE);
        messagePanel.minWidth = messagePanel.contents.currentView.getMinWidthWithOffset(0);
      }
    }*/
  },

  SimpleUIResetMessageAndIdeaPanelState: function() {
    if (!this.isViewDestroyed()) {  //Because this is called from outside the view
      //this.groupContainer.suspendResize();
      var preferences = Ctx.getPreferences();
      // defined here and in collectionManager.getGroupSpecsCollectionPromise
      if (preferences.simple_view_panel_order === "NMI") {
          this.ensurePanelsVisible(PanelSpecTypes.MESSAGE_LIST, PanelSpecTypes.IDEA_PANEL);
      } else {
          this.ensurePanelsVisible(PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST);
      }
      var nav = this.findNavigationSidebarPanelSpec(),
      ideaPanel = this.findPanelWrapperByType(PanelSpecTypes.IDEA_PANEL);
      this.resetMessagePanelWidth();
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
    /*else {
        console.log("findPanelWrapperByType: WARNING: unable to find a wrapper for type", panelSpecType);
    }*/
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

      //console.log("findViewByType: returning ", retval, " for type", panelSpecType);
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

    //console.log("ensureOnlyPanelsVisible called with", args);
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

    //console.log("ensurePanelsVisible called with", args);
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
        //console.log("hiding: ", panelSpecType)
        aPanelSpec.set('hidden', true);
      }
      else {
        //console.log("leaving alone: ", panelSpecType)
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
    if ( !Ctx.isUserConnected() ){
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
