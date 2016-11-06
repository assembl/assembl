'use strict';
/**
 * 
 * @module app.utils.panelSpecTypes
 */

/**
 * A list of PanelSpecTypes
 * @class app.utils.panelSpecTypes.PanelSpecTypes
 */
var PanelSpecTypes = {
  //Note:  the id property is there only in case someone compares with ==
  //you should always compare these with === (much faster)
  NAV_SIDEBAR: {id: 'navSidebar', code: 'N'
  },//NavigationView implemented in views/navigation/navigation.js
  IDEA_PANEL: {id: 'ideaPanel', code: 'I'
  },//implemented in views/ideaPanel.js
  MESSAGE_LIST: {id: 'messageList', code: 'M'
  },//implemented in views/messageList.js
  TABLE_OF_IDEAS: {id: 'ideaList', code: 'T'
  },//implemented in views/ideaList.js
  CLIPBOARD: {id: 'clipboard', code: 'X'
  },//implemented in views/segmentList.js
  SYNTHESIS_EDITOR: {id: 'synthesisPanel', code: 'S'
  },//implemented in views/synthesisPanel.js
  DISCUSSION_CONTEXT: {id: 'contextPanel', code: 'H'
  },//implemented in views/contextPage.js
  NAVIGATION_PANEL_ABOUT_SECTION: {id: 'aboutNavPanel', code: 'K'
  },//implemented in views/navigation/about.js
  NAVIGATION_PANEL_SYNTHESIS_SECTION: {id: 'synthesisNavPanel', code: 'Z'
  },//implemented in views/navigation/synthesisInNavigation.js
  EXTERNAL_VISUALIZATION_CONTEXT: {id: 'externalVisualizationPanel', code: 'V'
  },//implemented in views/externalVisualization.js
  CI_DASHBOARD_CONTEXT: {id: 'dashboardVisualizationPanel', code: 'U'
  },//implemented in views/externalVisualization.js
  MESSAGE_COLUMNS: {id: 'messageColumns', code: 'C'
  },//implemented in views/messageColumnPanel.js

  getByRawId: function(id, failSilently) {
    var panelSpec = _.findWhere(this, {id: id});
    if (panelSpec === undefined && failSilently === undefined) {
      throw new Error("No panelSpecType with the requested id");
    }

    return panelSpec;
  },

  /* Return the panelSpecType if valid, undefined if not */
  validate: function(panelSpecType) {
    return _.find(this, function(panelSpecTypeFromObject) {
      return panelSpecTypeFromObject === panelSpecType;
    });
  },

  getNavigationPanelTypes: function() {
      return [PanelSpecTypes.NAV_SIDEBAR,
       PanelSpecTypes.TABLE_OF_IDEAS,
       PanelSpecTypes.SYNTHESIS_EDITOR];
  }
}

module.exports = PanelSpecTypes;
