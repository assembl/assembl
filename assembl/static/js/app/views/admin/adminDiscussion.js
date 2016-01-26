'use strict';

var Marionette = require('../../shims/marionette.js'),
    $ = require('../../shims/jquery.js'),
    _ = require('../../shims/underscore.js'),
    autosize = require('jquery-autosize'),
    CollectionManager = require('../../common/collectionManager.js'),
    Ctx = require('../../common/context.js'),
    Growl = require('../../utils/growl.js'),
    Discussion = require('../../models/discussion.js'),
    DiscussionSource = require('../../models/discussionSource.js'),
    i18n = require('../../utils/i18n.js'),
    AdminNavigationMenu = require('./adminNavigationMenu.js');

var adminDiscussion = Marionette.LayoutView.extend({
  template: '#tmpl-adminDiscussion',
  className: 'admin-notifications',
  ui: {
      discussion: '.js_saveDiscussion'
    },
  regions: {
    'navigationMenuHolder': '.navigation-menu-holder'
  },
  initialize: function() {
    var that = this,
        collectionManager = new CollectionManager();

    this.model = undefined;

    collectionManager.getDiscussionModelPromise()
            .then(function(Discussion) {
              that.model =  Discussion;
              that.render();
            });

  },

  onRender: function() {
    // this is in onRender instead of onBeforeShow because of the re-render in initialize()
    var menu = new AdminNavigationMenu({selectedSection: "edition"});
    this.getRegion('navigationMenuHolder').show(menu);

    this.$('#introduction').autosize();
  },
  events: {
      'click @ui.discussion': 'saveDiscussion'
    },

  serializeData: function() {
    return {
      discussion: this.model,
      Ctx: Ctx
    }
  },

  saveDiscussion: function(e) {
    e.preventDefault();

    var introduction = this.$('textarea[name=introduction]').val(),
        topic = this.$('input[name=topic]').val(),
        slug = this.$('input[name=slug]').val(),
        objectives = this.$('textarea[name=objectives]').val(),
        web_analytics_piwik_id_site = parseInt(this.$('#web_analytics_piwik_id_site').val()),
        help_url = this.$('#help_url').val(),
        homepage_url = this.$("#homepage_url").val(),
        show_help_in_debate_section = this.$('#show_help_in_debate_section:checked').length == 1;

    this.model.set({
      introduction:introduction,
      topic: topic,
      slug: slug,
      objectives: objectives,
      web_analytics_piwik_id_site: web_analytics_piwik_id_site,
      help_url: help_url,
      homepage: homepage_url,
      show_help_in_debate_section: show_help_in_debate_section
    });

    this.model.save(null, {
      success: function(model, resp, options) {
        Growl.showBottomGrowl(Growl.GrowlReason.SUCCESS, i18n.gettext("Your settings were saved!"));
      },
      error: function(model, resp, options) {
        Growl.showBottomGrowl(Growl.GrowlReason.ERROR, i18n.gettext("Your settings failed to update."));
        resp.handled = true; //In order to avoid Assembl crashing completely!
      }
    })
  }

});

module.exports = adminDiscussion;
