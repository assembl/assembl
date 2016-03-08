'use strict';

var AllMessagesInIdeaListView = require('./allMessagesInIdeaList.js'),
    OrphanMessagesInIdeaListView = require('./orphanMessagesInIdeaList.js'),
    SynthesisInIdeaListView = require('./synthesisInIdeaList.js'),
    Permissions = require('../utils/permissions.js'),
    ObjectTreeRenderVisitor = require('./visitors/objectTreeRenderVisitor.js'),
    IdeaSiblingChainVisitor = require('./visitors/ideaSiblingChainVisitor'),
    Backbone = require('../shims/backbone.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Idea = require('../models/idea.js'),
    UserCustomData = require('../models/userCustomData.js'),
    IdeaView = require('./ideaInIdeaList.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js'),
    _ = require('../shims/underscore.js'),
    CollectionManager = require('../common/collectionManager.js'),
    i18n = require('../utils/i18n.js'),
    OtherInIdeaListView = require('./otherInIdeaList.js'),
    $ = require('../shims/jquery.js'),
    Promise = require('bluebird'),
    Analytics = require('../internal_modules/analytics/dispatcher.js'),
    DiscussionPreference = require('../models/discussionPreference.js');

var FEATURED = 'featured',
    IN_SYNTHESIS = 'inNextSynthesis';

var IdeaList = AssemblPanel.extend({
  constructor: function IdeaList() {
    AssemblPanel.apply(this, arguments);
  },

  template: '#tmpl-loader',
  panelType: PanelSpecTypes.TABLE_OF_IDEAS,
  className: 'ideaList',
  regions: {
    ideaView: '.ideaView',
    otherView: '.otherView',
    synthesisView: '.synthesisView',
    orphanView: '.orphanView',
    allMessagesView: '.allMessagesView'
  },
  /**
   * .panel-body
   */
  body: null,
  mouseRelativeY: null,
  mouseIsOutside: null,
  scrollableElement: null,
  scrollableElementHeight: null,
  lastScrollTime: null,
  scrollInterval: null,
  scrollLastSpeed: null,
  tableOfIdeasRowHeight: 36, // must match $tableOfIdeasRowHeight in _variables.scss
  tableOfIdeasFontSizeDecreasingWithDepth: true, // must match the presence of .idealist-children { font-size: 98.5%; } in _variables.scss
  
  /**
   * Stores (in UserCustomData per-discussion key/value store) the collapsed state of each idea, as saved by user when he expands or collapses an idea. Model is in the following form: {42: true, 623: false} where each key is the numeric id of an idea 
   * @type {UserCustomData.Model}
   */
  tableOfIdeasCollapsedState: null,

  /**
   * Stores (in DiscussionPreference per-discussion key/value store) the default collapsed state of each idea, as saved by harvesters. Model is in the following form: {42: true, 623: false} where each key is the numeric id of an idea 
   * @type {DiscussionPreference.Model}
   */
  defaultTableOfIdeasCollapsedState: null,

  /**
   * Are we showing the graph or the list?
   * @type {Boolean}
   */
  show_graph: false,
  minWidth: 320,
  gridSize: AssemblPanel.prototype.NAVIGATION_PANEL_GRID_SIZE,

  /**
   * Is this panel the primary navigation panel for it's group?
   * @return true or false
   */
  isPrimaryNavigationPanel: function() {
    //TODO:  This overrides parent class, but will not always be true
    return true;
  },

  initialize: function(options) {
    Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
    var that = this,
        collectionManager = new CollectionManager();

    var requestRender = function() {
      setTimeout(function(){
        if(!that.isViewDestroyed()) {
          //console.log("Render from ideaList requestRender");
          that.render();
        }
      }, 1);
    };

    this.defaultTableOfIdeasCollapsedState = new DiscussionPreference.DictModel({
      id: "default_table_of_ideas_collapsed_state"
    });
    var defaultTableOfIdeasCollapsedStateFetchPromise = this.defaultTableOfIdeasCollapsedState.fetch();

    var groupContent = this.getContainingGroup();
    var tableOfIdeasCollapsedStateKey = groupContent.getGroupStoragePrefix() + "_table_of_ideas_collapsed_state";
    this.tableOfIdeasCollapsedState = new UserCustomData.Model({
      id: tableOfIdeasCollapsedStateKey
    });
    var tableOfIdeasCollapsedStateFetchPromise = Ctx.isUserConnected() ? this.tableOfIdeasCollapsedState.fetch() : Promise.resolve(true);

    // Should we show the table of ideas even when we have not yet received the tableOfIdeasCollapsedStateFetchPromise and then re-render once we have received it ? Or accept to wait potentially a bit more before displaying the table of ideas? => comment/uncomment that.render(); in the following block of code to toggle.
    Promise.join(
      collectionManager.getAllIdeasCollectionPromise(),
      collectionManager.getAllIdeaLinksCollectionPromise(),
      function(allIdeasCollection, allIdeaLinksCollection, collapsedState) {
        if(!that.isViewDestroyed()) {
          var events = ['reset', 'change:parentId', 'change:@id', 'change:hidden', 'remove', 'add', 'destroy'];
          that.listenTo(allIdeasCollection, events.join(' '), requestRender);
          that.allIdeasCollection = allIdeasCollection;

          var events = ['reset', 'change:source', 'change:target', 'change:order', 'remove', 'add', 'destroy'];
          that.listenTo(allIdeaLinksCollection, events.join(' '), requestRender);
          that.allIdeaLinksCollection = allIdeaLinksCollection;

          that.template = '#tmpl-ideaList';
          //that.render();
        }
      }
    );

    Promise.join(
      collectionManager.getAllIdeasCollectionPromise(),
      collectionManager.getAllIdeaLinksCollectionPromise(),
      tableOfIdeasCollapsedStateFetchPromise,
      defaultTableOfIdeasCollapsedStateFetchPromise, // now that we have the collapsed state of each idea, we can (re)render the table of ideas
      function(allIdeasCollection, allIdeaLinksCollection, collapsedState, defaultCollapsedState) {
        if(!that.isViewDestroyed()) {
          that.render();
        }
      }
    );
    
    

    collectionManager.getAllExtractsCollectionPromise()
            .then(function(allExtractsCollection) {
              // Benoitg - 2014-05-05:  There is no need for this, if an idealink
              // is associated with the idea, the idea itself will receive a change event
              // on the socket (unless it causes problem with local additions?)
              //that.listenTo(allExtractsCollection, 'add change reset', that.render);
            }); 

    if(!this.isViewDestroyed()) {
      //Yes, it IS possible the view is already destroyed in initialize, so we check
      this.listenTo(Assembl.vent, 'ideaList:removeIdea', function(idea) {
        that.removeIdea(idea);
      });

      this.listenTo(Assembl.vent, 'ideaList:addChildToSelected', function() {
        that.addChildToSelected();
      });

      this.listenTo(Assembl.vent, 'idea:dragOver', function() {
        that.mouseIsOutside = false;
      });
      this.listenTo(Assembl.vent, 'idea:dragStart', function() {
        that.lastScrollTime = new Date().getTime();
        that.scrollLastSpeed = 0;
        that.scrollableElement = that.$('.panel-body');

        //console.log("that.scrollableElement: ", that.scrollableElement);
        that.scrollableElementHeight = that.$('.panel-body').outerHeight();
        that.scrollInterval = setInterval(function() {
          that.scrollTowardsMouseIfNecessary();
        }, 10);
      });
      this.listenTo(Assembl.vent, 'idea:dragEnd', function() {
        clearInterval(that.scrollInterval);
        that.scrollInterval = null;
      });

      this.listenTo(Assembl.vent, 'DEPRECATEDideaList:selectIdea', function(ideaId, reason, doScroll) {
        collectionManager.getAllIdeasCollectionPromise()
        .done(function(allIdeasCollection) {
          var idea = allIdeasCollection.get(ideaId);
          function success(idea) {
            that.getContainingGroup().setCurrentIdea(idea);
            that.getContainingGroup().NavigationResetDebateState();
            if (doScroll)
              that.onScrollToIdea(idea);
          }
          if (idea) {
            success(idea);
          } else {
            // maybe a tombstone
            idea = new Idea.Model({"@id": ideaId});
            idea.collection = allIdeasCollection;
            idea.fetch({
                success: function(model, response, options) {
                    ideaId = model.get('original_uri');
                    idea = allIdeasCollection.get(ideaId);
                    if (idea) {
                        success(idea);
                    }
                }
            });
          }
        });
      });

      this.listenTo(this, 'scrollToIdea', this.onScrollToIdea);

      this.listenTo(this.getGroupState(), "change:currentIdea", function(state, currentIdea) {
        //console.log("ideaList heard a change:currentIdea event");
        if (currentIdea) {
          that.onScrollToIdea(currentIdea);
        }
      });

      $('html').on('dragover', function(e) {
        that.onDocumentDragOver(e);
      });
    }
  },

  'events': {
    'click .panel-body': 'onPanelBodyClick',

    'click .js_ideaList-addbutton': 'addChildToSelected',
    'click #ideaList-collapseButton': 'toggleIdeas',
    'click #ideaList-closeButton': 'closePanel',

    'click #ideaList-filterByFeatured': 'filterByFeatured',
    'click #ideaList-filterByInNextSynthesis': 'filterByInNextSynthesis',
    'click #ideaList-filterByToc': 'clearFilter',

    'click .js_decreaseRowHeight': 'decreaseRowHeight',
    'click .js_increaseRowHeight': 'increaseRowHeight',
    'click .js_toggleDecreasingFontSizeWithDepth': 'toggleDecreasingFontSizeWithDepth',
    'click .js_saveIdeasStateAsDefault': 'saveIdeasStateAsDefault',
    'click .js_restoreIdeasState': 'restoreIdeasState',
    'click .js_expandAllIdeas': 'expandAllIdeas',
    'click .js_collapseAllIdeas': 'collapseAllIdeas'
  },

  serializeData: function() {
    return {
      canAdd: Ctx.getCurrentUser().can(Permissions.ADD_IDEA)
    }
  },

  getTitle: function() {
    return i18n.gettext('Table of ideas');
  },

  getTableOfIdeasCollapsedState: function(){
    return this.tableOfIdeasCollapsedState;
  },

  getDefaultTableOfIdeasCollapsedState: function(){
    return this.defaultTableOfIdeasCollapsedState;
  },

  onRender: function() {
      if (Ctx.debugRender) {
        console.log("ideaList:render() is firing");
      }

      Ctx.removeCurrentlyDisplayedTooltips(this.$el);
      this.body = this.$('.panel-body');
      var that = this,
          y = 0,
          rootIdea = null,
          rootIdeaDirectChildrenModels = [],
          filter = {},
          view_data = {},
          order_lookup_table = [],
          roots = [],
          collectionManager = new CollectionManager();

      function excludeRoot(idea) {
        return idea != rootIdea && !idea.hidden;
      }

      if (this.body.get(0)) {
        y = this.body.get(0).scrollTop;
      }

      if (this.template != '#tmpl-loader') {
        var analytics = Analytics.getInstance();
        analytics.trackEvent(analytics.events.NAVIGATION_OPEN_DEBATE_SECTION);
        if (!this.allIdeasCollection || !this.allIdeaLinksCollection) {
          throw new Error("loader has been cleared, but ideas aren't available yet");
        }

        if (this.filter === FEATURED) {
          filter.featured = true;
        }
        else if (this.filter === IN_SYNTHESIS) {
          filter.inNextSynthesis = true;
        }

        var list = document.createDocumentFragment();

        rootIdea = this.allIdeasCollection.getRootIdea();
        if (Object.keys(filter).length > 0) {
          rootIdeaDirectChildrenModels = this.allIdeasCollection.where(filter);
        }
        else {
          rootIdeaDirectChildrenModels = this.allIdeasCollection.models;
        }

        rootIdeaDirectChildrenModels = rootIdeaDirectChildrenModels.filter(function(idea) {
          return (idea.get("parentId") == rootIdea.id) || (idea.get("parentId") == null && idea.id != rootIdea.id);
        }

        );

        rootIdeaDirectChildrenModels = _.sortBy(rootIdeaDirectChildrenModels, function(idea) {
          return idea.get('order');
        });



        this.allIdeasCollection.visitDepthFirst(this.allIdeaLinksCollection, new ObjectTreeRenderVisitor(view_data, order_lookup_table, roots, excludeRoot), rootIdea.getId());
        this.allIdeasCollection.visitDepthFirst(this.allIdeaLinksCollection, new IdeaSiblingChainVisitor(view_data), rootIdea.getId());

        this.addLabelToMostRecentIdeas(this.allIdeasCollection, view_data);




        //console.log("About to set ideas on ideaList",that.cid, "with panelWrapper",that.getPanelWrapper().cid, "with group",that.getContainingGroup().cid);
        _.each(roots, function(idea) {
          var ideaView = new IdeaView({
            model: idea,
            parentPanel: that,
            groupContent: that.getContainingGroup(),
            parentView: that
          }, view_data);
          list.appendChild(ideaView.render().el);
        });
        that.$('.ideaView').html(list);

        //sub menu other
        var OtherView = new OtherInIdeaListView({
          model: rootIdea,
          parentPanel: that,
          groupContent: that.getContainingGroup()
        });
        that.getRegion('otherView').show(OtherView);

        // Synthesis posts pseudo-idea
        var synthesisView = new SynthesisInIdeaListView({
          model: rootIdea,
          parentPanel: that,
          groupContent: that.getContainingGroup()
        });
        that.getRegion('synthesisView').show(synthesisView);

        // Orphan messages pseudo-idea
        var orphanView = new OrphanMessagesInIdeaListView({
          model: rootIdea,
          parentPanel: that,
          groupContent: that.getContainingGroup()
        });
        that.getRegion('orphanView').show(orphanView);

        // All posts pseudo-idea
        var allMessagesInIdeaListView = new AllMessagesInIdeaListView({
          model: rootIdea,
          parentPanel: that,
          groupContent: that.getContainingGroup()
        });
        that.getRegion('allMessagesView').show(allMessagesInIdeaListView);

        Ctx.initTooltips(that.$el);

        that.body = that.$('.panel-body');
        that.body.get(0).scrollTop = y;
        Assembl.vent.trigger("requestTour", "idea_list");
      }
    },

  /**
   * Add a "new" label to most recent ideas
   * @param ideas: collection of ideas. For example: this.allIdeasCollection
   * @param view_data: object which will be modified during the traversal
   */
  addLabelToMostRecentIdeas: function(ideas, view_data){
    var maximum_ratio_of_highlighted_ideas = 1.0; // this is a float and should be in [0;1]. was 0.2
    var should_be_newer_than = null;

    // Rule: Show new labels on ideas created after 3 days before user's last visit, or created after 4 days ago if user's last visit was after yesterday
    if ( Ctx.isUserConnected() ){
      var last_visit = Ctx.getCurrentUser().get('last_visit');
      if ( last_visit ){
        last_visit = new Date(last_visit);
        if ( last_visit ){
          var yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1); // sets to x days before
          if ( last_visit < yesterday ){
            should_be_newer_than = last_visit;
            should_be_newer_than.setDate(should_be_newer_than.getDate() - 3); // sets to x days before
          } else { // TODO: look for the antepenultimate visit, but we don't store it yet
            should_be_newer_than = yesterday;
            should_be_newer_than.setDate(should_be_newer_than.getDate() - 3); // sets to x days before
          }
        }
      }
    }

    // Rule: Never consider as new an idea which has been created before user's first visit (so this also applies to not logged-in visitors)
    var first_visit = Ctx.getCurrentUser().get('first_visit');
    if ( first_visit ){
        first_visit = new Date(first_visit);
        if ( first_visit ){
            if ( !should_be_newer_than || should_be_newer_than < first_visit ){
                should_be_newer_than = first_visit;
            }
        }
    }
    if ( !should_be_newer_than ){
      return;
      /* We used to show new labels on ideas less than 1 month old to not logged-in users and to logged-in users who are on their first visit. Now we don't show any new label to not logged-in users, and first visit logged-in users are now handled by previous code block.
      should_be_newer_than = new Date();
      should_be_newer_than.setMonth(should_be_newer_than.getMonth() - 1); // sets to x months before
      */
    }
    

    //console.log("should_be_newer_than: ", should_be_newer_than);

    var idea_criterion_value = function(idea){
      return new Date(idea.get('creationDate'));
    };
    var creation_dates = ideas.map(idea_criterion_value); // create a list of idea creation dates
    var date_sort_asc = function (date1, date2) {
      if (date1 > date2) return 1;
      if (date1 < date2) return -1;
      return 0;
    };
    creation_dates.sort(date_sort_asc);

    // console.log("creation_dates: ", creation_dates);
    var sz = creation_dates.length;
    // console.log("sz: ", sz);
    var index = null;
    var highlight_if_newer_than = null;
    if ( sz > 2 ){
      index = Math.floor((sz-1)*(1-maximum_ratio_of_highlighted_ideas));
      // console.log("index1: ", index);
      do {
        if ( creation_dates[index] >= should_be_newer_than ){
          break;
        }
        ++index;
      } while(index < sz);
      // console.log("index2: ", index);
      if ( index < sz ){
        // TODO: go backwards to find ideas which have been created during the same short period of time (day?) as this one, but then check we are still validating maximum_ratio_of_highlighted_ideas, otherwise just keep this one (or go forward until an idea is not in this same short period of time anymore)

        //view_data["highlight_if_newer_than"] = creation_dates[index];
        highlight_if_newer_than = creation_dates[index];
        console.log("we are going to highlight ideas which have been created after: ", highlight_if_newer_than);
      }
    }
    ideas.each(function(idea){
      var crierion_value = idea_criterion_value(idea);
      if ( highlight_if_newer_than && crierion_value && crierion_value >= highlight_if_newer_than ){
        var idea_id = idea.getId();
        //console.log("we are going to highlight idea: ", idea_id, idea.get("shortTitle"));
        if ( !(idea_id in view_data) ){
          view_data[idea_id] = {};
        }
        view_data[idea_id]["showLabel"] = "new";
      }
    });
    // console.log("view_data: ", view_data);
  },

  onScrollToIdea: function(ideaModel, retry) {
    if (Ctx.debugRender) {
      console.log("ideaList::onScrollToIdea()");
    }
    var that = this;
    if (ideaModel) {
      if (ideaModel.id) {
        var el = this.$el.find("." + ideaModel.getCssClassFromId());
        if (el.length)
        {
          Ctx.scrollToElement(el.first(), that.body, null, 10, true);
        } else {
          console.log("el not found, will retry later");
          if (retry == undefined)
            retry = 0;
          if (++retry < 5)
                    setTimeout(function() {
                      that.onScrollToIdea(ideaModel, retry);
                    }, 200);
        }

      } else {
        // idea has no id yet, so we will wait until it has one to then be able to compare its model to ours
        console.log("idea has no id yet, so we will wait until it has one to then be able to compare its model to ours");
        that.listenToOnce(ideaModel, "acquiredId", function() {
          that.onScrollToIdea(ideaModel);
        });
      }
    }
  },

  /**
   * Remove the given idea
   * @param  {Idea} idea
   */
  removeIdea: function(idea) {
    var parent = idea.get('parent');

    if (parent) {
      parent.get('children').remove(idea);
    } else {
      console.error(" This shouldn't happen, only th root idea has no parent");
    }
  },

  /**
   * Collapse ALL ideas
   */
  collapseIdeas: function() {
    var collectionManager = new CollectionManager();
    var that = this;
    this.collapsed = true;
    collectionManager.getAllIdeasCollectionPromise()
            .done(function(allIdeasCollection) {
              allIdeasCollection.each(function(idea) {
                idea.attributes.isOpen = false;
              });
              that.render();
            });
  },

  /**
   * Expand ALL ideas
   */
  expandIdeas: function() {
    this.collapsed = false;
    var that = this;
    collectionManager.getAllIdeasCollectionPromise()
            .done(function(allIdeasCollection) {
              allIdeasCollection.each(function(idea) {
                idea.attributes.isOpen = true;
              });
              that.render();
            });
  },

  /**
   * Filter the current idea list by featured
   */
  filterByFeatured: function() {
    this.filter = FEATURED;
    this.render();
  },

  /**
   * Filter the current idea list by inNextSynthesis
   */
  filterByInNextSynthesis: function() {
    this.filter = IN_SYNTHESIS;
    this.render();
  },

  /**
   * Clear the filter applied to the idea list
   */
  clearFilter: function() {
    this.filter = '';
    this.render();
  },

  /**
   * @event
   */
  onPanelBodyClick: function(ev) {
    if ($(ev.target).hasClass('panel-body')) {
      // We want to avoid the "All messages" state,
      // unless the user clicks explicitly on "All messages".
      // TODO benoitg: Review this decision.
      //this.getContainingGroup().setCurrentIdea(null);
    }
  },

  /**
   * Add a new child to the current selected.
   * If no idea is selected, add it at the root level ( no parent )
   */
  addChildToSelected: function() {
    var currentIdea = this.getGroupState().get('currentIdea'),
        newIdea = new Idea.Model(),
        that = this,
        collectionManager = new CollectionManager();

    collectionManager.getAllIdeasCollectionPromise()
            .then(function(allIdeasCollection) {
              var order;
              if (allIdeasCollection.get(currentIdea)) {
                order = currentIdea.getOrderForNewChild();
                newIdea.set('order', order);
                currentIdea.addChild(newIdea);
              } else {
                order = allIdeasCollection.getOrderForNewRootIdea();
                newIdea.set('order', order);
                allIdeasCollection.add(newIdea);

                newIdea.save(null, {
                  success: function(model, resp) {
                        },
                  error: function(model, resp) {
                    console.error('ERROR: addChildToSelected', resp);
                  }
                });
              }

              that.getContainingGroup().setCurrentIdea(newIdea, "created", true);
            });
  },

  /**
   * Collapse or expand the ideas
   */
  toggleIdeas: function() {
    if (this.collapsed) {
      this.expandIdeas();
    } else {
      this.collapseIdeas();
    }
  },

  /**
   * Closes the panel
   */
  closePanel: function() {
    if (this.button) {
      this.button.trigger('click');
    }
  },

  onDocumentDragOver: function(e) {
    //console.log("onDocumentDragOver");
    if (!Ctx.draggedIdea || !this.scrollableElement)
        return;
    this.mouseRelativeY = e.originalEvent.pageY - this.scrollableElement.offset().top;

    //console.log("this.mouseRelativeY: ", this.mouseRelativeY);
    //console.log("scrollableElementHeight: ", this.scrollableElementHeight);

    // the detection of mouseIsOutside is needed to be done by document also, because when the user is dragging, the mouseleave event is not fired (as the mouse is still on a child)
    if (this.mouseRelativeY >= 0 && this.mouseRelativeY <= this.scrollableElementHeight) { // cursor is not outside the block
      this.mouseIsOutside = false;
    }else {
      this.mouseIsOutside = true;

      //console.log("isOutside: ", this.mouseIsOutside);
    }
  },

  scrollTowardsMouseIfNecessary: function() {
    //console.log("scrollTowardsMouseIfNecessary");
    if (!Ctx.draggedIdea || !this.scrollableElement)
        return;
    if (!this.mouseIsOutside)
    {
      this.scrollLastSpeed = 0;
      return;
    }

    //console.log("scrollTowardsMouseIfNecessary has enough info");
    var scrollDirectionIsDown = (this.mouseRelativeY > this.scrollableElementHeight);

    //console.log("scrollDirectionIsDown: ", scrollDirectionIsDown);

    var d, deltaTime;
    d = deltaTime = new Date().getTime();
    if (this.lastScrollTime)
        deltaTime -= this.lastScrollTime;
    else
        deltaTime = 10;
    this.lastScrollTime = d;

    var mYn = this.mouseRelativeY;
    if (scrollDirectionIsDown)
      mYn -= this.scrollableElementHeight;
    var speed = Math.max(0.2, Math.min(40.0, Math.abs(mYn) * 1.0)) * 0.01;

    //console.log("speed: ", speed);
    if (!scrollDirectionIsDown)
      speed = -speed;
    if ((speed > 0 && this.scrollLastSpeed >= 0) || (speed < 0 && this.scrollLastSpeed <= 0))
        speed = this.scrollLastSpeed * 0.8 + speed * 0.2;
    this.scrollLastSpeed = speed;
    this.scrollableElement.scrollTop(this.scrollableElement.scrollTop() + (speed * deltaTime));
  },

  increaseRowHeight: function() {
    this.tableOfIdeasRowHeight += 2;
    this.tableOfIdeasRowHeight = Math.min (40, Math.max(12, this.tableOfIdeasRowHeight));
    this.updateUserCustomStylesheet();
  },

  decreaseRowHeight: function() {
    this.tableOfIdeasRowHeight -= 2;
    this.tableOfIdeasRowHeight = Math.min (40, Math.max(12, this.tableOfIdeasRowHeight));
    this.updateUserCustomStylesheet();
  },

  toggleDecreasingFontSizeWithDepth: function() {
    this.tableOfIdeasFontSizeDecreasingWithDepth = !this.tableOfIdeasFontSizeDecreasingWithDepth;
    this.updateUserCustomStylesheet();
  },

  updateUserCustomStylesheet: function() {
    var sheetId = 'userCustomStylesheet';
    var rowHeight = this.tableOfIdeasRowHeight + 'px';
    var rowHeightSmaller = (this.tableOfIdeasRowHeight - 2) + 'px';

    console.log("current tableOfIdeasRowHeight: ", this.tableOfIdeasRowHeight);

    // remove sheet if it exists
    var sheetToBeRemoved = document.getElementById(sheetId);
    if (sheetToBeRemoved)
    {
      var sheetParent = sheetToBeRemoved.parentNode;
      sheetParent.removeChild(sheetToBeRemoved);
    }

    // create sheet
    var sheet = document.createElement('style');
    sheet.id = sheetId;
    var str = ".idealist-item { line-height: " + rowHeight + "; }";
    str += ".idealist-title { line-height: " + rowHeightSmaller + "; }";
    str += ".idealist-title { line-height: " + rowHeightSmaller + "; }";
    str += ".idealist-arrow, .idealist-noarrow, .idealist-space, .idealist-bar, .idealist-link, .idealist-link-last { height: " + rowHeight + "; }";
    str += "#idealist-list .custom-checkbox { height: " + rowHeight + "; line-height: " + rowHeightSmaller + "; }";

    if (this.tableOfIdeasFontSizeDecreasingWithDepth)
        str += ".idealist-children { font-size: 98.5%; }";
    else
        str += ".idealist-children { font-size: 100%; }";

    sheet.innerHTML = str;
    document.body.appendChild(sheet);
  },

  // called by ideaInIdeaList::saveCollapsedState()
  saveIdeaCollapsedState: function(ideaModel, isCollapsed){
    if ( !Ctx.isUserConnected() || !this.tableOfIdeasCollapsedState ){
      return;
    }
    var idea_numeric_id = ideaModel.getNumericId();
    var value = (isCollapsed === true || isCollapsed == "true") ? "true" : "false";
    var o = {};
    o[idea_numeric_id] = value;
    this.tableOfIdeasCollapsedState.save(o, {patch: true});
  },

  saveIdeasStateAsDefault: function(){
    // check first on the front-end that the user has the permission to do this (in order to avoid future failure during API calls)
    if ( !Ctx.isUserConnected() || !Ctx.getCurrentUser().can(Permissions.ADD_IDEA) || !this.defaultTableOfIdeasCollapsedState ){
      alert(i18n.gettext('You don\'t have the permission to do this.'));
      return;
    }

    // /!\ This algorithm clones the user custom state into the default state.
    // But the user custom state does not define a state on untouched ideas (which are considered open by default).
    // So if one day we change the default state to collapsed, a side effect will be that users will see a different state than the ones which were saved (default and user).
    var attributes = _.clone(this.tableOfIdeasCollapsedState.attributes);
    delete attributes['id'];
    this.defaultTableOfIdeasCollapsedState.set(attributes);
    this.defaultTableOfIdeasCollapsedState.save(
      null,
      {
        success: function(model, resp) {
          // maybe we could display a small success
        },
        error: function(model, resp) {
          // I don't know why, but Backbone considers it's an error if the server does not reply by a 200 code, even if it's a 201.
          if ( "status" in resp && resp.status == 201 ){
            console.log("this is OK");
            resp.handled = true; // In order to avoid displaying the Assembl error pop-in
          }
        }
      }
    );
  },

  restoreIdeasState: function(){
    var id = this.tableOfIdeasCollapsedState.get('id');
    this.tableOfIdeasCollapsedState.clear();
    this.tableOfIdeasCollapsedState.set('id', id);
    if ( Ctx.isUserConnected() ){
      this.tableOfIdeasCollapsedState.save(null, {
        success: function(model, resp) {},
        error: function(model, resp) {
          console.error('ERROR: could not save ideaList::tableOfIdeasCollapsedState', resp);
        }
      });
    }
    this.render();
    // FIXME: for now, event does not seem to be triggered when I make changes, so I have to call explicitly a render() of the table of ideas 
  },

  expandAllIdeas: function(){
    this.expandOrCollapseAllIdeas(false);
  },

  collapseAllIdeas: function(){
    this.expandOrCollapseAllIdeas(true);
  },

  /**
   * @param collapse: bool. set to true if you want to collapse all ideas, false otherwise
   */
  expandOrCollapseAllIdeas: function(collapse){
    var that = this;
    new CollectionManager().getAllIdeasCollectionPromise().done(function(ideas){
      ideas.each(function(idea) {
        var id = idea.getNumericId();
        if ( id ){
          that.tableOfIdeasCollapsedState.set(id, collapse);
        }
      });
      that.render();
    });
  }

});

module.exports = IdeaList;
