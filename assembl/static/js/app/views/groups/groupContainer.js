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
        initialize: function (options) {
            // boilerplate in marionette if you listen m/c here, use collectionEvents or modelEvents
            //this.listenTo(this.collection, 'change reset add remove', this.calculateGridSize);
        },
        onRender: function () {
            if (!window.localStorage.getItem('showNotification')) {
                this.$el.css('top', '75px');
                Assembl.notificationRegion.show(new Notification());
            }
        },
        collectionEvents: {
            'change reset add remove': 'calculateGridSize'
        },
        calculateGridSize: function () {
            var that = this, gridSize = 0;
            this.collection.each(function (aGroupSpec) {
                var view = that.children.findByModel(aGroupSpec);
                if (view)
                    gridSize += view.calculateGridSize();
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