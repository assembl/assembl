define(function (require) {

    var Marionette = require('marionette'),
      GroupContent = require('views/groups/groupContent');

    var groupContainer = Marionette.CollectionView.extend({
        className:'groupContainer',
        childView: GroupContent
    });

    return groupContainer;
});