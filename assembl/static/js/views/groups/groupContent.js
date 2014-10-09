define(function (require) {

    var Marionette = require('marionette'),
        ctx = require('modules/context'),
        panelSpec = require('models/panelSpec'),
        AssemblPanel = require('views/assemblPanel'),
        PanelWrapper = require('views/groups/panelWrapper');

    /** Reprents the content of an entire group */
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
                var navView = that.getViewByTypeName('navSidebar');
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
                    && panelWrapper.model.get('type') == 'idea') {
                    return;
                }
                extraPixels += that.panel_borders_size + panelWrapper.getExtraPixels();
            });
            return extraPixels;
        },

        useCurrentSize: function() {
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

        animateTowardsPixels: function(pixels_per_unit, percent_per_unit, extra_pixels, num_units, skip_animation) {
            var that = this,
                group_extra_pixels = this.getExtraPixels(false),
                group_units = this.calculateGridSize(),
                myCorrection = group_extra_pixels - (extra_pixels * group_units / num_units),
                width = (100 * group_units / num_units) + "%",
                target = window.innerWidth * group_units / num_units,
                group_min_size = this.calculateMinWidth()
                animationDuration = 1000;

            myCorrection = Math.round(myCorrection);
            // minimize use of calc
            if (Math.abs(myCorrection) > 3) {
                target += myCorrection;
                var sign = (myCorrection > 0)?"+":"-";
                width = "calc("+width + " "+sign+" "+ Math.abs(myCorrection) +"px)";
            }
            target = Math.max(target, group_min_size);
            var before = that.$el.width();

            var currentRatio = this.$el.width() / this.$el.parent().width();
            var targetRatio = (group_units / num_units) + (myCorrection / this.$el.parent().width());
            var shouldNotResize = false;
            var skipAnimation = skip_animation;
            if ( Math.abs(currentRatio - targetRatio) < 0.05 && this.groupContainer.collection.size() == 1 )
            {
                shouldNotResize = true;
            }
            else if ( Math.abs(currentRatio - targetRatio) > 0.75 && this.groupContainer.collection.size() == 1 )
            { // big expand of a single group, for example when the user arrives on the website
                skipAnimation = true;
                that.$el.width(width);
            }

            var onAnimationComplete = function(){
                that.$el.width(width);
                // console.log(" group. target width:", width, "=", target, "actual:", before, "->", that.$el.width());
                that.$el.removeClass("animating");
                that.$el.css("min-width", group_min_size);
            };
            if ( shouldNotResize )
            {
                window.setTimeout(onAnimationComplete, animationDuration);
            }
            else
            {
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

        getNavigationPanelSpec: function () {
            return this.model.getNavigationPanelSpec();
        },

        resetDebateState: function (skip_animation) {
            if (this.getNavigationPanelSpec()) {
                this.groupContainer.suspendResize();
                this.model.set('navigationState', 'debate');
                this.removePanels('homePanel');
                this.ensurePanelsVisible('ideaPanel', 'messageList');
                this.resetMessagePanelState();

                if ( skip_animation === false )
                    this.groupContainer.resumeResize(false);
                else
                    this.groupContainer.resumeResize(true);
            }
        },

        resetContextState: function () {
            var nav = this.getNavigationPanelSpec();
            if (nav) {
                this.groupContainer.suspendResize();
                this.model.set('navigationState', 'home');
                this.ensureOnlyPanelsVisible('homePanel');
                this.groupContainer.resumeResize();
            }
        },

        resetSynthesisMessagesState: function (synthesisInNavigationPanel) {
            if (this.getNavigationPanelSpec()) {
                this.groupContainer.suspendResize();
                this.removePanels('homePanel');
                this.ensurePanelsVisible('messageList');
                this.ensurePanelsHidden('ideaPanel');
                this.resetMessagePanelWidth();
                this.groupContainer.resumeResize(true);
            }
        },

        resetMessagePanelWidth: function() {
            var messagePanel = this.getWrapperByTypeName('messageList');
            if (this.groupContainer.isOneNavigationGroup()) {
                var ideaPanel = this.getWrapperByTypeName('ideaPanel');
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
            this.ensurePanelsVisible('ideaPanel', 'messageList');
            var nav = this.getNavigationPanelSpec(),
                ideaPanel = this.getWrapperByTypeName('ideaPanel');
            this.resetMessagePanelWidth();
            if (ideaPanel != null && !ideaPanel.model.get('locked') && (!nav || this.model.get('navigationState') == 'debate')) {
                if (ctx.getCurrentIdea() == undefined) {
                    ideaPanel.minimizePanel();
                } else {
                    ideaPanel.unminimizePanel();
                }
            }
        },

        // not used?
        setPanelWidthByType: function (panelType, width) {
            var panels = this.model.get('panels');
            var panel = panels.findWhere({'type': panelType});
            var view = this.children.findByModel(panel);
            view.setGridSize(width);
        },

        resetNavigation: function () {
            var that = this,
                navigationSpec = this.getNavigationPanelSpec(),
                ideaPanel = this.model.getPanelSpecByType('ideaPanel'),
                messagePanelSpec = this.model.getPanelSpecByType('messagePanel'),
                messagePanelView = this.children.findByModel(messagePanelSpec);
            if (navigationSpec && messagePanelSpec) {
                function setSize() {
                    messagePanelView = that.children.findByModel(messagePanel);
                    if (ideaPanel == null || ideaPanel.get('hidden'))
                        messagePanelView.setGridSize(AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE);
                    else
                        messagePanelView.setGridSize(AssemblPanel.prototype.MESSAGE_PANEL_GRID_SIZE);
                }

                if (messagePanelView)
                    setSize();
                else
                    window.setTimeout(setSize);
            }
        },


        /**
         * @params list of panel names
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
        getWrapperByTypeName: function (typeName) {
            var model = this.model.getPanelSpecByType(typeName);
            if (model !== undefined) {
                var view = this.children.findByModel(model);
                if (view == null)
                    return;
                return view;
            }
        },

        getViewByTypeName: function (typeName) {
            var wrapper = this.getWrapperByTypeName(typeName);
            if (wrapper != null && wrapper.contents !== undefined) {
                return wrapper.contents.currentView;
            }
            return wrapper;
        },

        /**
         * @params list of panel names
         */
        ensureOnlyPanelsVisible: function () {
            var that = this,
                args = Array.prototype.slice.call(arguments),
                panels = this.model.get('panels');

            // add missing panels
            this.model.ensurePanelsAt(args, 1);
            // show and hide panels
            _.each(this.model.get('panels').models, function (aPanelSpec) {
                if (aPanelSpec.get('type') == 'navSidebar')
                    return;
                var view = that.children.findByModel(aPanelSpec);
                if (!view)
                    return;
                var shouldBeVisible = _.contains(args, aPanelSpec.get('type'));
                aPanelSpec.set('hidden', !shouldBeVisible);
            });
        },

        /**
         * @params list of panel names
         */
        ensurePanelsVisible: function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var panels = this.model.get('panels');
            // add missing panels
            this.model.ensurePanelsAt(args, 1);
            // show and hide panels
            _.each(this.model.get('panels').models, function (aPanelSpec) {
                if (aPanelSpec.get('type') == 'navSidebar')
                    return;
                var shouldBeVisible = _.contains(args, aPanelSpec.get('type'));
                if (shouldBeVisible)
                    aPanelSpec.set('hidden', false);
            });
        },

        /**
         * @params list of panel names
         */
        ensurePanelsHidden: function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var panels = this.model.get('panels');
            // show and hide panels
            _.each(this.model.get('panels').models, function (aPanelSpec) {
                if (aPanelSpec.get('type') == 'navSidebar')
                    return;
                var shouldBeHidden = _.contains(args, aPanelSpec.get('type'));
                if (shouldBeHidden)
                    aPanelSpec.set('hidden', true);
            });
        }
    });

    return groupContent;
});