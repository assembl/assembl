'use strict';
/**
 * 
 * @module app.views.groups.panelWrapper
 */

var Marionette = require('../../shims/marionette.js'),
    panelViewByPanelSpec = require('../../objects/viewsFactory.js'),
    Ctx = require('../../common/context.js'),
    AssemblPanel = require('../assemblPanel.js'),
    i18n = require('../../utils/i18n.js'),
    panelSpec = require('../../models/panelSpec.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js');
var PanelWrapper = Marionette.LayoutView.extend({
  constructor: function PanelWrapper() {
    Marionette.LayoutView.apply(this, arguments);
  },
  template: "#tmpl-panelWrapper",
  regions: {
    contents: '.panelContents'
  },
  panelType: "groupPanel",
  className: "groupPanel",
  modelEvents: {
    "change:hidden": "setHidden"
  },
  ui: {
    title: ".panel-header-title",
    lockPanel: '.js_lockPanel', // clickable zone, which is bigger than just the following icon
    lockPanelIcon: '.js_lockPanel i',
    minimizePanel: '.js_minimizePanel',
    closePanel: '.js_panel-closeButton',
    panelHeader: '.panel-header',
    panelContentsWhenMinimized: '.panelContentsWhenMinimized'
  },
  events: {
    'click @ui.closePanel': 'closePanel',
    'click @ui.lockPanel': 'toggleLock',
    'click @ui.minimizePanel': 'toggleMinimize'
  },
  _unlockCallbackQueue: {},
  panelLockedReason: null,
  panelUnlockedReason: null,
  minPanelSize:AssemblPanel.prototype.minimized_size,
  
  initialize: function(options) {
    var that = this;
    var contentClass = panelViewByPanelSpec.byPanelSpec(options.contentSpec);
    this.groupContent = options.groupContent;
    if (!this.groupContent) {
      throw new Error("The groupContent wasn't passed in the options");
    }
    this.contentsView = new contentClass({
      panelWrapper: this
    });
    Marionette.bindEntityEvents(this, this.model, this.modelEvents);
    this.setPanelMinWidth();
    $(window).on("resize",function(){
      that.setPanelMinWidth();
    });
  },
  onRender: function() {
    this.contents.show(this.contentsView);
    this.setHidden();
    this.displayContent(true);
    Ctx.initTooltips(this.ui.panelHeader);
    Ctx.initTooltips(this.ui.panelContentsWhenMinimized);
    if (this.model.get('locked')){
      this.lockPanel(true);
    }
    else{
      this.unlockPanel(true);
    }
  },
  serializeData: function() {
    return {
      hideHeader: this.contentsView.hideHeader || false,
      title: this.contentsView.getTitle(),
      tooltip: this.contentsView.tooltip || '',
      headerClass: this.contentsView.headerClass || '',
      userCanChangeUi: Ctx.canUseExpertInterface(),
      hasLock: this.contentsView.lockable,
      hasMinimize: this.contentsView.minimizeable || (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.EXPERT),
      hasClose: this.contentsView.closeable,
      icon: this.getIcon()
    }
  },
  /**
   * TODO: refactor this function because the min-width is set also in _panel.scss
   */
  setPanelMinWidth:function(){
    this.$el.addClass(this.model.attributes.type + '-panel');
    var screenSize = window.innerWidth;
    var isPanelMinimized = this.model.get('minimized');
    if(isPanelMinimized){
      this.model.set('minWidth',this.minPanelSize);
    }else{
      var isSmallScreen = Ctx.isSmallScreen();
      if(!isSmallScreen){
        var panelType = this.model.get('type');
        switch(panelType) {
        case 'ideaList':
            this.model.set('minWidth',350);
            break;
        case 'navSidebar':
            this.model.set('minWidth',350);
            break;
        case 'messageList':
            this.model.set('minWidth',500);
            break;
        case 'ideaPanel':
            this.model.set('minWidth',295);
            break;
        case 'clipboard':
            this.model.set('minWidth',270);
            break;
        case 'synthesisPanel':
            this.model.set('minWidth',200);
            break;
        case 'contextPanel':
            this.model.set('minWidth',450);
            break;
        default:
            this.model.set('minWidth',0);
            break;
        }        
      }else{
        this.model.set('minWidth',screenSize);
      }
    }
  },

  /** 
   * Change the panel minimization state.  No-op if the state already matches
   * @param {boolean} requestedMiminizedState: Should the panel be minimized
   */
  _changeMinimizePanelsState: function(requestedMiminizedState) {
    if(requestedMiminizedState === this.model.get('minimized')) {
      return;
    }
    else {
      this.model.set('minimized',requestedMiminizedState);
      this.setPanelMinWidth();
      this.displayContent();
      this.groupContent.groupContainer.resizeAllPanels();
    }
  },

  toggleMinimize: function() {
    if(this.model.get('minimized')) {
      this._changeMinimizePanelsState(false);
    }
    else {
      this._changeMinimizePanelsState(true);
    }
  },

  unminimizePanel: function(evt) {
    this._changeMinimizePanelsState(false);
  },

  minimizePanel: function(evt) {
    this._changeMinimizePanelsState(true);
  },

  displayContent:function(skipAnimation){
    var animationDuration = 1000;
    var that = this;
    var isPanelMinimized = this.model.get('minimized');
    if(isPanelMinimized){
      this.$('.panel-header-minimize i').addClass('icon-arrowright').removeClass('icon-arrowleft');
      this.$('.panel-header-minimize').attr('data-original-title', i18n.gettext('Maximize panel'));
      if(skipAnimation){
        this.$el.addClass('minSizeGroup');
      }else{
        this.$el.find('.panelContentsWhenMinimized > span').delay(animationDuration * 0.6).fadeIn(animationDuration * 0.3);
        this.$el.find('.panelContents').fadeOut(animationDuration * 0.9);
        this.$el.find("header span.panel-header-title").fadeOut(animationDuration * 0.4);
        this.$el.children(".panelContentsWhenMinimized").delay(animationDuration * 0.6).fadeIn(animationDuration * 0.4);
      }
    }else{
      this.$('.panel-header-minimize i').addClass('icon-arrowleft').removeClass('icon-arrowright');
      this.$('.panel-header-minimize').attr('data-original-title', i18n.gettext('Minimize panel'));
      if(skipAnimation){
        this.$el.removeClass('minSizeGroup');
      }else{
        this.$el.find('.panelContentsWhenMinimized > span').fadeOut(animationDuration * 0.3);
        this.$el.find('.panelContents').delay(animationDuration * 0.2).fadeIn(animationDuration * 0.8);
        this.$el.find("header span.panel-header-title").delay(animationDuration * 0.5).fadeIn(animationDuration * 0.5);
        this.$el.children(".panelContentsWhenMinimized").fadeOut(animationDuration * 0.3);
      }
    }
  },
  
  resetTitle: function(newTitle) {
    this.ui.title.html(newTitle);
  },
  closePanel: function() {
    Ctx.removeCurrentlyDisplayedTooltips();
    this.model.collection.remove(this.model);
  },
  setHidden: function() {
    if (this.model.get('hidden')) {
      this.$el.hide();
    } else {
      this.$el.css('display', 'table-cell'); /* Set it back to its original value, which is "display: table-cell" in _groupContainer.scss . But why is it so? */
    }
    this.groupContent.groupContainer.resizeAllPanels(true);
  },
  /**
   * lock the panel if unlocked
   */
  lockPanel: function(force) {
    if (force || !this.model.get('locked')) {
      this.model.set('locked', true);
      this.ui.lockPanelIcon
          .addClass('icon-lock')
          .removeClass('icon-lock-open')
          .attr('data-original-title', i18n.gettext('Unlock panel'));
    }
  },
  /**
   * @param {boolean} locking: True if we want to lock the panel. False if we want to unlock it
   * @param {boolean} informUser: Show a tooltip next to the lock icon, informing the user that the panel has been autolocked.
   * @param {string} reason: The reason why the panel will be automatically locked. Possible values: undefined, "USER_IS_WRITING_A_MESSAGE", "USER_WAS_WRITING_A_MESSAGE"
   **/
  autoLockOrUnlockPanel: function(locking, informUser, reason) {
    var that = this;
    informUser = (informUser === undefined) ? true : informUser;
    locking = (locking === undefined) ? true : locking;
    reason = (reason === undefined) ? null : reason;
    var needsToChange = (locking && !this.model.get('locked')) || (!locking && this.model.get('locked'));
    if (needsToChange) {
      if (locking)
          this.lockPanel();
      else
          this.unlockPanel();
      if (locking)
          that.panelLockedReason = reason;
      else
          that.panelUnlockedReason = reason;
      if (informUser) {
        // show a special tooltip
        setTimeout(function() {
          var el = that.ui.lockPanelIcon;
          var initialTitle = el.attr("data-original-title");

          if (locking && reason == "USER_IS_WRITING_A_MESSAGE") {
            el.attr("data-original-title", i18n.gettext("We have locked the panel for you, so its content won't change while you're writing your message. Click here to unlock"));
          }
          else if (!locking && reason == "USER_WAS_WRITING_A_MESSAGE") {
            el.attr("data-original-title", i18n.gettext("We have unlocked the panel for you, so its content can change now that you're not writing a message anymore. Click here to lock it back"));
          }
          else {
            if (locking) {
              el.attr("data-original-title", i18n.gettext("We have locked the panel for you. Click here to unlock"));
            }
            else {
              el.attr("data-original-title", i18n.gettext("We have unlocked the panel for you. Click here to lock it back"));
            }
          }
          el.tooltip('destroy');
          el.tooltip({container: Ctx.getTooltipsContainerSelector(), placement: 'left'});
          el.tooltip('show');
          setTimeout(function() {
            el.attr("data-original-title", initialTitle);
            el.tooltip('destroy');
            el.tooltip({container: Ctx.getTooltipsContainerSelector()});
          }, 7000);
        }, 5000); // FIXME: if we set this timer lower than this, the tooltip shows and immediately disappears. Why?
      }
    }
  },
  /**
   * @param {boolean} informUser: Show a tooltip next to the lock icon, informing the user that the panel has been autolocked.
   * @param {string} reason: The reason why the panel will be automatically locked. Possible values: undefined, "USER_IS_WRITING_A_MESSAGE"
   **/
  autoLockPanel: function(informUser, reason) {
    this.autoLockOrUnlockPanel(true, informUser, reason);
  },
  /**
   * @param {boolean} informUser: bool. Show a tooltip next to the lock icon, informing the user that the panel has been autounlocked.
   * @param {string} reason: The reason why the panel will be automatically unlocked. Possible values: undefined, "USER_WAS_WRITING_A_MESSAGE"
   **/
  autoUnlockPanel: function(informUser, reason) {
    this.autoLockOrUnlockPanel(false, informUser, reason);
  },
  /**
   * unlock the panel if locked
   */
  unlockPanel: function(force) {
    if (force || this.model.get('locked')) {
      this.model.set('locked', false);
      this.ui.lockPanelIcon
          .addClass('icon-lock-open')
          .removeClass('icon-lock lockedGlow')
          .attr('data-original-title', i18n.gettext('Lock panel'));

      if (_.size(this._unlockCallbackQueue) > 0) {
        //console.log("Executing queued callbacks in queue: ",this.unlockCallbackQueue);
        _.each(this._unlockCallbackQueue, function(callback) {
          callback();
        });
        //We presume the callbacks have their own calls to render
        this._unlockCallbackQueue = {};
      }
    }
  },
  /**
   * Toggle the lock state of the panel
   */
  toggleLock: function() {
    console.log("toggleLock()");
    if (this.isPanelLocked()) {
      console.log("panel was locked, so we unlock it");
      this.unlockPanel(true);
    } else {
      console.log("panel was unlocked, so we lock it");
      this.lockPanel(true);
    }
  },
  isPanelLocked: function() {
    return this.model.get('locked');
  },
  getPanelLockedReason: function() {
    return this.panelLockedReason;
  },
  getPanelUnlockedReason: function() {
    return this.panelUnlockedReason;
  },
  isPanelMinimized: function() {
    return this.model.get('minimized');
  },
  isPanelHidden: function() {
    return this.model.get('hidden');
  },
  /**
   * Process a callback that can be inhibited by panel locking.
   * If the panel is unlocked, the callback will be called immediately.
   * If the panel is locked, visual notifications will be shown, and the
   * callback will be memorized in a queue, removing duplicates.
   * Callbacks receive no parameters.
   * If queued, they must assume that they can be called at a later time,
   * and have the means of getting any updated information they need.
   */
  filterThroughPanelLock: function(callback, queueWithId) {
    if (!this.model.get('locked')) {
      callback();
      this.ui.lockPanel.children().removeClass('lockedGlow');

    } else {

      this.ui.lockPanel.children().addClass('lockedGlow');

      if (queueWithId) {
        if (this._unlockCallbackQueue[queueWithId] !== undefined) {
        }
        else {
          this._unlockCallbackQueue[queueWithId] = callback;
        }
      }
    }
  },
  getIcon: function() {
    var type = this.contentsView.panelType,
        icon = '';
    switch (type) {
      case PanelSpecTypes.IDEA_PANEL:
        icon = 'icon-idea';
        break;
      case PanelSpecTypes.NAV_SIDEBAR:
        icon = 'icon-home';
        break;
      case PanelSpecTypes.MESSAGE_LIST:
        icon = 'icon-comment';
        break;
      case PanelSpecTypes.CLIPBOARD:
        // ne need because of resetTitle - segment
        icon = 'icon-clipboard';
        break;
      case PanelSpecTypes.SYNTHESIS_EDITOR:
        icon = 'icon-doc';
        break;
      case PanelSpecTypes.DISCUSSION_CONTEXT:
        break;
      case PanelSpecTypes.TABLE_OF_IDEAS:
        icon = 'icon-discuss';
        break;
      default:
        break;
    }
    return icon;
  }
});
module.exports = PanelWrapper;
