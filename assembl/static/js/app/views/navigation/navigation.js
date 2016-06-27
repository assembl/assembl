'use strict';

var Marionette = require('../../shims/marionette.js'),
    Jed = require('jed'),
    $ = require('jquery'),
    _ = require('underscore'),
    Assembl = require('../../app.js'),
    IdeaList = require('../ideaList.js'),
    Base = require('../../models/base.js'),
    AboutNavPanel = require('../navigation/about.js'),
    SynthesisInNavigationPanel = require('../navigation/synthesisInNavigation.js'),
    LinkListView = require('../navigation/linkListView.js'),
    AssemblPanel = require('../assemblPanel.js'),
    Ctx = require('../../common/context.js'),
    Permissions = require('../../utils/permissions.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Analytics = require('../../internal_modules/analytics/dispatcher.js');

var NavigationView = AssemblPanel.extend({
  constructor: function NavigationView() {
    AssemblPanel.apply(this, arguments);
  },

  template: "#tmpl-navigation",
  panelType: PanelSpecTypes.NAV_SIDEBAR,
  className: "navSidebar",
  hideHeader: true,
  gridSize: AssemblPanel.prototype.NAVIGATION_PANEL_GRID_SIZE,
  minWidth: 350,

  //This MUST match the variables in _variables.scss
  group_header_height: 0,
  group_editable_header_height: 25,
  li_height: 40,
  getTitle: function() {
    return 'Navigation'; // unused
  },
  regions: {
    about: '.about',
    debate: '.debate',
    synthesis: '.synthesis',
    notification: '.navNotification',
    visualizationList: '.visualization-list'
  },
  ui: {
    navigation: '.js_navigation',
    ideaFromIdealist: '.js_addIdeaFromIdeaList',
    level: 'div.second-level',
    visualization_tab: '#visualization_tab',
    synthesis_tab: '.js_synthesis_tab',
    discussion_tab_minimize_icon: '.js_discussion_tab .js_minimizePanel'
  },
  events: {
    'click @ui.navigation': '_toggleMenuByEvent',
    'click @ui.ideaFromIdealist': 'addIdeaFromIdeaList',
  },
  initialize: function(options) {
    AssemblPanel.prototype.initialize.apply(this, arguments);

    this._accordionContentHeight = null;
    this._accordionHeightTries = 0;
    this.visualizationItems = new Base.Collection();
    this.num_items = 2;

    this.listenTo(Assembl.vent, 'DEPRECATEDnavigation:selected', this.setViewByName);
    this.listenTo(Assembl.vent, 'infobar:closeItem', this.setSideBarHeight);
  },
  onAttach:function() {
    var that = this,
    collectionManager = new CollectionManager();

    var boundSetSideBarHeight = function(){ return that.setSideBarHeight(); };
    boundSetSideBarHeight = _.bind(boundSetSideBarHeight, this);

    $(window).on('resize', boundSetSideBarHeight);

    collectionManager.getDiscussionModelPromise()
    .then(function(discussion) {
      that.discussion = discussion; // Will be used at a later time
      var navigationItemCollections = discussion.getVisualizations();
      if (navigationItemCollections.length > 0) {
        // just use the first one for now.
        that.visualizationItems.reset(navigationItemCollections[0].models);
        that.num_items += 1;
        that.ui.visualization_tab.show();
        setTimeout(function() {
          that.setSideBarHeight();
        }, 500);
      }
    });

    collectionManager.getAllMessageStructureCollectionPromise()
    .then(function(allMessageStructureCollection) {
      if (allMessageStructureCollection.getLastSynthesisPost()) {
        that.num_items += 1;
        that.ui.synthesis_tab.show();
        that.ui.discussion_tab_minimize_icon.hide();
        if (that.getContainingGroup().model.get('navigationState') !== "synthesis") {
          that.ui.synthesis_tab[0].id = "tour_step_synthesis";
          Assembl.vent.trigger("requestTour", "synthesis");
        }
      }

      // Every time a new message arrives, check whether we now have a synthesis among all messages and show "Synthesis" navigation tab

      var messageArrivedCallback = _.bind(function() {
        console.log("navigation::onAttach::messageArrivedCallback()")
        if ( this.getLastSynthesisPost() ){
          console.log("we now have a synthesis, show synthesis tab");
          that.ui.synthesis_tab.show();
        }
      }, allMessageStructureCollection);

      that.listenTo(allMessageStructureCollection, 'add', messageArrivedCallback);

    }).delay(500).then(function() {that.setSideBarHeight();});
  },

  onDestroy:function() {
    $(window).off('resize', this.setSideBarHeight);
  },

  /**
   * @param origin - Analytics context where the event was fired
   */
  setViewByName: function(itemName, origin) {
    if (origin === undefined) {
      origin = '-';
    }
    // Unique condition for homepage, do not toggle the menu and there is no view to load.
    // Redirect to the discusison's homepage URL.
    // The 'home' itemName will only be triggered if there is a discussion homepage URL.
    if (itemName === 'home') {
      //This doesn't seem to work on Mac OS X; perhaps due to the call being deeply nested
      // window.location.href = this.discussion.get('homepage');
      window.location.replace(this.discussion.get('homepage'));
    }
    else {
      this._toggleMenuByName(itemName);
      this._loadView(itemName, origin);
    }
  },

  _toggleMenuByName: function(itemName, options) {
    var elm = this.$('.nav[data-view=' + itemName + ']');
    this._toggleMenuByElement(elm, options);
  },

  _toggleMenuByEvent: function(evt) {
    if ($(evt.target).hasClass("js_minimizePanel"))
        return;
    var elm = $(evt.currentTarget), // use currentTarget instead of target, so that we are sure that it is a .nav element
        view = elm.attr('data-view');
    Assembl.vent.trigger("DEPRECATEDnavigation:selected", view, 'NAVIGATION');
  },

  /**
   * Toggle a navigation accordion item
   * @param  {jQuery} elm
   */
  _toggleMenuByElement: function(elm, options) {
    this.setSideBarHeight();
    var view = elm.attr('data-view');

    if (elm.next(this.ui.level).is(':hidden')) {
      this.$('.nav').next('div:visible').slideUp();
      this.$('.nav').removeClass('active');
      elm.addClass('active');
      elm.next(this.ui.level).slideDown();
    }
  },

  setSideBarHeight: function() {
    var that = this;
    var debouncedFunction = _.debounce(function() {
      if(that.isViewRenderedAndNotYetDestroyed()) {
        that.initVar();
        that.ui.level.height(that._accordionContentHeight);
      }
    }, 1000, true);
    debouncedFunction();
  },

  _loadView: function(view, origin) {
      // clear aspects of current state
      switch (this.getContainingGroup().model.get('navigationState')) {
        case 'synthesis':
          var messageListView = this.getContainingGroup().findViewByType(PanelSpecTypes.MESSAGE_LIST);
          if (messageListView) {
            messageListView.currentQuery.uninitialize();
            if (view === 'debate') {
              messageListView.render();
            }
          }

          break;
      }
      this.getContainingGroup().model.set('navigationState', view);
      var analytics = Analytics.getInstance();
      // set new state
      switch (view) {
        case 'about':
          var aboutNavPanel = new AboutNavPanel({
            groupContent: this.getContainingGroup(),
            panelWrapper: this.getPanelWrapper()
          });
          this.about.show(aboutNavPanel);
          if(origin !== null) {
            analytics.trackEvent(analytics.events.NAVIGATION_OPEN_CONTEXT_SECTION);
            analytics.changeCurrentPage(analytics.pages.SIMPLEUI_CONTEXT_SECTION);
          }
          this.getContainingGroup().NavigationResetContextState();
          break;
        case 'debate':
          var idealist = new IdeaList({
            groupContent: this.getContainingGroup(),
            panelWrapper: this.getPanelWrapper(),
            nav: true
          });
          this.debate.show(idealist);
          if(origin !== null) {
            analytics.trackEvent(analytics.events.NAVIGATION_OPEN_DEBATE_SECTION);
            analytics.changeCurrentPage(analytics.pages.SIMPLEUI_DEBATE_SECTION);
          }
          this.getContainingGroup().NavigationResetDebateState();
          break;
        case 'synthesis':
          var synthesisInNavigationPanel = new SynthesisInNavigationPanel({
            groupContent: this.getContainingGroup(),
            panelWrapper: this.getPanelWrapper()
          });
          this.synthesis.show(synthesisInNavigationPanel);
          if(origin !== null) {
            analytics.trackEvent(analytics.events.NAVIGATION_OPEN_SYNTHESES_SECTION);
            analytics.changeCurrentPage(analytics.pages.SIMPLEUI_SYNTHESES_SECTION);
          }
          this.getContainingGroup().NavigationResetSynthesisMessagesState(synthesisInNavigationPanel);
          break;
        case 'visualizations':
          var visualizationListPanel = new LinkListView({
            groupContent: this.getContainingGroup(),
            collection: this.visualizationItems
          });
          this.visualizationList.show(visualizationListPanel);
          //SHOULDN'T WE CLEAR THE OTHER PANELS HERE?  benoitg- 2015-08-20
          if(origin !== null) {
            analytics.trackEvent(analytics.events.NAVIGATION_OPEN_VISUALIZATIONS_SECTION);
            analytics.changeCurrentPage(analytics.pages.SIMPLEUI_VISUALIZATIONS_SECTION);
          }
          break;
        default:
          break;
      }
    },

  // This method needs the DOM elements of the View to be rendered. So it should not be called in onRender(), but rather in onShow() or onDomRefresh()
  initVar: function() {
    // check wether DOM elements are already rendered
    var marginHeightLi = 0;
    if(Ctx.isSmallScreen()){
      this.li_height = 48;
      marginHeightLi = 0;
    }else{
      this.li_height = 40;
      marginHeightLi = 2;
    }
    var _header = $('#header').height() + $('#infobar').height(),
        _window = $(window).height(),
        _li = this.li_height * this.num_items,
        _headerGroup = ($(".groupHeader").first().hasClass('editable')) ? this.group_editable_header_height : this.group_header_height,
        _sideBarHeight = (_window - _header) - _headerGroup,
        that = this;

    if (this.$el && this.$el.parent() && this.$el.parent().height()) {
      this._accordionContentHeight = _sideBarHeight - _li - marginHeightLi;
    }
    else { // fallback: set an initial estimation
      this._accordionContentHeight = _sideBarHeight - _li - marginHeightLi;

      if (++this._accordionHeightTries < 10) { // prevent infinite loop
        setTimeout(function() {
          that.setSideBarHeight();
        }, 100);
      }
    }

  },

  serializeData: function() {
    return {
      Ctx: Ctx,
      hasMinimize: true, // minimization of the navigation panel is now allowed to everyone. Before, it was: (Ctx.getCurrentInterfaceType() === Ctx.InterfaceTypes.EXPERT),
      canAdd: Ctx.getCurrentUser().can(Permissions.ADD_IDEA)
    }
  },

  addIdeaFromIdeaList: function() {
    Assembl.vent.trigger('ideaList:addChildToSelected');
  }

});

module.exports = NavigationView;
