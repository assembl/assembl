'use strict';

var Marionette = require('../../shims/marionette.js'),
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
  /*
   * @param view A view (such as a messageList) for
   * which we want the matching groupContent to send events or manipulate
   * state.
   *
   * @return: A groupContent view
   */
  getGroupContent: function(view) {
    console.log("getGroupContent(): WRITEME!")
  },
  /* NOT YET TESTED - benoitg- 2015-06-29
   * @param viewClass A view (such as a messageList) for
   * which we want the matching groupContent to send events or manipulate
   * state.
   * @return Possibly empty array of panels
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
