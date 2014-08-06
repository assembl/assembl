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
           'click .close-group':'closeGroup',
           'click .lock-group':'lockGroup'
        },
        onRender: function(){
           var elm = this.$('.lock-group i');
           this.groupManager.setButtonState(elm);
        },
        closeGroup: function(){
           this.unbind();
           this.model.collection.remove(this.model);
        },
        lockGroup: function(){
           this.groupManager.toggleLock();
        },
        getChildView: function(child) {
          return viewsFactory(child);
        }
    });

    return groupContent;
});