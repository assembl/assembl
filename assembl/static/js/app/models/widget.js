'use strict';

var Base = require("./base.js"),
    _ = require('../shims/underscore.js'),
    Ctx = require("../common/context.js");

var widgetModel = Base.Model.extend({
  urlRoot: Ctx.getApiV2DiscussionUrl("/widgets"),

  defaults: {
    "base_idea": null,
    "activity_notification": null,
    "start_date": null,
    "end_date": null,
    "activity_state": "active",
    "discussion": null,
    "settings": null,
    "ui_endpoint": null,
    "@id": null,
    "@type": null,
    "@view": null
  },

  validate: function(attrs, options) {
    /**
     * check typeof variable
     * */
     
  },

  MESSAGE_LIST_INSPIREME_CTX: 1,
  IDEA_PANEL_ACCESS_CTX: 2,
  IDEA_PANEL_CONFIGURE_CTX: 3,
  DISCUSSION_MENU_CONFIGURE_CTX: 4,
  VOTE_REPORTS: 5,
  TABLE_OF_IDEA_MARKERS: 6,

  isRelevantFor: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    var widgetType = this.get("@type"),
        activity_state = this.get("activity_state");
    switch (context) {
      case this.MESSAGE_LIST_INSPIREME_CTX:
        return (widgetType == "InspirationWidget"
            && activity_state === "active");
      case this.IDEA_PANEL_ACCESS_CTX:
        // assume non-root idea, relevant widget type
        return ((linkType === "VotableIdeaWidgetLink"
             || linkType === "IdeaCreativitySessionWidgetLink")
             && activity_state === "active");
      case this.IDEA_PANEL_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        // Should we add config on votable?
        return (linkType === "BaseIdeaWidgetLink"
             || linkType === "IdeaCreativitySessionWidgetLink");
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume root idea
        return (linkType === "BaseIdeaWidgetLink"
             || linkType === "IdeaCreativitySessionWidgetLink");
      case this.VOTE_PANEL_ACTIVE_CTX:
        return (widgetType == "MultiCriterionVotingWidget"
            && activity_state === "active");
      case this.VOTE_PANEL_ENDED_CTX:
        return (widgetType == "MultiCriterionVotingWidget"
            && activity_state === "ended");
      default:
        log.error("Widget.isRelevantFor: wrong context");
    }
  },

  getBaseUriFor: function(widgetType) {
    switch (widgetType) {
      case "CreativitySessionWidget":
        return "/static/widget/session/";
      case "MultiCriterionVotingWidget":
        return "/static/widget/vote/";
      case "InspirationWidget":
        return "/static/widget/creativity/";
      default:
        log.error("Widget.getBaseUri: wrong type");
    }
  },

  getBaseUri: function() {
    return this.getBaseUriFor(this.get("@type"));
  },

  getConfigurationUrl: function(targetIdea) {
    var base = this.getBaseUri(), uri = this.getId(), locale = Ctx.getLocale();
    switch (this.get("@type")) {
      case "CreativitySessionWidget":
        return base + "?locale=" + locale
            + "#/home?admin=1&config=" + uri;
      case "MultiCriterionVotingWidget":
        base += "?admin=1#/admin/configure_instance?widget_uri=" + uri;
        if (targetIdea) {
          base += "&target=" + encodeURIComponent(targetIdea);
        }
        return base;
      case "InspirationWidget":
        base += "?admin=1&locale=" + locale
            + "#/admin/configure_instance?widget_uri=" + Ctx.getUrlFromUri(uri);
        if (targetIdea) {
          base += "&target=" + encodeURIComponent(targetIdea);
        }
        return base;
      default:
        log.error("Widget.getConfigurationUrl: wrong type");
    }
  },

  getUrlForUser: function(targetIdea, page) {
    // TODO: generalize this. the issue is that some parameters come
    // before or after the angular route.
    var base = this.getBaseUri(), uri = this.getId(), locale = Ctx.getLocale();

    switch (this.get("@type")) {
      case "CreativitySessionWidget":
        return base + "?locale=" + locale + "#/home?config=" + uri;
      case "MultiCriterionVotingWidget":
        base += "?config=" + uri;
        if (targetIdea !== undefined) {
          base += encodeURIComponent("?target=" + targetIdea);
        }
        return base;
      case "InspirationWidget":
        return base + "?config=" + Ctx.getUrlFromUri(uri)
          + "&target=" + encodeURIComponent(targetIdea)
          + "&locale=" + locale;
      default:
        log.error("Widget.getUrlForUser: wrong type");
    }
  }
});

var widgetCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl("/widgets"),
  model: widgetModel,

  relevantWidgetsFor: function(idea, context) {
    var that = this, widgetLinks = idea.get("widget_links", []);
    // TODO: voting widgets are not link-bound.
    if (widgetLinks.length === 0) {
      return widgetLinks;
    }
    var relevantWidgets = _.map(widgetLinks, function(link) {
      var widget = that.get(link.widget);
      return widget.isRelevantFor(link["@type"], context, idea) ? widget : null;
    });
    return _.filter(relevantWidgets, function(w) {
      return w !== null;
    });
  },

  getCreationUrlForClass: function(cls, ideaId, locale) {
    if (locale === undefined) {
      locale = Ctx.getLocale();
    }
    var base = widgetModel.getBaseUriFor(cls);
    switch (cls) {
      case "InspirationWidget":
        return base + "?admin=1&locale=" + locale + "#/admin/create_from_idea?idea="
          + encodeURIComponent(ideaId + "?view=creativity_widget");
      case "MultiCriterionVotingWidget":
        return base + "?admin=1&locale=" + locale + "#/admin/create_from_idea?idea="
          + encodeURIComponent(ideaId + "?view=creativity_widget");
      case "CreativitySessionWidget":
        return base + "#/admin/create_from_idea?admin=1&locale=" + locale + "&idea="
          + encodeURIComponent(ideaId) + "&view=creativity_widget";
      default:
        log.error("widgetCollection.getCreationUrlForClass: wrong widget class");
    }
  },

  configurableWidgetsUris: function(context) {
   switch (context) {
    case widgetModel.DISCUSSION_MENU_CONFIGURE_CTX:
      return [this.getCreationUrlForClass("InspirationWidget")];
    case widgetModel.IDEA_PANEL_CONFIGURE_CTX:
      return [
        this.getCreationUrlForClass("CreativitySessionWidget"),
        this.getCreationUrlForClass("MultiCriterionVotingWidget"),
        this.getCreationUrlForClass("InspirationWidget")];
    default:
        log.error("widgetCollection.configurableWidgetsUris: wrong context");
   }
  },

  relevantUrlsFor: function(idea, context) {
    // Also give strings...
    var widgets = this.relevantWidgetsFor(idea, context),
        ideaId = idea.getId();
    switch (context) {
      case widgetModel.MESSAGE_LIST_INSPIREME_CTX:
        return _.map(widgets, function(w) {
          return w.getUrlForUser(ideaId); });
      case widgetModel.IDEA_PANEL_ACCESS_CTX:
        return _.map(widgets, function(w) {
          return w.getUrlForUser(ideaId); });
      case widgetModel.IDEA_PANEL_CONFIGURE_CTX:
        return _.map(widgets, function(w) {
          return w.getConfigurationUrl(ideaId); });
      case widgetModel.DISCUSSION_MENU_CONFIGURE_CTX:
        return _.map(widgets, function(w) {
          return w.getConfigurationUrl(ideaId); });
      case widgetModel.VOTE_PANEL_ACTIVE_CTX:
        return _.map(widgets, function(w) {
          return w.getUrlForUser(ideaId); });
      case widgetModel.VOTE_PANEL_ENDED_CTX:
        return _.map(widgets, function(w) {
          return w.getUrlForUser(ideaId); });
      default:
        log.error("Widget.isRelevantFor: wrong context");
    }
  }
});

var activeWidgetCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl("/active_widgets"),
  model: widgetModel
});

module.exports = {
  Model: widgetModel,
  Collection: widgetCollection,
  activeWidgetCollection: activeWidgetCollection
};
