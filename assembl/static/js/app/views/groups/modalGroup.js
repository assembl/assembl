'use strict';

var Marionette = require('../../shims/marionette.js'),
    _ = require('../../shims/underscore.js'),
    Assembl = require('../../app.js'),
    Ctx = require('../../common/context.js'),
    i18n = require('../../utils/i18n.js'),
    panelSpec = require('../../models/panelSpec'),
    PanelSpecTypes = require('../../utils/panelSpecTypes'),
    viewsFactory = require('../../objects/viewsFactory'),
    groupSpec = require('../../models/groupSpec'),
    GroupContainer = require('../groups/groupContainer');

var ModalGroup = Backbone.Modal.extend({
  template: _.template($('#tmpl-groupModal').html()),

  className: 'panelGroups-modal popin-wrapper',

  cancelEl: '.close, .js_close',

  keyControl: false,

  initialize: function () {
    this.$('.bbm-modal').addClass('popin');
  },

  events: {
    'submit #partner-form' :'validatePartner'
  },

  onRender: function() {
    var defaults = {
        panels: new panelSpec.Collection([
                {type: PanelSpecTypes.IDEA_PANEL.id, minimized: false},
                {type: PanelSpecTypes.MESSAGE_LIST.id, minimized: false}
            ],
            {'viewsFactory': viewsFactory }),
        navigationState: 'debate'
    };
    var groupSpecModel = new groupSpec.Model(defaults, {'viewsFactory': viewsFactory });
    console.log(groupSpecModel.get('states'));
    var groupSpecCollection = new groupSpec.Collection([groupSpecModel]);
    var groupsView = new GroupContainer({
      collection: groupSpecCollection
    });
    groupsView.render();
    this.$('.popin-body').html(groupsView.el);
  }

});

module.exports = ModalGroup;