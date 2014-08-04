define(function (require) {

    var Marionette = require('marionette'),
      GroupContent = require('views/groups/groupContent');

    var groupContainer = Marionette.CollectionView.extend({
        className:'groupContent',
        childView: GroupContent,
        initialize: function(options){
            /**
             * Need this compositeView id
             * to identify which localStorage to delete
             * */

            //console.log('groupContainer', this.collection);

        }
    });

    return groupContainer;
});