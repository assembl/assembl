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
  SegmentList = require('views/segmentList'),  // clipboard
  SynthesisNavPanel = require('views/navigation/synthesisInNavigation'),  // synthesisNavPanel
  SynthesisPanel = require('views/synthesisPanel');  // synthesisPanel

  // Design note: This requires our panels to have a panelType variable.
  // I deliberately gave it the same values as panelClass, so we have less to remember.
  // I almost used panelClass, but decided that variable overloading was error-prone.
  // However, I will use the first CSS class in panelClass if panelType is absent. MAP
  var panelTypeRegistry = {};
  _.each([
    HomeNavPanel, HomePanel, IdeaList, IdeaPanel, MessageList, NavigationView, SegmentList, SynthesisNavPanel, SynthesisPanel
    ], function(panelClass) {
      var panelType = panelClass.prototype.panelType || panelClass.prototype.panelClass;
      if (panelType.indexOf(' ') > 0) {
        panelType = panelType.split(' ')[0];
      }
      panelTypeRegistry[panelType] = panelClass;
  });

  /**
   * Factory to create a view instance from the panelSpec passed as parameter
   *
   * @param <PanelSpecs.Model> panelSpecModel
   * @return <AssemblPanel> AssemblPanel view
   */
  function panelClassByTypeName(panelSpecModel) {
    try {
      return panelTypeRegistry[panelSpecModel.get('type')];
    } catch (err) {
      console.log('invalid spec:', panelSpecModel);
    }
    return AssemblPanel;
  }

  return panelClassByTypeName;
});
