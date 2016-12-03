'use strict';
/**
 * 
 * @module app.views.admin.adminDiscussion
 */

var Marionette = require('../../shims/marionette.js'),
    $ = require('jquery'),
    _ = require('underscore'),
    autosize = require('jquery-autosize'),
    CollectionManager = require('../../common/collectionManager.js'),
    Ctx = require('../../common/context.js'),
    Growl = require('../../utils/growl.js'),
    Discussion = require('../../models/discussion.js'),
    DiscussionSource = require('../../models/discussionSource.js'),
    i18n = require('../../utils/i18n.js'),
    AdminNavigationMenu = require('./adminNavigationMenu.js');

var adminDiscussion = Marionette.LayoutView.extend({
  constructor: function adminDiscussion() {
    Marionette.LayoutView.apply(this, arguments);
  },

  template: '#tmpl-adminDiscussion',
  className: 'admin-discussion',
  ui: {
    discussion: '.js_saveDiscussion',
    logo: '#logo_url',
    logo_thumbnail: '#logo_thumbnail'
  },
  regions: {
    'navigationMenuHolder': '.navigation-menu-holder'
  },
  events: {
    'click @ui.discussion': 'saveDiscussion',
    'blur @ui.logo': 'renderLogoThumbnail'
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
    var menu = new AdminNavigationMenu.discussionAdminNavigationMenu(
      {selectedSection: "edition"});
    this.getRegion('navigationMenuHolder').show(menu);

    this.$('#introduction').autosize();
    this.renderLogoThumbnail();
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
        logo_url = this.ui.logo.val(),
        show_help_in_debate_section = this.$('#show_help_in_debate_section:checked').length == 1;

    this.model.set({
      introduction:introduction,
      topic: topic,
      slug: slug,
      objectives: objectives,
      web_analytics_piwik_id_site: web_analytics_piwik_id_site,
      help_url: help_url,
      logo: logo_url,
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
  },

  renderLogoThumbnail: function(){
    console.log("renderLogoThumbnail()");
    this.ui.logo_thumbnail.empty();
    var logo_url = this.ui.logo ? this.ui.logo.val() : null;
    console.log("logo_url: ", logo_url);
    if ( logo_url ){
      var img = $("<img>");
      img.attr("src", this.ui.logo.val());
      //img.css("max-width", "115px");
      img.css("max-height", "40px");
      
      var thumbnail_description = i18n.gettext("The logo will show like this:");
      var text_el = $("<span>");
      text_el.addClass('mrl');
      text_el.text(thumbnail_description);
      this.ui.logo_thumbnail.append(text_el);
      this.ui.logo_thumbnail.append(img);
    }
    
  }

});

module.exports = adminDiscussion;
