define(function(require){

    var Marionette = require('marionette'),
                 _ = require('underscore');

    var MultiRegion = Marionette.Region.extend({

        currentView: [],

        open: function(view) {
            this.ensureEl();
            this.$el.append(view.el);
        },

        close: function(views){
            if (typeof views === "object") {
                views = [views];
            }
            else if ( !views || !_.isArray(views)) {
                views = this.currentView;
            }

            _.each(views, this._closeView, this);

            this._removeViews(views);
            Marionette.triggerMethod.call(this, "close", views);

            return this;
        },

        show: function(views) {
            if (typeof views === "object" && !_.isArray(views)) {
                views = [views];
            }
            else if ( !views || !_.isArray(views)) {
                this.renderAll();
                return this;
            }

            _.each(views, this._showView, this);

            this._addViews(views);
            Marionette.triggerMethod.call(this, "show", views);

            return this;
        },

        _closeView: function(view) {
            if (view.close) {
                view.close();
            }
            else {
                // If it doesn't have a `close` method, at least remove them from the DOM with Backbone.View's `remove`
                view.remove();
            }

            Marionette.triggerMethod.call(this, "close", view);
        },

        _showView: function(view) {
            view.render();
            this.open(view);

            Marionette.triggerMethod.call(view, "show");
            Marionette.triggerMethod.call(this, "show", view);
        },

        _removeViews: function(views) {
            this.currentView = _.difference(this.currentView, views);
        },

        _addViews: function(views) {
            this.currentView = _.union(this.currentView, views);
        },

        attachView: function(view) {
            this.open(view);
            this.currentView.push(view);

            return this;
        },

        renderAll: function() {
            _.each(this.currentView, function(view){
                view.render();
            });

            return this;
        }
    })

    return MultiRegion;
})