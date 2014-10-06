define(function (require) {

    var Marionette = require('marionette'),
        panelClassByTypeName = require('objects/viewsFactory'),
        Ctx = require('modules/context'),
        AssemblPanel = require('views/assemblPanel'),
        i18n = require('utils/i18n'),
        panelSpec = require('models/panelSpec');

    /**
     * A wrapper for a panel, used anywhere in a panelGroup
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
            title: ".panel-header-title"
        },
        events: {
            'click .panel-header-close': 'closePanel',
            'click .js_lockPanel': 'toggleLock',
            'click .js_minimizePanel': 'toggleMinimize'
        },

        _unlockCallbackQueue: {},
        _stateButton: null,
        _minimizedStateButton: null,

        initialize: function (options) {
            var contentClass = panelClassByTypeName(options.contentSpec);
            this.groupContent = options.groupContent;
            this.contentsView = new contentClass({
                groupContent: options.groupContent,
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
                userCanChangeUi: Ctx.userCanChangeUi(),
                hasLock: this.contentsView.lockable,
                hasMinimize: this.contentsView.minimizeable || Ctx.userCanChangeUi(),
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

        toggleMinimize: function(evt) {
            evt.stopPropagation();
            evt.preventDefault();
            if (this.isPanelMinimized()) {
                this.unminimizePanel();
            } else {
                this.minimizePanel();
            }
        },

        isPanelMinimized: function () {
            return this.model.get('minimized');
        },

        isPanelHidden: function () {
            return this.model.get('hidden');
        },

        unminimizePanel: function () {
            if (!this.model.get('minimized'))
                return;
            if (this.model.get("type") == "ideaPanel" && Ctx.getCurrentIdea() == undefined) {
                // do not accept to unminimize if no idea to show
                return;
            }
            
            this.model.set('minimized', false);

            this.$el.addClass("unminimizing");
            
            if (this.model.get("type") == "ideaPanel") {
                this.groupContent.resetMessagePanelWidth();
            }

            this.groupContent.groupContainer.resizeAllPanels();
        },

        minimizePanel: function () {
            if (this.model.get('minimized'))
                return;
            
            this.model.set('minimized', true);

            this.$el.addClass("minimizing");

            if (this.model.get("type") == "ideaPanel") {
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
        useCurrentSize: function() {
            this.$el.stop();
            var width = this.$el[0].style.width;
            // console.log("  panel ", this.model.get('type'), "useCurrentSize:", this.$el.width(), width);
            // If %, we already applied this, and the browser may have changed pixels on us.
            if (width == "" || width.indexOf('%') >= 0) {
                this.$el.width(this.$el.width());
            }
            this.$el.addClass("animating");
        },

        animateTowardsPixels: function(pixels_per_unit, percent_per_unit, extra_pixels, num_units, group_units) {
            var that = this;
            var animationDuration = 1000;

            if (this.model.get('minimized')) { // execute minimization animation

                this._minimizedStateIcon
                    .addClass('icon-arrowright')
                    .removeClass('icon-arrowleft');
                this._minimizedStateButton
                    .attr('data-original-title', i18n.gettext('Maximize panel'));

                var panelContents = this.$el.children(".panelContents");
                // fix the width of the panel content div (.panelContents), so that its animation does not change the positioning of its content (line returns, etc)
                panelContents.css("width", panelContents.width());

                panelContents.fadeOut(animationDuration*0.9, function(){
                    // once the animation is over, set its width back to 100%, so that it remains adaptative 
                    panelContents.css("width", "100%");
                });

                this.$el.find("header span.panel-header-title").fadeOut(animationDuration*0.4); // hide header title rapidly, so we avoid unwanted line feeds for header icons during resize
                this.$el.children(".panelContentsWhenMinimized").delay(animationDuration*0.6).fadeIn(animationDuration*0.4);

                var target = AssemblPanel.prototype.minimized_size;
                this.$el.animate({'width': target}, animationDuration, 'swing', function() {
                    that.$el.removeClass("animating");
                    that.$el.addClass("minimized");
                    that.$el.removeClass("minimizing");
                    that.$el.css("min-width", AssemblPanel.prototype.minimized_size);
                });

            } else { // execute de-minimization animation

                // compute target width (expressed in pixels in "target" variable, and in calc(%+px) in "width" variable)
                
                var gridSize = this.gridSize;
                var myCorrection = extra_pixels * gridSize/ num_units;
                if (this.groupContent.groupContainer.isOneNavigationGroup()
                    && this.model.get('type') == 'messageList'
                    && this.groupContent.model.getPanelSpecByType('ideaPanel').get('minimized')) {
                        myCorrection += AssemblPanel.prototype.minimized_size;
                }
                if (isNaN(myCorrection))
                    console.log("error in myCorrection");
                var target = Math.max(pixels_per_unit * gridSize, this.minWidth);
                var width = (100*gridSize/group_units)+"%";
                // minimize use of calc
                if (myCorrection > 3) {
                    width = "calc("+width+" - "+myCorrection+"px)";
                    target -= myCorrection;
                }


                // show, hide, resize and restyle DOM elements using animations
                
                this._minimizedStateIcon
                    .addClass('icon-arrowleft')
                    .removeClass('icon-arrowright');
                this._minimizedStateButton
                    .attr('data-original-title', i18n.gettext('Minimize panel'));

                var panelContents = this.$el.children(".panelContents");
                // fix the width of the panel content div (.panelContents), so that its animation does not change the positioning of its content (line returns, etc)
                panelContents.css("width", target);

                //panelContents.delay(animationDuration*0.3).fadeIn(animationDuration*0.7, function(){
                panelContents.delay(animationDuration*0.2).fadeIn(animationDuration*0.8, function(){
                    // once the animation is over, set its width back to 100%, so that it remains adaptative 
                    panelContents.css("width", "100%");
                });

                this.$el.find("header span.panel-header-title").delay(animationDuration*0.5).fadeIn(animationDuration*0.5);
                this.$el.children(".panelContentsWhenMinimized").fadeOut(animationDuration*0.3);



                // console.log("  panel ", that.model.get('type'), "target width:", width, "=", target, "actual:", that.$el.width());
                this.$el.animate({'width': target}, animationDuration, 'swing', function() {
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
                case'ideaPanel':
                    icon = 'icon-idea';
                    break;
                case'navSidebar':
                    icon = 'icon-home';
                    break;
                case'messageList':
                    icon = 'icon-comment';
                    break;
                case'clipboard':
                    // ne need because of resetTitle - segment
                    break;
                case'synthesisPanel':
                    icon = 'icon-doc';
                    break;
                case'homePanel':
                    break;
                case'ideaList':
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