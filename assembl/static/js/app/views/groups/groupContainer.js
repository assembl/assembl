define(function (require) {

    var Marionette = require('marionette'),
        Assembl = require('modules/assembl'),
        GroupContent = require('views/groups/groupContent'),
        AssemblPanel = require('views/assemblPanel'),
        Notification = require('views/notification');
    /**
     * Manages all the groups in the interface
     */
    var groupContainer = Marionette.CollectionView.extend({
        id: 'groupsContainer',
        childView: GroupContent,
        group_borders_size: 0,
        initialize: function (options) {
            var that = this;
            // boilerplate in marionette if you listen m/c here, use collectionEvents or modelEvents
            //this.listenTo(this.collection, 'change reset add remove', this.calculateGridSize);
            setTimeout(function () {
                that.resizeAllPanels();
            }, 200);
        },

        childViewOptions: function (child, index) {
            return {
                groupContainer: this
            }
        },

        onRender: function () {
            if (window.localStorage.getItem('showNotification')) {
                this.$el.addClass('hasNotification');
                Assembl.notificationRegion.show(new Notification());
            }
        },
        collectionEvents: {
            'change reset add remove': 'calculateGridSize'
        },
        calculateGridSize: function () {
            this.resizeAllPanels();
        },

        isOneNavigationGroup: function() {
            if (this.collection.size() == 1 && this.collection.first().getPanelSpecByType('navSidebar')) {
                return true;
            }
            return false;
        },


        resizeAllPanels: function() {
            console.trace();
            // pixels from borders, or minimized panels except (boolean) those counted below.
            var extra_pixels = this.getExtraPixels(false); // global
            if (isNaN(extra_pixels))
                alert("error");
            var min_idea_pixels = this.getMinIdeaPixels(); // minimized idea panels that are absorbed by their message panel
            if (isNaN(min_idea_pixels))
                alert("error");
            var num_units = this.getTotalGridSize(); // global
            if (isNaN(num_units))
                alert("error");
            this.useCurrentSize(); // get current sizes and override min/% with current size
            var window_width = window.innerWidth;
            var total_min_size = this.calculateMinWidth();
            if (isNaN(total_min_size))
                alert("error");
            var use_percent = (total_min_size + extra_pixels + min_idea_pixels < window_width);
            var unit_pixels = (window_width - extra_pixels) / num_units;
            this.animateTowardsPixels(use_percent?unit_pixels:0, 100.0/num_units, extra_pixels, num_units); // reestablish min_pixels, and % width based on param. (remove size)
        },


        getExtraPixels: function(include_embedded_idea_panel) {
            var extraPixels = 0,
                that = this;
            this.children.each(function (groupContent) {
                extraPixels += that.group_borders_size + groupContent.getExtraPixels(include_embedded_idea_panel);
            });
            return extraPixels;
        },

        getMinIdeaPixels: function() {
            if (this.isOneNavigationGroup()) {
                if (this.collection.first().getPanelSpecByType('ideaPanel').get('minimized')) {
                    return AssemblPanel.prototype.minimized_size;
                }
            }
            return 0;
        },

        getTotalGridSize: function() {
            var gridSize = 0,
                that = this;
            this.children.each(function (child) {
                gridSize += child.calculateGridSize();
            });
            return gridSize;
        },

        useCurrentSize: function() {
            this.children.each(function (child) {
                child.useCurrentSize();
            });
        },

        calculateMinWidth: function() {
            var min_width = 0,
                that = this;
            this.children.each(function (child) {
                min_width += child.calculateMinWidth();
            });
            return min_width;
        },

        animateTowardsPixels: function(pixels_per_unit, percent_per_unit, extra_pixels, num_units) {
            this.children.each(function (child) {
                child.animateTowardsPixels(pixels_per_unit, percent_per_unit, extra_pixels, num_units);
            });
        },

    });

    return groupContainer;
});