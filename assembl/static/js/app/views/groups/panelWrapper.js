'use strict';

define(['backbone.marionette', 'objects/viewsFactory', 'common/context', 'views/assemblPanel', 'utils/i18n', 'models/panelSpec', 'utils/panelSpecTypes'],
    function (Marionette, panelViewByPanelSpec, Ctx, AssemblPanel, i18n, panelSpec, PanelSpecTypes) {
        /**
         * A wrapper for a panel, used anywhere in a groupContent.
         * 
         * It's a shim to allow the parent view to have uniform objects to manage
         * (it only has to manager panelWrappers)
         * 
         * The actual panels hold a reference to the panelWrapper in their view 
         * (someview.panelWrapper
         */
        var PanelWrapper = Marionette.LayoutView.extend({
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
                lockPanel: '.js_lockPanel',
                minimizePanel: '.js_minimizePanel',
                closePanel: '.js_panel-closeButton'
            },
            events: {
                'click @ui.closePanel': 'closePanel',
                'click @ui.lockPanel': 'toggleLock',
                'click @ui.minimizePanel': 'toggleMinimize'
            },

            _unlockCallbackQueue: {},
            _stateButton: null,
            _minimizedStateButton: null,

            initialize: function (options) {
                var contentClass = panelViewByPanelSpec(options.contentSpec);
                this.groupContent = options.groupContent;
                if (!this.groupContent) {
                  throw new Error("The groupContent wasn't passed in the options");
                }
                this.contentsView = new contentClass({
                    panelWrapper: this
                });
                this.gridSize = this.contentsView.gridSize || AssemblPanel.prototype.DEFAULT_GRID_SIZE;
                this.minWidth = this.contentsView.minWidth || AssemblPanel.prototype.DEFAULT_MIN_SIZE;
                Marionette.bindEntityEvents(this, this.model, this.modelEvents);

                this.model.set('minimized', false); // TODO: memorize previous state and apply it
            },
            serializeData: function () {

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
            resetTitle: function (newTitle) {
                this.ui.title.html(newTitle);
            },
            /**
             * Closes the panel
             */
            closePanel: function () {
                Ctx.removeCurrentlyDisplayedTooltips();
                this.model.collection.remove(this.model);
                this.groupContent.groupContainer.resizeAllPanels();
            },
            onRender: function () {
                this.setGridSize(this.gridSize);
                this.contents.show(this.contentsView);
                this.setHidden();
                Ctx.initTooltips(this.$el);
                this._stateButton = this.$('.lock-group i');
                this._minimizedStateButton = this.$('.panel-header-minimize');
                this._minimizedStateIcon = this.$('.panel-header-minimize i');
            },
            setHidden: function () {
                if (this.model.get('hidden')) {
                    this.$el.hide();
                } else {
                    this.$el.css('display', 'table-cell');
                }
            },
            setGridSize: function (gridSize) {
                this.gridSize = gridSize;
                //this.groupContent.adjustGridSize();
            },

            /**
             * lock the panel if unlocked
             */
            lockPanel: function () {
                if (!this.model.get('locked')) {
                    this.model.set('locked', true);
                    this._stateButton
                        .addClass('icon-lock')
                        .removeClass('icon-lock-open')
                        .attr('data-original-title', i18n.gettext('Unlock panel'));
                }
            },

            /**
             * unlock the panel if locked
             */
            unlockPanel: function () {
                if (this.model.get('locked')) {
                    this.model.set('locked', false);
                    this._stateButton
                        .addClass('icon-lock-open')
                        .removeClass('icon-lock')
                        .attr('data-original-title', i18n.gettext('Lock panel'));

                    if (_.size(this._unlockCallbackQueue) > 0) {
                        //console.log("Executing queued callbacks in queue: ",this.unlockCallbackQueue);
                        _.each(this._unlockCallbackQueue, function (callback) {
                            callback();
                        });
                        //We presume the callbacks have their own calls to render
                        //this.render();
                        this._unlockCallbackQueue = {};
                    }
                }
            },
            /**
             * Toggle the lock state of the panel
             */
            toggleLock: function () {
                if (this.isPanelLocked()) {
                    this.unlockPanel();
                } else {
                    this.lockPanel();
                }
            },

            isPanelLocked: function () {
                return this.model.get('locked');
            },

            toggleMinimize: function (evt) {
                evt.stopPropagation();
                evt.preventDefault();
                if (this.isPanelMinimized()) {
                    this.unminimizePanel(evt);
                } else {
                    this.minimizePanel(evt);
                }
            },

            isPanelMinimized: function () {
                return this.model.get('minimized');
            },

            isPanelHidden: function () {
                return this.model.get('hidden');
            },

            unminimizePanel: function (evt) {
                if (!this.model.get('minimized'))
                    return;
                if (this.model.isOfType(PanelSpecTypes.IDEA_PANEL) && Ctx.DEPRECATEDgetCurrentIdea() == undefined && evt && evt.currentTarget) {
                    // do not accept to unminimize if no idea to show
                    var el = this.ui.minimizePanel;
                    el.attr("data-original-title", i18n.gettext('Please select an idea in the table of ideas to open the idea panel.'));
                    el.tooltip('destroy');
                    el.tooltip({container: 'body'});
                    el.tooltip('show');

                    return;
                }

                this.model.set('minimized', false);

                this.$el.addClass("unminimizing");

                if (this.model.isOfType(PanelSpecTypes.IDEA_PANEL)) {
                    this.groupContent.resetMessagePanelWidth();
                    var _store = window.localStorage;
                    //_store.removeItem('ideaPanelHelpShown'); // uncomment this to test
                    if (!_store.getItem('ideaPanelHelpShown')) {
                        _store.setItem('ideaPanelHelpShown', true);
                        var that = this;
                        setTimeout(function () {
                            var el = that.ui.minimizePanel;
                            var initialTitle = el.attr("data-original-title");
                            el.attr("data-original-title", i18n.gettext('Need more room for messages? Click here to minimize the Idea panel.'));
                            el.tooltip('destroy');
                            el.tooltip({container: 'body', placement: 'left'});
                            el.tooltip('show');
                            setTimeout(function () {
                                el.attr("data-original-title", initialTitle);
                                el.tooltip('destroy');
                                el.tooltip({container: 'body'});
                            }, 7000);
                        }, 2500);
                    }
                }

                this.groupContent.groupContainer.resizeAllPanels();
            },

            minimizePanel: function (evt) {
                if (this.model.get('minimized'))
                    return;

                this.model.set('minimized', true);

                this.$el.addClass("minimizing");

                if (this.model.isOfType(PanelSpecTypes.IDEA_PANEL)) {
                    this.groupContent.resetMessagePanelWidth();
                }

                this.groupContent.groupContainer.resizeAllPanels();
            },

            setButtonState: function (dom) {
                this._stateButton = dom;
            },

            getExtraPixels: function () {
                if (this.model.get('minimized')) {
                    return AssemblPanel.prototype.minimized_size;
                }
                return 0;
            },

            /**
             * during animation, freeze the percentage width of panels into pixels
             */
            useCurrentSize: function () {
                this.$el.stop();
                var width = this.$el[0].style.width;
                // console.log("  panel ", this.model.get('type'), "useCurrentSize:", this.$el.width(), width);
                // If %, we already applied this, and the browser may have changed pixels on us.
                if (width == "" || width.indexOf('%') >= 0) {
                    this.$el.width(this.$el.width());
                }
                this.$el.addClass("animating");
            },

            animateTowardsPixels: function (pixels_per_unit, percent_per_unit, extra_pixels, num_units, group_units, skip_animation) {
                var that = this;
                var animationDuration = 1000;
                var panelContents = this.$el.children(".panelContents");

                if (this.model.get('minimized')) { // execute minimization animation

                    this._minimizedStateIcon
                        .addClass('icon-arrowright')
                        .removeClass('icon-arrowleft');
                    this._minimizedStateButton
                        .attr('data-original-title', i18n.gettext('Maximize panel'));

                    var target = AssemblPanel.prototype.minimized_size;
                    if (skip_animation) {
                        panelContents.css("width", "100%");
                        panelContents.hide();
                        this.$el.find("header span.panel-header-title").hide();
                        this.$el.children(".panelContentsWhenMinimized").show();

                        that.$el.width(target);
                        that.$el.removeClass("animating");
                        that.$el.addClass("minimized");
                        that.$el.removeClass("minimizing");
                        that.$el.css("min-width", AssemblPanel.prototype.minimized_size);
                    }
                    else {
                        // fix the width of the panel content div (.panelContents), so that its animation does not change the positioning of its content (line returns, etc)
                        panelContents.css("width", panelContents.width());

                        panelContents.fadeOut(animationDuration * 0.9, function () {
                            // once the animation is over, set its width back to 100%, so that it remains adaptative
                            panelContents.css("width", "100%");
                        });

                        this.$el.find("header span.panel-header-title").fadeOut(animationDuration * 0.4); // hide header title rapidly, so we avoid unwanted line feeds for header icons during resize
                        this.$el.children(".panelContentsWhenMinimized").delay(animationDuration * 0.6).fadeIn(animationDuration * 0.4);

                        this.$el.animate({'width': target}, animationDuration, 'swing', function () {
                            that.$el.removeClass("animating");
                            that.$el.addClass("minimized");
                            that.$el.removeClass("minimizing");
                            that.$el.css("min-width", AssemblPanel.prototype.minimized_size);
                        });
                    }


                } else { // execute de-minimization animation

                    // compute target width (expressed in pixels in "target" variable, and in calc(%+px) in "width" variable)

                    var gridSize = this.gridSize;
                    //var myCorrection = extra_pixels * gridSize / num_units;
                    var myCorrection = extra_pixels * gridSize / group_units;
                    if (this.groupContent.groupContainer.isOneNavigationGroup()
                        && this.model.isOfType(PanelSpecTypes.MESSAGE_LIST)
                        && this.groupContent.model.getPanelSpecByType(PanelSpecTypes.IDEA_PANEL).get('minimized')) {
                        myCorrection += AssemblPanel.prototype.minimized_size;
                    }
                    if (isNaN(myCorrection))
                        console.log("error in myCorrection");
                    var target = Math.max(pixels_per_unit * gridSize, this.minWidth);
                    var width = (100 * gridSize / group_units) + "%";
                    // minimize use of calc
                    if (myCorrection > 3) {
                        width = "calc(" + width + " - " + myCorrection + "px)";
                        target -= myCorrection;
                    }

                    if (skip_animation) {
                        this._minimizedStateIcon
                            .addClass('icon-arrowleft')
                            .removeClass('icon-arrowright');
                        this._minimizedStateButton
                            .attr('data-original-title', i18n.gettext('Minimize panel'));

                        panelContents.css("width", "100%");

                        this.$el.find("header span.panel-header-title").show();
                        this.$el.children(".panelContentsWhenMinimized").hide();

                        this.$el.width(width);
                        that.$el.removeClass("animating");
                        that.$el.removeClass("minimized");
                        that.$el.removeClass("unminimizing");
                        that.$el.css("min-width", that.minWidth);
                    }
                    else {
                        // show, hide, resize and restyle DOM elements using animations

                        if (this.$el.hasClass("unminimizing")) {
                            this._minimizedStateIcon
                                .addClass('icon-arrowleft')
                                .removeClass('icon-arrowright');
                            this._minimizedStateButton
                                .attr('data-original-title', i18n.gettext('Minimize panel'));

                            // fix the width of the panel content div (.panelContents), so that its animation does not change the positioning of its content (line returns, etc)
                            panelContents.css("width", target);

                            //panelContents.delay(animationDuration*0.3).fadeIn(animationDuration*0.7, function(){
                            panelContents.delay(animationDuration * 0.2).fadeIn(animationDuration * 0.8, function () {
                                // once the animation is over, set its width back to 100%, so that it remains adaptative
                                panelContents.css("width", "100%");
                            });

                            this.$el.find("header span.panel-header-title").delay(animationDuration * 0.5).fadeIn(animationDuration * 0.5);
                            this.$el.children(".panelContentsWhenMinimized").fadeOut(animationDuration * 0.3);
                        }


                        // console.log("  panel ", that.model.get('type'), "target width:", width, "=", target, "actual:", that.$el.width());
                        this.$el.animate({'width': target}, animationDuration, 'swing', function () {
                            that.$el.width(width);
                            // window.setTimeout(function() {
                            //     console.log("  panel ", that.model.get('type'), "final width:", that.$el.width());
                            // });
                            that.$el.removeClass("animating");
                            that.$el.removeClass("minimized");
                            that.$el.removeClass("unminimizing");
                            that.$el.css("min-width", that.minWidth);
                        });
                    }

                }
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
            filterThroughPanelLock: function (callback, queueWithId) {
                if (!this.model.get('locked')) {
                    callback();

                } else {
                    if (queueWithId) {
                        if (this._unlockCallbackQueue[queueWithId] !== undefined) {
                        }
                        else {
                            this._unlockCallbackQueue[queueWithId] = callback;
                        }
                    }
                }
            },

            getIcon: function () {
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
        return PanelWrapper;
    });