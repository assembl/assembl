'use strict'
/**
 * 
 * @module app.views.modals.ideaInModal
 */

function navigateToIdea(panel, idea, forcePopup){

    var i18n = require('../../utils/i18n.js'),
        panelSpec = require('../../models/panelSpec.js'),
        PanelSpecTypes = require('../../utils/panelSpecTypes'),
        groupSpec = require('../../models/groupSpec.js'),
        ModalGroup = require('../groups/modalGroup.js'),
        viewsFactory = require('../../objects/viewsFactory'),
        Assembl = require('../../app.js'),
        Ctx = require('../../common/context.js');


    if (panel.isPrimaryNavigationPanel()) {
      panel.getContainingGroup().setCurrentIdea(idea);
    }
    
    // If the panel isn't the primary navigation panel, OR if we explicitly
    // ask for a popup, we need to create a modal group to see the idea
    if (!panel.isPrimaryNavigationPanel() || forcePopup) {
      //navigateToIdea called, and we are not the primary navigation panel
      //Let's open in a modal Group
      var defaults = {
        panels: new panelSpec.Collection([
                {type: PanelSpecTypes.IDEA_PANEL.id, minimized: false},
                {type: PanelSpecTypes.MESSAGE_LIST.id, minimized: false}
            ],
            {'viewsFactory': viewsFactory })
      };
      var groupSpecModel = new groupSpec.Model(defaults);
      var setResult = groupSpecModel.get('states').at(0).set({currentIdea: idea}, {validate: true});
      if (!setResult) {
        throw new Error("Unable to set currentIdea on modal Group");
      }

      var idea_title = Ctx.stripHtml(idea.getShortTitleDisplayText());

      //console.log("idea_title: ", idea_title);
      var modal_title_template = i18n.gettext("Exploring idea \"%s\"");

      //console.log("modal_title_template:", modal_title_template);
      var modal_title = null;
      if (modal_title_template && idea_title)
        modal_title = i18n.sprintf(i18n.gettext("Exploring idea \"%s\""), idea_title);

      //console.log("modal_title:", modal_title);
      var modal = new ModalGroup.View({"model": groupSpecModel, "title": modal_title});
      Ctx.setCurrentModalView(modal);
      Assembl.slider.show(modal);
    }
  }

module.exports = navigateToIdea;
