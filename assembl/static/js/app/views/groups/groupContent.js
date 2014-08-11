define(function (require) {

    var Marionette = require('marionette'),
        ctx = require('modules/context'),
        panelSpec = require('models/panelSpec'),
        PanelWrapper = require('views/groups/panelWrapper');

    /** Reprents the content of an entire group */
    var groupContent = Marionette.CompositeView.extend({
        template: "#tmpl-groupContent",
        className: "groupContent",
        childViewContainer: ".groupBody",
        childView: PanelWrapper,

        _unlockCallbackQueue: {},

        _stateButton: null,

        initialize: function (options) {
            this.collection = this.model.get('panels');
        },
        events: {
            'click .close-group': 'closeGroup',
            'click .lock-group': 'toggleLock'
        },
        onRender: function () {
            this._stateButton = this.$('.lock-group i');
        },
        closeGroup: function () {
            this.unbind();
            this.model.collection.remove(this.model);
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

        /**
         * lock the panel if unlocked
         */
        lockGroup: function () {
            if (!this.model.get('locked')) {
                this.model.set('locked', true);
                this._stateButton.addClass('icon-lock').removeClass('icon-lock-open');
            }
        },

        /**
         * unlock the panel if locked
         */
        unlockGroup: function () {
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
            if (this.isLocked()) {
                this.unlockGroup();
            } else {
                this.lockGroup();
            }
        },

        isLocked: function () {
            return this.model.get('locked');
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
        },

        resetDebateState: function () {
            var currentIdea = ctx.getCurrentIdea();
            this.removePanels('homePanel');
            if (ctx.getCurrentIdea() == undefined) {
                this.ensurePanelsVisible('messageList');
                this.ensurePanelsHidden('ideaPanel');
            } else {
                this.ensurePanelsVisible('ideaPanel', 'messageList');
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

        ensurePanel: function (options, position) {
            this.model.ensurePanel(options, position);
        },

        getViewByTypeName: function (typeName) {
            var model = this.model.getPanelSpecByType(typeName);
            if (model !== undefined) {
                var view = this.children.findByModel(model);
                if (view.contents !== undefined) {
                    // wrapper
                    view = view.contents.currentView;
                }
                return view;
            }
        },

        /**
         * @params list of panel names
         */
        ensureOnlyPanelsVisible: function () {
            var that = this;
            var args = Array.prototype.slice.call(arguments);
            var panels = this.model.get('panels');
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
                // TODO: compute isAlreadyVisible and show() or hide() with animation only if state is different
                if (shouldBeVisible) {
                    view.$el.show();

                } else {

                    view.$el.hide();
                }
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
                var view = that.children.findByModel(aPanelSpec);
                if (!view)
                    return;
                var shouldBeVisible = _.contains(args, aPanelSpec.get('type'));
                // TODO: compute isAlreadyVisible and show() or hide() with animation only if state is different
                if (shouldBeVisible) {
                    view.$el.show();
                }
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
                var view = that.children.findByModel(aPanelSpec);
                if (!view)
                    return;
                var shouldBeHidden = _.contains(args, aPanelSpec.get('type'));
                if (shouldBeHidden) {
                    view.$el.hide();
                }
            });
        }
    });

    return groupContent;
});