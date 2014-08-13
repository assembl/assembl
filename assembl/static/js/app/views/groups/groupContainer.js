define(function (require) {

    var Marionette = require('marionette'),
        Assembl = require('modules/assembl'),
        GroupContent = require('views/groups/groupContent'),
        Notification = require('views/notification');
    /**
     * Manages all the groups in the interface
     */
    var groupContainer = Marionette.CollectionView.extend({
        id: 'groupsContainer',
        childView: GroupContent,
        initialize: function(options) {
            this.listenTo(this.collection, 'change', this.calculateGridSize);
        },
        onRender: function () {
            if (!window.localStorage.getItem('showNotification')) {
                this.$el.css('top', '75px');
                Assembl.notificationRegion.show(new Notification());
            }
        },
        calculateGridSize: function () {
            var gridSize = 0;
            this.children.each(function (child) {
                gridSize += child.gridSize || 0;
            });
            var className = 'allGroupsGridSize-' + gridSize;
            var found = this.$el[0].className.match(/\b(allGroupsGridSize-[0-9]+)\b/);
            if (found && found[0] != className) {
                this.$el.removeClass(found[0]);
            }
            if ((!found) || found[0] != className) {
                this.$el.addClass(className);
            }
        }
    });

    return groupContainer;
});