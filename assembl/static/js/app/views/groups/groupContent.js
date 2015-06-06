'use strict';

var Marionette = require('../../shims/marionette.js'),
    ctx = require('../../common/context.js'),
    i18n = require('../../utils/i18n.js'),
    panelSpec = require('../../models/panelSpec.js'),
    AssemblPanel = require('../assemblPanel.js'),
    PanelWrapper = require('./panelWrapper.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js'),
    helperDebate = require('../helperDebate.js');


/** Represents the entire content of a single group */
var groupContent = Marionette.CompositeView.extend({
    template: "#tmpl-groupContent",
    className: "groupContent",
    childViewContainer: ".groupBody",
    childView: PanelWrapper,
    panel_borders_size: 1,

    initialize: function (options) {
        var that = this;
        this.collection = this.model.get('panels');
        this.groupContainer = options['groupContainer'];
        setTimeout(function () {
            var navView = that.findViewByType(PanelSpecTypes.NAV_SIDEBAR);
            if (navView) {
                //navView.loadView(that.model.get('navigationState'));
                navView.toggleMenuByName(that.model.get('navigationState'));
            }
        }, 200);
    },
    events: {
        'click .js_closeGroup': 'closeGroup'
    },
    collectionEvents: {
        'add remove reset change': 'adjustGridSize'
    },

    serializeData: function () {
        return {
            "Ctx": ctx
        };
    },

    /**
     * Set the given Idea as the current one to be edited
     * @param  {Idea} [idea]
     */
    setCurrentIdea: function (idea, reason, doScroll) {
      console.log("setCurrentIdea() fired", idea, reason, doScroll);
      //console.log(this.model);

      if (idea !== this._getCurrentIdea()) {
        console.log("About to set current idea on group:", this.cid);
        this.model.get('states').at(0).set({currentIdea: idea}, {validate: true});
      }
    },

    /**
     * @return: undefined if no idea was set yet.
     * null if it was explicitely set to no idea.
     *
     */
    _getCurrentIdea: function () {
      //console.log("_getCurrentIdea() fired, returning", this.model.get('states').at(0).get('currentIdea'));
      return this.model.get('states').at(0).get('currentIdea');
    },

    closeGroup: function () {
        this.model.collection.remove(this.model);
        this.groupContainer.resizeAllPanels();
    },

    calculateGridSize: function () {
        var gridSize = 0;
        this.children.each(function (panelWrapper) {
            if (panelWrapper.model.get('hidden'))
                return 0;
            if (panelWrapper.model.get('minimized'))
                return 0;
            gridSize += panelWrapper.gridSize;
        });
        return gridSize;
    },

    calculateMinWidth: function () {
        var minWidth = 0;
        this.children.each(function (panelWrapper) {
            if (panelWrapper.model.get('hidden'))
                return;
            if (panelWrapper.model.get('minimized'))
                minWidth += AssemblPanel.prototype.minimized_size;
            else
                minWidth += panelWrapper.minWidth;
        });
        return minWidth;
    },

    getExtraPixels: function (include_embedded_idea_panel) {
        var extraPixels = 0, that = this;
        this.children.each(function (panelWrapper) {
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
        return extraPixels;
    },

    useCurrentSize: function () {
        this.$el.stop();
        this.children.each(function (panelWrapper) {
            if (panelWrapper.model.get('hidden'))
                return;
            panelWrapper.useCurrentSize();
        });
        var width = this.$el[0].style.width;
        if (width == "" || width.indexOf('%') >= 0) {
            this.$el.width(this.$el.width());
        }
        this.$el.addClass("animating");
    },

    animateTowardsPixels: function (pixels_per_unit, percent_per_unit, extra_pixels, num_units, skip_animation) {
        var that = this,
            group_extra_pixels = this.getExtraPixels(false),
            group_units = this.calculateGridSize(),
            myCorrection = group_extra_pixels - (extra_pixels * group_units / num_units),
            width = (100 * group_units / num_units) + "%",
            target = window.innerWidth * group_units / num_units,
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

        var onAnimationComplete = function () {
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

        this.children.each(function (panelWrapper) {
            if (panelWrapper.model.get('hidden'))
                return;
            panelWrapper.animateTowardsPixels(pixels_per_unit, percent_per_unit, group_extra_pixels, num_units, group_units, skipAnimation);
        });
    },

    adjustGridSize: function () {
        this.groupContainer.adjustGridSize();
    },
    /**
     * Tell the panelWrapper which view to put in its contents
     */
    childViewOptions: function (child, index) {
        return {
            groupContent: this,
            contentSpec: child
        }
    },

    findNavigationSidebarPanelSpec: function () {
        return this.model.findNavigationSidebarPanelSpec();
    },

    resetDebateState: function (skip_animation, show_debate_help) {
        // Ensure that the simple view is in debate state, and coherent.
        if (this.findNavigationSidebarPanelSpec()) {
            this.groupContainer.suspendResize();
            this.model.set('navigationState', 'debate');

            if ( show_debate_help ){

                this.removePanels(PanelSpecTypes.DISCUSSION_CONTEXT, PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
                this.resetMessagePanelState();

                var helper = new helperDebate();

                var conversationPanel = this.findViewByType(PanelSpecTypes.MESSAGE_LIST);
                conversationPanel.showAlternativeContent(helper.render().el);
            }
            else {
                this.removePanels(PanelSpecTypes.DISCUSSION_CONTEXT, PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
                this.resetMessagePanelState();

                var conversationPanel = this.findViewByType(PanelSpecTypes.MESSAGE_LIST);
                conversationPanel.hideAlternativeContent();
            }

            if (skip_animation === false) {
                this.groupContainer.resumeResize(false);
            }
            else {
                this.groupContainer.resumeResize(true);
            }

        }
    },

    resetContextState: function () {
        var nav = this.findNavigationSidebarPanelSpec();
        if (nav) {
            this.groupContainer.suspendResize();
            this.model.set('navigationState', 'about');
            this.ensureOnlyPanelsVisible(PanelSpecTypes.DISCUSSION_CONTEXT);
            this.groupContainer.resumeResize();
        }
    },

    resetSynthesisMessagesState: function (synthesisInNavigationPanel) {
        if (this.findNavigationSidebarPanelSpec()) {
            this.groupContainer.suspendResize();
            this.removePanels(PanelSpecTypes.DISCUSSION_CONTEXT, PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
            this.ensurePanelsVisible(PanelSpecTypes.MESSAGE_LIST);
            this.ensurePanelsHidden(PanelSpecTypes.IDEA_PANEL);
            this.resetMessagePanelWidth();
            this.groupContainer.resumeResize(true);

            var conversationPanel = this.findViewByType(PanelSpecTypes.MESSAGE_LIST);
            conversationPanel.hideAlternativeContent();
        }
    },

    resetVisualizationState: function (url) {
        var nav = this.findNavigationSidebarPanelSpec();
        if (nav) {
            this.groupContainer.suspendResize();
            this.model.set('navigationState', 'visualizations');
            this.ensureOnlyPanelsVisible(PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
            var vizPanel = this.findViewByType(PanelSpecTypes.EXTERNAL_VISUALIZATION_CONTEXT);
            vizPanel.setUrl(url);
            this.groupContainer.resumeResize();
        }
    },

    resetMessagePanelWidth: function () {
        var messagePanel = this.findWrapperByType(PanelSpecTypes.MESSAGE_LIST);
        if (this.groupContainer.isOneNavigationGroup()) {
            var ideaPanel = this.findWrapperByType(PanelSpecTypes.IDEA_PANEL);
            if (ideaPanel.isPanelMinimized() || ideaPanel.isPanelHidden()) {
                messagePanel.setGridSize(AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE); // idea + message
                messagePanel.minWidth = messagePanel.contents.currentView.getMinWidthWithOffset(ideaPanel.minWidth);
            } else {
                messagePanel.setGridSize(AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE);
                messagePanel.minWidth = messagePanel.contents.currentView.getMinWidthWithOffset(0);
            }
        } else if (messagePanel != null) {
            messagePanel.setGridSize(AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE);
            messagePanel.minWidth = messagePanel.contents.currentView.getMinWidthWithOffset(0);
        }
    },

    resetMessagePanelState: function () {
        this.groupContainer.suspendResize();
        this.ensurePanelsVisible(PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST);
        var nav = this.findNavigationSidebarPanelSpec(),
            ideaPanel = this.findWrapperByType(PanelSpecTypes.IDEA_PANEL);
        this.resetMessagePanelWidth();
        if (ideaPanel != null && !ideaPanel.model.get('locked') && (!nav || this.model.get('navigationState') == 'debate')) {
          if (this._getCurrentIdea()) {
            ideaPanel.unminimizePanel();
          } else {
            ideaPanel.minimizePanel();
          }
        }
    },

    // not used?
    setPanelWidthByType: function (panelType, width) {
        var panels = this.model.get('panels');
        var panel = panels.findWhere({'type': panelType.id});
        var view = this.children.findByModel(panel);
        view.setGridSize(width);
    },

    resetNavigation: function () {
        var that = this,
            navigationSpec = this.findNavigationSidebarPanelSpec(),
            ideaPanel = this.model.getPanelSpecByType(PanelSpecTypes.IDEA_PANEL),
            messagePanelSpec = this.model.getPanelSpecByType(PanelSpecTypes.MESSAGE_LIST),
            messagePanelView = this.children.findByModel(messagePanelSpec);
        if (navigationSpec && messagePanelSpec) {
            if (messagePanelView) {
                if (ideaPanel == null || ideaPanel.get('hidden')) {
                    messagePanelView.setGridSize(AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE);
                }
                else {
                    messagePanelView.setGridSize(AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE);
                }
            } else {
                window.setTimeout(function () {
                    if (ideaPanel == null || ideaPanel.get('hidden')) {
                        messagePanelView.setGridSize(AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE);
                    }
                    else {
                        messagePanelView.setGridSize(AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE);
                    }
                }, 1000);
            }

        }
    },


    /**
     * @params panelSpecTypes
     */
    removePanels: function () {
        this.model.removePanels.apply(this.model, arguments);
    },

    addPanel: function (options, position) {
        this.model.addPanel(options, position);
    },

    /**
     * create the model (and corresponding view) if it does not exist.
     */
    ensurePanel: function (options, position) {
        this.model.ensurePanel(options, position);
    },

    /* Typenames are available in the panelType class attribute of each
     * panel class
     *
     */
    findWrapperByType: function (panelSpecType) {
        var model = this.model.getPanelSpecByType(panelSpecType);
        if (model !== undefined) {
            var view = this.children.findByModel(model);
            if (view == null)
                return;
            return view;
        }
        else {
            console.log("findWrapperByType: WARNING: unable to find a wrapper for type", panelSpecType);
        }
    },

    findViewByType: function (panelSpecType) {
        var wrapper = this.findWrapperByType(panelSpecType);
        if (wrapper != null && wrapper.contents !== undefined) {
            return wrapper.contents.currentView;
        }
        else {
            console.log("findViewByType: WARNING: unable to find a view for type", panelSpecType);
        }
        return undefined;
    },

    /**
     * ensure only the listed panels, are visible
     * However, all panels are created if necessary
     * @params list of panel names
     */
    ensureOnlyPanelsVisible: function () {
        var that = this,
            args = Array.prototype.slice.call(arguments),
            panels = this.model.get('panels');
        //console.log("ensureOnlyPanelsVisible called with", args);
        // add missing panels
        this.model.ensurePanelsAt(args, 1);
        // show and hide panels
        _.each(this.model.get('panels').models, function (aPanelSpec) {
            var panelSpecType = aPanelSpec.getPanelSpecType();
            if (panelSpecType === PanelSpecTypes.NAV_SIDEBAR)
                return;
            var view = that.children.findByModel(aPanelSpec);
            if (!view)
                return;
            var shouldBeVisible = _.find(args, function (arg) {
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

    ensurePanelsVisible: function () {
        var that = this;
        var args = Array.prototype.slice.call(arguments);
        var panels = this.model.get('panels');
        //console.log("ensurePanelsVisible called with", args);
        // add missing panels
        this.model.ensurePanelsAt(args, 1);
        // show and hide panels
        var panelSpecsToMakeVisible = this.model.get('panels').models.filter(function (aPanelSpec) {
            var panelSpecType = aPanelSpec.getPanelSpecType();
            return _.contains(args, panelSpecType);
        });
        if (_.size(args) !== _.size(panelSpecsToMakeVisible)) {
            console.log(args, panelSpecsToMakeVisible);
            throw new Error("Error, unable to find all panels to make visible");
        }
        _.each(panelSpecsToMakeVisible, function (aPanelSpec) {
            aPanelSpec.set('hidden', false);
        });
    },

    /**
     * Ensure all listed panels are hidden if present
     * Skips PanelSpecTypes.NAV_SIDEBAR
     * @params list of panel names
     */
    ensurePanelsHidden: function () {
        var that = this;
        var args = Array.prototype.slice.call(arguments);
        var panels = this.model.get('panels');
        // show and hide panels
        _.each(this.model.get('panels').models, function (aPanelSpec) {
            var panelSpecType = aPanelSpec.getPanelSpecType();
            if (panelSpecType === PanelSpecTypes.NAV_SIDEBAR) {
                return;
            }
            var shouldBeHidden = _.find(args, function (arg) {
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
    }
});

module.exports = groupContent;