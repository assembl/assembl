define(function (require) {
    'use strict';

    var Marionette = require('marionette'),
        _ = require('underscore');

    var groupManager = Marionette.Controller.extend({

        initialize: function (options) {
            this.groupSpec = options.groupSpec;
        },
        /**
         * A locked panel will not react to external UI state changes, such as
         * selecting a new current idea.
         */

        _unlockCallbackQueue: {},

        _stateButton: null,

        isLocked: function () {
            return this.groupSpec.get('locked');
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
            if (!this.groupSpec.get('locked')) {
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

        /**
         * lock the panel if unlocked
         */
        lockGroup: function () {
            if (!this.groupSpec.get('locked')) {
                this.groupSpec.set('locked', true);
                this._stateButton.addClass('icon-lock').removeClass('icon-lock-open');
            }
        },

        /**
         * unlock the panel if locked
         */
        unlockGroup: function () {
            if (this.groupSpec.get('locked')) {
                this.groupSpec.set('locked', false);
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
    });

    return groupManager;

});