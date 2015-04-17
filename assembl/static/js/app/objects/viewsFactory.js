'use strict';

define(['views/assemblPanel', 'underscore', 'views/navigation/about', 'views/contextPage', 'views/ideaList', 'views/ideaPanel', 'views/messageList', 'views/navigation/navigation', 'views/segmentList', 'views/navigation/synthesisInNavigation', 'views/synthesisPanel', 'views/externalVisualization'],
    function (AssemblPanel, _, AboutNavPanel, ContextPanel, IdeaList, IdeaPanel, MessageList, NavigationView, SegmentList, SynthesisNavPanel, SynthesisPanel, ExternalVisualizationPanel) {

        /*
         * A registry of AssemblView subclasses implementing a panelSpec,
         * indexed by PanelSpec.id
         */
        var panelTypeRegistry = {};
        _.each([
            AboutNavPanel, ContextPanel, IdeaList, IdeaPanel, MessageList, NavigationView, SegmentList.SegmentListPanel, SynthesisNavPanel, SynthesisPanel, ExternalVisualizationPanel
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
                id = panelSpecModel.getPanelSpecType().id;
                panelClass = panelTypeRegistry[id];

                if (!panelClass instanceof AssemblPanel) {
                    throw new Error("panelClass isn't an instance of AssemblPanel");
                }
                //console.log("panelViewByPanelSpec() returning ",panelClass, "for",panelSpecModel)
                return panelClass;
            }
            catch (err) {
                //console.log('invalid spec:', panelSpecModel, "error was", err);
                throw new Error("invalidPanelSpecModel");
            }
        }
        return panelViewByPanelSpec;
    });
