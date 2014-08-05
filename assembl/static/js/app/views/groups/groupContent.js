define(function (require) {

    var Marionette = require('marionette'),
      GroupManager = require('modules/groupManager'),
      viewsFactory = require('objects/viewsFactory');

    var groupContent = Marionette.CompositeView.extend({
        template: "#tmpl-groupContent",
        className: "groupContent",
        childViewContainer: ".groupBody",

        initialize: function(options){
            this.collection = this.model.get('panels');
            this.groupManager = new GroupManager({groupSpec: this.model});
            this.childViewOptions = { groupManager: this.groupManager };
        },
        events:{
            'click .add-group':'addGroup',
            'click .close-group':'closeGroup',
            'click .lock-group':'lockGroup'
        },
        closeGroup: function(){
           this.model.collection.remove(this.model);
        },
        getChildView: function(child) {
          return viewsFactory(child);
        }
    });

    return groupContent;
});