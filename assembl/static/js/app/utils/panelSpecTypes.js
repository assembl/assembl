'use strict';

/**
 * @class PanelSpecTypes
 *
 * A list of PanelSpecTypes
 */
var PanelSpecTypes = {
    //Note:  the id property is there only in case someone compares with ==
    //you should always compare these with === (much faster)
    NAV_SIDEBAR: {id: 'navSidebar'
    },//NavigationView implemented in views/navigation/navigation.js
    IDEA_PANEL: {id: 'ideaPanel'
    },//implemented in views/ideaPanel.js
    MESSAGE_LIST: {id: 'messageList'
    },//implemented in views/messageList.js
    NAVIGATION_PANEL_ABOUT_SECTION: {id: 'aboutNavPanel'
    },//implemented in views/navigation/about.js
    TABLE_OF_IDEAS: {id: 'ideaList'
    },//implemented in views/ideaList.js
    CLIPBOARD: {id: 'clipboard'
    },//implemented in views/segmentList.js
    NAVIGATION_PANEL_SYNTHESIS_SECTION: {id: 'synthesisNavPanel'
    },//implemented in views/navigation/synthesisInNavigation.js
    SYNTHESIS_EDITOR: {id: 'synthesisPanel'
    },//implemented in views/synthesisPanel.js
    DISCUSSION_CONTEXT: {id: 'contextPanel'
    },//implemented in views/contextPage.js
    EXTERNAL_VISUALIZATION_CONTEXT: {id: 'externalVisualizationPanel'
    },//implemented in views/externalVisualization.js

    getByRawId: function (id) {
        var panelSpec = _.findWhere(this, {id: id});
        if (panelSpec === undefined) {
            throw new Error("No panelSpecType with the requested id");
        }
        return panelSpec
    },

    /* Return the panelSpecType if valid, undefined if not */
    validate: function (panelSpecType) {
        return _.find(this, function (panelSpecTypeFromObject) {
            return panelSpecTypeFromObject === panelSpecType;
        });
    }
}

module.exports = PanelSpecTypes;
