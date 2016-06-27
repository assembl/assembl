'use strict';
/**
 * 
 * @module app.views.groups.groupContainer
 */

var Marionette = require('../../shims/marionette.js'),
    ctx = require('../../common/context.js'),
    Assembl = require('../../app.js'),
    GroupContent = require('./groupContent.js'),
    AssemblPanel = require('../assemblPanel.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js');
/**
 * Manages all the groups in the interface, essentially the GroupSpec.Collection
 * Normally referenced with Assembl.groupContainer
 */
var groupContainer = Marionette.CollectionView.extend({
  constructor: function groupContainer() {
    Marionette.CollectionView.apply(this, arguments);
  },
  className: 'groupsContainer',
  childView: GroupContent,
  group_borders_size: 0,
  resizeSuspended: false,
  minPanelSize:AssemblPanel.prototype.minimized_size,
  
  onRender:function(){
    var that = this;
    that.resizeAllPanels(true);
    $(window).on("resize",function(){
      that.resizeAllPanels(true);
    });
  },
  resizeAllPanels:function(skipAnimation){
    var that = this;
    var screenSize = window.innerWidth;
    var animationDuration = 1000;
    this.children.each(function(groupContentView){
      groupContentView.children.each(function(panelWrapperView){
        var panelMinWidth = panelWrapperView.model.get('minWidth');
        var isPanelMinimized = panelWrapperView.model.get('minimized');
        var panelWidth = that.getPanelWidth(panelMinWidth,isPanelMinimized);
        var panel = panelWrapperView.$el;
        if(skipAnimation){
          panel.css({'min-width':panelMinWidth});
          panel.width(panelWidth);
        }else{
          var totalMinWidth = that.getTotalMinWidth();
          if(totalMinWidth < screenSize){
            panel.css({'min-width':0});
            panel.animate({'width': panelWidth}, animationDuration, 'swing',function(){
              panel.css({'min-width':panelMinWidth});
            });
          }else{
            var isSmallScreen = Ctx.isSmallScreen();
            if(isSmallScreen){
              panel.animate({'min-width': panelMinWidth}, animationDuration, 'swing')
            }else{
              panel.css({'min-width':0});
              panel.animate({'width': panelMinWidth}, animationDuration, 'swing',function(){
                panel.css({'min-width':panelMinWidth});
              });
            }
          }
        }
      });
    });
  },
  getPanelWidth:function(panelMinWidth,isPanelMinimized){
    var screenSize = window.innerWidth;
    var panelWIdth = 0;
    if(isPanelMinimized){
      panelWIdth = this.minPanelSize;
    }else{
      var isSmallScreen = ctx.isSmallScreen();
      if(!isSmallScreen){
        var totalMinWidth = this.getTotalMinWidth();
        var panelWidthInPercent = (panelMinWidth * 100) / totalMinWidth;
        var totalMinimized = this.getTotalWidthMinimized();
        var panelWidthInPixel = (panelWidthInPercent * (screenSize-totalMinimized)) / 100;
        panelWIdth = panelWidthInPixel;        
      }else{
        panelWIdth = screenSize;
      }
    }
    return panelWIdth;
  },
  getTotalMinWidth:function(){
    var totalMinWidth = 0;    
    this.children.each(function(groupContentView){
      groupContentView.children.each(function(panelWrapperView){
        var isPanelMinimized = panelWrapperView.model.get('minimized');
        var isPanelHidden = panelWrapperView.model.get('hidden');
        if(!isPanelHidden){
          if(!isPanelMinimized){
            totalMinWidth += panelWrapperView.model.get('minWidth');
          }
        }
      });
    });
    return totalMinWidth;
  },
  getTotalWidthMinimized:function(){
    var that = this;
    var totalMinimized = 0;
    this.children.each(function(groupContentView){
      groupContentView.children.each(function(panelWrapperView){
        var isPanelMinimized = panelWrapperView.model.get('minimized');
        var isPanelHidden = panelWrapperView.model.get('hidden');
        if(!isPanelHidden){
          if(isPanelMinimized){
            totalMinimized += that.minPanelSize;
          }
        }
      });
    });
    return totalMinimized;
  },
  /*
   * @param view: A view (such as a messageList) for
   * which we want the matching groupContent to send events or manipulate
   * state.
   *
   * @return: A groupContent view
   */
  getGroupContent: function(view) {
    console.log("getGroupContent(): WRITEME!")
  },
  /* NOT YET TESTED - benoitg- 2015-06-29
   * @param viewClass: A view (such as a messageList) for
   * which we want the matching groupContent to send events or manipulate
   * state.
   * @returns Possibly empty array of panels
   */
  findGroupsWithPanelInstance: function(panelSpecType) {
    if (!panelSpecType)
        panelSpecType = PanelSpecTypes.MESSAGE_LIST;
    var groups = [];
    var group = this.children.each(function(group) {
          var requested_panel = group.findViewByType(panelSpecType);
          if (requested_panel) {
            groups.push(group);
          }
        });
    return groups;
  },
  childViewOptions: function(child, index) {
    return {
      groupContainer: this
    }
  },
  /** Does this group have exactly one navigation panel?
  * 
  */
  isOneNavigationGroup: function() {
    if (this.collection.size() == 1) {
      var group1 = this.collection.first();
      var panel_types = group1.get('panels').pluck('type');
      if (panel_types.length == 3
          && (PanelSpecTypes.getByRawId(panel_types[0]) === PanelSpecTypes.NAV_SIDEBAR
              || PanelSpecTypes.getByRawId(panel_types[0]) === PanelSpecTypes.TABLE_OF_IDEAS)
              //I don't think this code is correct anymore.   Why do we check that
              //there is an idea panel followed by a messagelist? benoitg- 2015-05-27
          && PanelSpecTypes.getByRawId(panel_types[1]) === PanelSpecTypes.IDEA_PANEL
          && PanelSpecTypes.getByRawId(panel_types[2]) === PanelSpecTypes.MESSAGE_LIST)
          return true;
    }
    return false;
  },
});

module.exports = groupContainer;
