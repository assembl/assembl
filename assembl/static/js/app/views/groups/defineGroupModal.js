'use strict';

var Marionette = require('../../shims/marionette.js'),
    $ = require('../../shims/jquery.js'),
    _ = require('../../shims/underscore.js'),
    Assembl = require('../../app.js'),
    Ctx = require('../../common/context.js'),
    GroupSpec = require('../../models/groupSpec.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    PanelSpecTypes = require('../../utils/panelSpecTypes.js'),
    viewsFactory = require('../../objects/viewsFactory.js'),
    RolesModel = require('../../models/roles.js'),
    Permissions = require('../../utils/permissions.js'),
    i18n = require('../../utils/i18n.js'),
    Roles = require('../../utils/roles.js'),
    Widget = require('../../models/widget.js'),
    WidgetLinks = require('../widgetLinks.js');

var DefineGroupModal = Backbone.Modal.extend({
    template: _.template($('#tmpl-create-group').html()),
    className: 'generic-modal popin-wrapper',
    cancelEl: '.close, .btn-cancel',
    serializeData: function() {
      var displayCIDashboard = Ctx.getPreferences().show_ci_dashboard,
          numLowerPanels = displayCIDashboard ? 4 : 3;
      return {
        PanelSpecTypes: PanelSpecTypes,
        displayCIDashboard: displayCIDashboard,
        numLowerPanels: numLowerPanels,
        panelOrder: Ctx.getPreferences().simple_view_panel_order
      };
    },
    initialize: function(options) {
      this.groupSpecsP = options.groupSpecsP;
      this.$('.bbm-modal').addClass('popin');
    },
    events: {
      'click .js_selectItem': 'selectItem',
      'click .js_createGroup': 'createGroup'
    },
    selectItem: function(e) {
      var elm = $(e.currentTarget),
          item = elm.parent().attr('data-view');

      elm.parent().toggleClass('is-selected');

      if (elm.parent().hasClass('is-selected')) {
        switch (item) {
          case PanelSpecTypes.NAV_SIDEBAR.id:
            this.disableView([PanelSpecTypes.TABLE_OF_IDEAS, PanelSpecTypes.SYNTHESIS_EDITOR, PanelSpecTypes.CLIPBOARD, PanelSpecTypes.MESSAGE_LIST, PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.CI_DASHBOARD_CONTEXT]);
            break;
          case PanelSpecTypes.SYNTHESIS_EDITOR.id:
            this.disableView([PanelSpecTypes.TABLE_OF_IDEAS, PanelSpecTypes.NAV_SIDEBAR]);
            this.enableView([PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST]);
            break;
          case PanelSpecTypes.TABLE_OF_IDEAS.id:
            this.disableView([PanelSpecTypes.SYNTHESIS_EDITOR, PanelSpecTypes.NAV_SIDEBAR]);
            this.enableView([PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST]);
            break;
        }

      } else {
        switch (item) {
          case PanelSpecTypes.NAV_SIDEBAR.id:
            this.enableView([PanelSpecTypes.TABLE_OF_IDEAS, PanelSpecTypes.SYNTHESIS_EDITOR, PanelSpecTypes.CLIPBOARD, PanelSpecTypes.CI_DASHBOARD_CONTEXT]);
            break;
          case PanelSpecTypes.SYNTHESIS_EDITOR.id:
            this.enableView([PanelSpecTypes.TABLE_OF_IDEAS, PanelSpecTypes.NAV_SIDEBAR]);
            this.disableView([PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST]);
            break;
          case PanelSpecTypes.TABLE_OF_IDEAS.id:
            this.disableView([PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST]);
            this.enableView([PanelSpecTypes.SYNTHESIS_EDITOR, PanelSpecTypes.NAV_SIDEBAR]);
            break;
        }
      }

    },

    disableView: function(items) {
      items.forEach(function(item) {
        var panel = $(".itemGroup[data-view='" + item.id + "']");
        panel.removeClass('is-selected');
        panel.addClass('is-disabled');
      });
    },

    enableView: function(items) {
      items.forEach(function(item) {
        var panel = $(".itemGroup[data-view='" + item.id + "']");
        panel.removeClass('is-disabled');
      });
    },

    createGroup: function() {
      var items = [],
          that = this,
          hasNavSide = false;

      if ($('.itemGroup').hasClass('is-selected')) {

        $('.itemGroup.is-selected').each(function() {
          var item = $(this).attr('data-view');
          items.push({type: item});

          if (item === 'navSidebar') {
            hasNavSide = true;
          }
        });
        this.groupSpecsP.done(function(groupSpecs) {
          var groupSpec = new GroupSpec.Model(
              {'panels': items}, {'parse': true, 'viewsFactory': viewsFactory});
          groupSpecs.add(groupSpec);
        });

        setTimeout(function() {
          that.scrollToRight();

          if (hasNavSide) {
            Assembl.vent.trigger('DEPRECATEDnavigation:selected', 'about');
          }

          that.$el.unbind();
          that.$el.remove();
        }, 100);
      }

    },
    scrollToRight: function() {
      var right = $('.groupsContainer').width();
      $('.groupsContainer').animate({
        scrollLeft: right
      }, 1000);
    }

  });

module.exports = DefineGroupModal;
