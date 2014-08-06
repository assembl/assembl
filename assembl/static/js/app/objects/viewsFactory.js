define(function (require) {
  'use strict';

  var AssemblPanel = require('views/assemblPanel'),
  IdeaPanel = require('views/ideaPanel'),
  MessageList = require('views/messageList'),
  HomePanel = require('views/navigation/home'),
  SegmentList = require('views/segmentList'),
  SynthesisPanel = require('views/synthesisPanel'),
  NavigationPanel = require('views/navigation/navigation');

  var panelTypeRegistry = {
      'idea-panel': IdeaPanel,
      'message'   : MessageList,
      'home-panel': HomePanel,
      'navigation': NavigationPanel,
      'synthesis' : SynthesisPanel,
      'clipboard' : SegmentList
  };

  /**
   * Factory to create a view instance from the panelSpec passed as parameter
   *
   * @param <PanelSpecs.Model> panelSpecModel
   * @return <AssemblPanel> AssemblPanel view
   */
  function createPanel(panelSpecModel) {
    try {
      return panelTypeRegistry[panelSpecModel.get('type')];
    } catch (err) {
      console.log('invalid spec:', panelSpecModel);
    }
    return AssemblPanel;
  }

  return createPanel;
});
