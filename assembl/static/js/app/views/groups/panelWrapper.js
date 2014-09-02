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
        _originalWidth: null,
        _nextElementOriginalWidth: null,

        initialize: function (options) {
            var contentClass = panelClassByTypeName(options.contentSpec);
            this.groupContent = options.groupContent;
            this.contentsView = new contentClass({
                groupContent: options.groupContent,
                panelWrapper: this
            });
            this.gridSize = this.contentsView.gridSize || AssemblPanel.prototype.DEFAULT_GRID_SIZE;
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
                hasMinimize: this.contentsView.minimizeable,
                hasClose: this.contentsView.closeable,
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
        },
        onRender: function () {
            this.setGridSize(this.gridSize);
            this.contents.show(this.contentsView);
            this.setHidden();
            Ctx.initTooltips(this.$el);
            this._stateButton = this.$('.lock-group i');
            this._minimizedStateButton = this.$('.panel-header-minimize');
        },
        setHidden: function () {
            if (this.model.get('hidden')) {
                this.$el.hide();
            } else {
                this.$el.css('display', 'table-cell');
            }
        },
        setGridSize: function (gridSize) {
            var changed = false,
                className = 'panelGridWidth-' + gridSize,
                found = this.$el[0].className.match(/\b(panelGridWidth-[0-9]+)\b/);
            this.gridSize = gridSize;
            if (found && found[0] != className) {
                changed = true;
                this.$el.removeClass(found[0]);
            }
            if ((!found) || found[0] != className) {
                changed = true;
                this.$el.addClass(className);
            }
            if (changed)
                this.groupContent.adjustGridSize();
        },

        /**
         * lock the panel if unlocked
         */
        lockPanel: function () {
            if (!this.model.get('locked')) {
                this.model.set('locked', true);
                this._stateButton.addClass('icon-lock').removeClass('icon-lock-open');
            }
        },

        /**
         * unlock the panel if locked
         */
        unlockPanel: function () {
            if (this.model.get('locked')) {
                this.model.set('locked', false);
                this._stateButton.addClass('icon-lock-open').removeClass('icon-lock');

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

        toggleMinimize: function() {
            this.model.set('minimized', !this.isPanelMinimized());
            this.applyMinimizationState();
        },

        applyMinimizationState: function(){
            if ( this.isPanelMinimized() )
            {
                this.minimizePanel();
            }
            else
            {
                this.unminimizePanel();
            }
        },

        isPanelMinimized: function () {
            return this.model.get('minimized');
        },

        unminimizePanel: function () {
            this.model.set('minimized', false);
            this._minimizedStateButton
                //.addClass('icon-collapse')
                //.removeClass('icon-expand')
                .attr('title', i18n.gettext('Minimize panel'))
                .attr('data-original-title', i18n.gettext('Minimize panel'));

            this.$el.css("width", this._originalWidth+"px");
            this.$el.next().css("width", this._nextElementOriginalWidth+"px");
            var el = this.$el;
            setTimeout(function(){
                el.removeClass("minimized");
            }, 200);

            this.$el.children(".panelContents").show();
            this.$el.find("header span.panel-header-title").show();
            this.$el.children(".panelContentsWhenMinimized").hide();
        },

        minimizePanel: function () {
            this._originalWidth = this.$el.width();
            this._nextElementOriginalWidth = this.$el.next().width();
            this.model.set('minimized', true);
            this._minimizedStateButton
                //.addClass('icon-expand')
                //.removeClass('icon-collapse')
                .attr('title', i18n.gettext('Maximize panel'))
                .attr('data-original-title', i18n.gettext('Maximize panel'));

            
            var targetWidth = 40;
            var currentWidth = this.$el.width();
            var diffWidth = currentWidth - targetWidth;
            var nextElementCurrentWidth = this.$el.next().width();
            this.$el.css("width", targetWidth+"px");
            this.$el.next().css("width", (nextElementCurrentWidth+diffWidth) + "px");
            this.$el.addClass("minimized");

            this.$el.children(".panelContents").hide();
            this.$el.find("header span.panel-header-title").hide();
            this.$el.children(".panelContentsWhenMinimized").show();
        },

        setButtonState: function (dom) {
            this._stateButton = dom;
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
        }
    });
    return PanelWrapper;
});