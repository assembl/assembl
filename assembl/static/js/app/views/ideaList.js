'use strict';

var AllMessagesInIdeaListView = require('./allMessagesInIdeaList.js'),
    OrphanMessagesInIdeaListView = require('./orphanMessagesInIdeaList.js'),
    SynthesisInIdeaListView = require('./synthesisInIdeaList.js'),
    Permissions = require('../utils/permissions.js'),
    objectTreeRenderVisitor = require('./visitors/objectTreeRenderVisitor.js'),
    ideaSiblingChainVisitor = require('./visitors/ideaSiblingChainVisitor'),
    Backbone = require('../shims/backbone.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Idea = require('../models/idea.js'),
    IdeaView = require('./idea.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js'),
    _ = require('../shims/underscore.js'),
    CollectionManager = require('../common/collectionManager.js'),
    i18n = require('../utils/i18n.js'),
    OtherInIdeaListView = require('./otherInIdeaList.js'),
    $ = require('../shims/jquery.js'),
    Promise = require('bluebird');


var FEATURED = 'featured',
    IN_SYNTHESIS = 'inNextSynthesis';


var IdeaList = AssemblPanel.extend({
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
     * Are we showing the graph or the list?
     * @type {Boolean}
     */
    show_graph: false,
    minWidth: 320,
    gridSize: AssemblPanel.prototype.NAVIGATION_PANEL_GRID_SIZE,

    initialize: function (options) {
        Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
        var that = this,
            collectionManager = new CollectionManager();

        Promise.join(collectionManager.getAllIdeasCollectionPromise(),
            collectionManager.getAllIdeaLinksCollectionPromise(),
            function (allIdeasCollection, allIdeaLinksCollection) {
                var events = ['reset', 'change:parentId', 'change:@id', 'remove', 'add', 'destroy'];
                that.listenTo(allIdeasCollection, events.join(' '), that.render);
                that.allIdeasCollection = allIdeasCollection;

                var events = ['reset', 'change:source', 'change:target', 'change:order', 'remove', 'add', 'destroy'];
                that.listenTo(allIdeaLinksCollection, events.join(' '), that.render);
                that.allIdeaLinksCollection = allIdeaLinksCollection;

                that.template = '#tmpl-ideaList';
                that.render();
            });

        collectionManager.getAllExtractsCollectionPromise()
            .then(function (allExtractsCollection) {
                // Benoitg - 2014-05-05:  There is no need for this, if an idealink
                // is associated with the idea, the idea itself will receive a change event
                // on the socket (unless it causes problem with local additions?)
                //that.listenTo(allExtractsCollection, 'add change reset', that.render);
            }); 

        this.listenTo(Assembl.vent, 'ideaList:removeIdea', function (idea) {
            that.removeIdea(idea);
        });

        this.listenTo(Assembl.vent, 'ideaList:addChildToSelected', function () {
            that.addChildToSelected();
        });

        this.listenTo(Assembl.vent, 'idea:dragOver', function () {
            that.mouseIsOutside = false;
        });
        this.listenTo(Assembl.vent, 'idea:dragStart', function () {
            that.lastScrollTime = new Date().getTime();
            that.scrollLastSpeed = 0;
            that.scrollableElement = that.$('.panel-body');
            //console.log("that.scrollableElement: ", that.scrollableElement);
            that.scrollableElementHeight = that.$('.panel-body').outerHeight();
            that.scrollInterval = setInterval(function(){
                that.scrollTowardsMouseIfNecessary();
            }, 10);
        });
        this.listenTo(Assembl.vent, 'idea:dragEnd', function () {
            clearInterval(that.scrollInterval);
            that.scrollInterval = null;
        });

        this.listenTo(Assembl.vent, 'DEPRECATEDideaList:selectIdea', function (ideaId, reason, doScroll) {
            collectionManager.getAllIdeasCollectionPromise()
                .done(function (allIdeasCollection) {
                var idea = allIdeasCollection.get(ideaId);
                if (idea) {
                    that.getContainingGroup().setCurrentIdea(idea);
                    that.getContainingGroup().resetDebateState();
                    if ( doScroll )
                      that.onScrollToIdea(idea);
                }
            });
        });

        this.listenTo(this, 'scrollToIdea', this.onScrollToIdea);

        this.listenTo(this.getGroupState(), "change:currentIdea", function (state, currentIdea) {
          //console.log("ideaList heard a change:currentIdea event");
          if (currentIdea) {
              that.onScrollToIdea(currentIdea);
          }
        });

        $('html').on('dragover', function(e){
            that.onDocumentDragOver(e);
        });
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
        'click .js_toggleDecreasingFontSizeWithDepth': 'toggleDecreasingFontSizeWithDepth'
    },

    serializeData: function () {
        return {
            canAdd: Ctx.getCurrentUser().can(Permissions.ADD_IDEA)
        }
    },

    getTitle: function () {
        return i18n.gettext('Table of ideas');
    },

    onRender: function () {
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

        rootIdeaDirectChildrenModels = rootIdeaDirectChildrenModels.filter(function (idea) {
          return (idea.get("parentId") == rootIdea.id) || (idea.get("parentId") == null && idea.id != rootIdea.id);
        }
        );

        rootIdeaDirectChildrenModels = _.sortBy(rootIdeaDirectChildrenModels, function (idea) {
          return idea.get('order');
        });

        this.allIdeasCollection.visitDepthFirst(this.allIdeaLinksCollection, objectTreeRenderVisitor(view_data, order_lookup_table, roots, excludeRoot), rootIdea.getId());
        this.allIdeasCollection.visitDepthFirst(this.allIdeaLinksCollection, ideaSiblingChainVisitor(view_data), rootIdea.getId());
        //console.log("About to set ideas on ideaList",that.cid, "with panelWrapper",that.getPanelWrapper().cid, "with group",that.getContainingGroup().cid);
        _.each(roots, function (idea) {
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
        that.otherView.show(OtherView);

        // Synthesis posts pseudo-idea
        var synthesisView = new SynthesisInIdeaListView({
          model: rootIdea,
          parentPanel: that,
          groupContent: that.getContainingGroup()
        });
        that.synthesisView.show(synthesisView);

        // Orphan messages pseudo-idea
        var orphanView = new OrphanMessagesInIdeaListView({
          model: rootIdea,
          parentPanel: that,
          groupContent: that.getContainingGroup()
        });
        that.orphanView.show(orphanView);

        // All posts pseudo-idea
        var allMessagesInIdeaListView = new AllMessagesInIdeaListView({
          model: rootIdea,
          parentPanel: that,
          groupContent: that.getContainingGroup()
        });
        that.allMessagesView.show(allMessagesInIdeaListView);

        Ctx.initTooltips(that.$el);

        that.body = that.$('.panel-body');
        that.body.get(0).scrollTop = y;
      }
    },

    onScrollToIdea: function(ideaModel, retry) {
        //console.log("ideaList::onScrollToIdea()");
        var that = this;
        if ( ideaModel ){
            if ( ideaModel.id ){
                var el = this.$el.find("."+ideaModel.getCssClassFromId());
                if ( el.length )
                {
                    Ctx.scrollToElement(el.first(), that.body, null, 10, true);
                } else {
                    console.log("el not found, will retry later");
                    if ( retry == undefined )
                      retry = 0;
                    if ( ++retry < 5 )
                    setTimeout(function(){
                        that.onScrollToIdea(ideaModel, retry);
                    }, 200);
                }

            } else {
                // idea has no id yet, so we will wait until it has one to then be able to compare its model to ours
                console.log("idea has no id yet, so we will wait until it has one to then be able to compare its model to ours");
                that.listenToOnce(ideaModel, "acquiredId", function () {
                    that.onScrollToIdea(ideaModel);
                });
            }
        }
    },

    /**
     * Remove the given idea
     * @param  {Idea} idea
     */
    removeIdea: function (idea) {
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
    collapseIdeas: function () {
        var collectionManager = new CollectionManager();
        var that = this;
        this.collapsed = true;
        collectionManager.getAllIdeasCollectionPromise()
            .done(function (allIdeasCollection) {
                allIdeasCollection.each(function (idea) {
                    idea.attributes.isOpen = false;
                });
                that.render();
            });
    },

    /**
     * Expand ALL ideas
     */
    expandIdeas: function () {
        this.collapsed = false;
        var that = this;
        collectionManager.getAllIdeasCollectionPromise()
            .done(function (allIdeasCollection) {
                allIdeasCollection.each(function (idea) {
                    idea.attributes.isOpen = true;
                });
                that.render();
            });
    },

    /**
     * Filter the current idea list by featured
     */
    filterByFeatured: function () {
        this.filter = FEATURED;
        this.render();
    },

    /**
     * Filter the current idea list by inNextSynthesis
     */
    filterByInNextSynthesis: function () {
        this.filter = IN_SYNTHESIS;
        this.render();
    },

    /**
     * Clear the filter applied to the idea list
     */
    clearFilter: function () {
        this.filter = '';
        this.render();
    },

    /**
     * @event
     */
    onPanelBodyClick: function (ev) {
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
    addChildToSelected: function () {
        var currentIdea = this.getGroupState().get('currentIdea'),
            newIdea = new Idea.Model(),
            that = this,
            collectionManager = new CollectionManager();

        collectionManager.getAllIdeasCollectionPromise()
            .then(function (allIdeasCollection) {
                if (allIdeasCollection.get(currentIdea)) {
                    newIdea.set('order', currentIdea.getOrderForNewChild());
                    currentIdea.addChild(newIdea);
                } else {
                    newIdea.set('order', allIdeasCollection.getOrderForNewRootIdea());
                    allIdeasCollection.add(newIdea);

                    newIdea.save(null, {
                        success: function (model, resp) {
                        },
                        error: function (model, resp) {
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
    toggleIdeas: function () {
        if (this.collapsed) {
            this.expandIdeas();
        } else {
            this.collapseIdeas();
        }
    },

    /**
     * Closes the panel
     */
    closePanel: function () {
        if (this.button) {
            this.button.trigger('click');
        }
    },

    onDocumentDragOver: function (e) {
        //console.log("onDocumentDragOver");
        if ( !Ctx.draggedIdea || !this.scrollableElement )
            return;
        this.mouseRelativeY = e.originalEvent.pageY - this.scrollableElement.offset().top;
        //console.log("this.mouseRelativeY: ", this.mouseRelativeY);
        //console.log("scrollableElementHeight: ", this.scrollableElementHeight);

        // the detection of mouseIsOutside is needed to be done by document also, because when the user is dragging, the mouseleave event is not fired (as the mouse is still on a child)
        if ( this.mouseRelativeY >= 0 && this.mouseRelativeY <= this.scrollableElementHeight ) { // cursor is not outside the block
            this.mouseIsOutside = false;
        }else{
            this.mouseIsOutside = true;
            //console.log("isOutside: ", this.mouseIsOutside);
        }
    },

    scrollTowardsMouseIfNecessary: function() {
        //console.log("scrollTowardsMouseIfNecessary");
        if ( !Ctx.draggedIdea || !this.scrollableElement )
            return;
        if ( !this.mouseIsOutside )
        {
            this.scrollLastSpeed = 0;
            return;
        }
        //console.log("scrollTowardsMouseIfNecessary has enough info");
        var scrollDirectionIsDown = (this.mouseRelativeY > this.scrollableElementHeight);
        //console.log("scrollDirectionIsDown: ", scrollDirectionIsDown);

        var d, deltaTime;
        d = deltaTime = new Date().getTime();
        if ( this.lastScrollTime )
            deltaTime -= this.lastScrollTime;
        else
            deltaTime = 10;
        this.lastScrollTime = d;

        var mYn = this.mouseRelativeY;
        if ( scrollDirectionIsDown )
          mYn -= this.scrollableElementHeight;
        var speed = Math.max(0.2, Math.min(40.0, Math.abs(mYn)*1.0)) * 0.01;
        //console.log("speed: ", speed);
        if ( !scrollDirectionIsDown )
          speed = -speed;
        if ( (speed > 0 && this.scrollLastSpeed >= 0) || (speed < 0 && this.scrollLastSpeed <= 0) )
            speed = this.scrollLastSpeed * 0.8 + speed * 0.2;
        this.scrollLastSpeed = speed;
        this.scrollableElement.scrollTop(this.scrollableElement.scrollTop()+(speed*deltaTime));
    },

    increaseRowHeight: function() {
        this.tableOfIdeasRowHeight += 2;
        this.tableOfIdeasRowHeight = Math.min ( 40, Math.max(12, this.tableOfIdeasRowHeight) );
        this.updateUserCustomStylesheet();
    },

    decreaseRowHeight: function() {
        this.tableOfIdeasRowHeight -= 2;
        this.tableOfIdeasRowHeight = Math.min ( 40, Math.max(12, this.tableOfIdeasRowHeight) );
        this.updateUserCustomStylesheet();
    },

    toggleDecreasingFontSizeWithDepth: function(){
        this.tableOfIdeasFontSizeDecreasingWithDepth = !this.tableOfIdeasFontSizeDecreasingWithDepth;
        this.updateUserCustomStylesheet();
    },

    updateUserCustomStylesheet: function() {
        var sheetId = 'userCustomStylesheet';
        var rowHeight = this.tableOfIdeasRowHeight + 'px';
        var rowHeightSmaller = (this.tableOfIdeasRowHeight -2) + 'px';

        console.log("current tableOfIdeasRowHeight: ", this.tableOfIdeasRowHeight);

        // remove sheet if it exists
        var sheetToBeRemoved = document.getElementById(sheetId);
        if ( sheetToBeRemoved )
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

        if ( this.tableOfIdeasFontSizeDecreasingWithDepth )
            str += ".idealist-children { font-size: 98.5%; }";
        else
            str += ".idealist-children { font-size: 100%; }";

        sheet.innerHTML = str;
        document.body.appendChild(sheet);
    }

});


module.exports = IdeaList;
