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
        onRender: function () {
            if (!window.localStorage.getItem('showNotification')) {
                this.$el.css('top', '75px');
                Assembl.notificationRegion.show(new Notification());
            }
        }
    });

    return groupContainer;
});