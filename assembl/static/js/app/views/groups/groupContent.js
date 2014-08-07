define(function (require) {

    var Marionette = require('marionette'),
      GroupManager = require('modules/groupManager'),
      viewsFactory = require('objects/viewsFactory'),
               ctx = require('modules/context'),
         panelSpec = require('models/panelSpec');

    var groupContent = Marionette.CompositeView.extend({
        template: "#tmpl-groupContent",
        className: "groupContent",
        childViewContainer: ".groupBody",
        initialize: function(options){
          this.collection = this.model.get('panels');
          this.groupManager = new GroupManager({groupSpec: this.model});
          this.childViewOptions = {
            groupManager: this.groupManager,
            groupContent: this
          };
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
        },
        setNavigationState: function(navigationAction){
          if ( navigationAction == 'debate' && ctx.getCurrentIdea() == undefined )
          {
            navigationAction = 'debate0';
          }
          this.model.set('navigationState', navigationAction);
          switch ( navigationAction )
          {
            case 'debate0':
              this.removePanels('home-panel','synthesis');
              this.ensureOnlyPanelsVisible('message');
            break;
            case 'debate':
              this.removePanels('home-panel', 'synthesis');
              this.ensureOnlyPanelsVisible('idea-panel', 'message');
            break;
            case 'home':
              this.removePanels('synthesis');
              this.ensureOnlyPanelsVisible('home-panel');
            break;
            case 'synthesis':
              this.removePanels('home-panel');
              this.ensureOnlyPanelsVisible('synthesis');
            break;
          }
        },
        removePanels: function(){
          var args = Array.prototype.slice.call(arguments);
          var panels = this.model.get('panels');
          var panelsToRemove = _.filter ( panels.models, function(el){
            return _.contains(args, el.get('type'));
          } );
          _.each( panelsToRemove, function(el){
            panels.remove(el);
          });
        },
        ensureOnlyPanelsVisible: function(){
          var that = this;
          var args = Array.prototype.slice.call(arguments);
          var panels = this.model.get('panels');
          // add missing panels
          _.each (args, function(panelName){
            if ( !_.any(panels.models, function(el){return el.get('type') == panelName}) )
            {
              var panel = new panelSpec.Model({'type':panelName});
              panels.add(panel,{at:1});
            }
          });
          // show and hide panels
          _.each(panels.models, function(aPanelSpec){
            if ( aPanelSpec.get('type') == 'navigation')
              return;
            var view = that.children.findByModel(aPanelSpec);
            if ( !view )
              return;
            var shouldBeVisible = _.contains(args, aPanelSpec.get('type'));
            // TODO: compute isAlreadyVisible and show() or hide() with animation only if state is different
            if ( shouldBeVisible )
            {
              view.$el.show();
            }
            else
            {
              view.$el.hide();
            }
          });
        },
    });

    return groupContent;
});