define(function (require) {

    var Marionette = require('marionette'),
      GroupManager = require('modules/groupManager'),
      viewsFactory = require('objects/viewsFactory'),
               ctx = require('modules/context'),
         panelSpec = require('models/panelSpec'),
      PanelWrapper = require('views/groups/panelWrapper');

    /** Reprents the content of an entire group */
    var groupContent = Marionette.CompositeView.extend({
        template: "#tmpl-groupContent",
        className: "groupContent",
        childViewContainer: ".groupBody",
        childView: PanelWrapper,
        initialize: function(options){
          this.collection = this.model.get('panels');
          this.groupManager = new GroupManager({groupSpec: this.model});
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
        /**
         * Tell the panelWrapper which view to put in its contents
         */
        childViewOptions: function(child, index) {
          return {
            groupContent: this,
            groupManager: this.groupManager,
            contentSpec: child
          }
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
              this.ensurePanelsVisible('message');
              this.ensurePanelsHidden('idea-panel');
            break;
            case 'debate':
              this.removePanels('home-panel', 'synthesis');
              this.ensurePanelsVisible('idea-panel', 'message');
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
        
        /**
         * @params list of panel names
         */
        removePanels: function(){
          this.model.removePanels.apply(this.model, arguments);
        },
        
        /**
         * @params list of panel names
         */
        ensureOnlyPanelsVisible: function(){
          var that = this;
          var args = Array.prototype.slice.call(arguments);
          var panels = this.model.get('panels');
          // add missing panels
          this.model.ensurePanelsAt(args, 1);
          // show and hide panels
          _.each(this.model.get('panels').models, function(aPanelSpec){
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
        /**
         * @params list of panel names
         */
        ensurePanelsVisible: function(){
          var that = this;
          var args = Array.prototype.slice.call(arguments);
          var panels = this.model.get('panels');
          // add missing panels
          this.model.ensurePanelsAt(args, 1);
          // show and hide panels
          _.each(this.model.get('panels').models, function(aPanelSpec){
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
          });
        },
        /**
         * @params list of panel names
         */
        ensurePanelsHidden: function(){
          var that = this;
          var args = Array.prototype.slice.call(arguments);
          var panels = this.model.get('panels');
          // show and hide panels
          _.each(this.model.get('panels').models, function(aPanelSpec){
            if ( aPanelSpec.get('type') == 'navigation')
              return;
            var view = that.children.findByModel(aPanelSpec);
            if ( !view )
              return;
            var shouldBeHidden = _.contains(args, aPanelSpec.get('type'));
            if ( shouldBeHidden )
            {
              view.$el.hide();
            }
          });

    });

    return groupContent;
});