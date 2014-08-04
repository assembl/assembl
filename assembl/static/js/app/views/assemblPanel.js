define(function(require){
    'use strict';

     var Backbone = require('backbone'),
          Assembl = require('modules/assembl'),
              Ctx = require('modules/context'),
             i18n = require('utils/i18n'),
    EditableField = require('views/editableField'),
    CKEditorField = require('views/ckeditorField'),
      Permissions = require('utils/permissions'),
  MessageSendView = require('views/messageSend'),
     Notification = require('views/notification'),
CollectionManager = require('modules/collectionManager'),
       Marionette = require('marionette'),
panelTypeRegistry = {};

    /**
     * @class AssemblPanel
     */
    var AssemblPanel = Marionette.LayoutView.extend({
        template: "#tmpl-groupItem",
        registerPanelType: function(name, cls) {
            panelTypeRegistry[name] = cls.prototype;
        },
        createPanel: function(spec) {
            var cls = panelTypeRegistry[spec.get('type')];
            if (cls !== undefined) {
                return cls.constructor;
            }
            return AssemblPanel;
        }
    });
    //AssemblPanel.prototype.registerPanelType('dummy', AssemblPanel);
    return AssemblPanel;
});
