define(function (require) {
    'use strict';

    var AssemblPanel = require('views/assemblPanel'),
        _ = require('underscore'),
        HomeNavPanel = require('views/navigation/home'),  // homeNavPanel
        HomePanel = require('views/contextPage'),  // homePanel
        IdeaList = require('views/ideaList'),  // ideaList
        IdeaPanel = require('views/ideaPanel'),  // ideaPanel
        MessageList = require('views/messageList'),  // messageList
        NavigationView = require('views/navigation/navigation'),  // navSidebar
        SegmentList = require('views/segmentList').SegmentListPanel,  // clipboard
        SynthesisNavPanel = require('views/navigation/synthesisInNavigation'),  // synthesisNavPanel
        SynthesisPanel = require('views/synthesisPanel');  // synthesisPanel

    /*
     * A registry of AssemblView subclasses implementing a panelSpec,
     * indexed by PanelSpec.id
     */
    var panelTypeRegistry = {};
    _.each([
        HomeNavPanel, HomePanel, IdeaList, IdeaPanel, MessageList, NavigationView, SegmentList, SynthesisNavPanel, SynthesisPanel
    ], function (panelClass) {
        var panelType = panelClass.prototype.panelType;
        //console.log(panelClass.prototype.panelType);
        panelTypeRegistry[panelType.id] = panelClass;
    });
    //console.log("panelTypeRegistry:", panelTypeRegistry);

    /**
     * Factory to create a view instance from the panelSpec passed as parameter
     *
     * @param <PanelSpecs.Model> panelSpecModel
     * @return <AssemblPanel> AssemblPanel view
     */
    function panelViewByPanelSpec(panelSpecModel) {
      var panelClass,
          id;
      //console.log("panelViewByPanelSpec() called with ",panelSpecModel);
      try {
        id = panelSpecModel.get('type');
        if (id) {
          panelClass = panelTypeRegistry[id];
        }
        else {
          throw "panelSpecModel.get('type') was empty";
        }
        
        if (! panelClass instanceof AssemblPanel) {
          throw "panelClass isn't an instance of AssemblPanel";
        }
        //console.log("panelViewByPanelSpec() returning ",panelClass, "for",panelSpecModel)
        return panelClass;
      }
      catch (err) {
        console.log('invalid spec:', panelSpecModel, "error was", err);
        throw "invalidPanelSpecModel";
      }
    }

    return panelViewByPanelSpec;
});
