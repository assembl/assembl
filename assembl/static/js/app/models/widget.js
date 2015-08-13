'use strict';

var Base = require("./base.js"),
    _ = require('../shims/underscore.js'),
    i18n = require('../utils/i18n.js'),
    Moment = require('moment'),
    Ctx = require("../common/context.js");

var WidgetModel = Base.Model.extend({
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
    return false;
  },

  getBaseUriFor: function(widgetType) {
    switch (widgetType) {
      case "CreativitySessionWidget":
        return CreativitySessionWidgetModel.prototype.baseUri;
      case "MultiCriterionVotingWidget":
        return VotingWidgetModel.prototype.baseUri;
      case "InspirationWidget":
        return InspirationWidgetModel.prototype.baseUri;
      default:
        log.error("Widget.getBaseUriFor: wrong type");
    }
  },

  getCreationUrl: function(ideaId, locale) {
    log.error("Widget.getCreationUrl: wrong type");
  },

  getConfigurationUrl: function(targetIdeaId) {
    log.error("Widget.getConfigurationUrl: unknown type");
  },

  getUrlForUser: function(targetIdeaId, page) {
    // Is it the same as widget.get("ui_endpoint")?
    log.error("Widget.getUrlForUser: wrong type");
  },

  getUrl: function(context, targetIdeaId, page) {
    switch (context) {
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        return this.getConfigurationUrl(targetIdeaId);
      case this.MESSAGE_LIST_INSPIREME_CTX:
      case this.IDEA_PANEL_ACCESS_CTX:
      case this.VOTE_REPORTS:
        return this.getUrlForUser(targetIdeaId);
      case this.TABLE_OF_IDEA_MARKERS:
      default:
        log.error("Widget.getUrlForUser: wrong context");
    }
  }
});

var VotingWidgetModel = WidgetModel.extend({
  baseUri: "/static/widget/vote/",

  getCreationUrl: function(ideaId, locale) {
    if (locale === undefined) {
      locale = Ctx.getLocale();
    }
    return this.baseUri + "?admin=1&locale=" + locale + "#/admin/create_from_idea?idea="
      + encodeURIComponent(ideaId + "?view=creativity_widget");
  },

  getConfigurationUrl: function(targetIdeaId) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    base = base + "?admin=1#/admin/configure_instance?widget_uri=" + uri;
    if (targetIdeaId) {
      base += "&target=" + encodeURIComponent(targetIdeaId);
    }
    return base;
  },

  getUrlForUser: function(targetIdeaId, page) {
    var uri = this.getId(), locale = Ctx.getLocale(),
        activityState = this.get("activity_state"),
        base = this.baseUri + "?config=" + uri + "&locale=" + locale;
    if (activityState == "ended") {
      base += "&page=results";
    }
    if (targetIdeaId !== undefined) {
      base += encodeURIComponent("?target=" + targetIdeaId);
    }
    return base;
  },

  getLinkText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (activityState) {
          case "active":
            return i18n.gettext("Vote on these ideas");
          case "ended":
            return i18n.gettext("See results from the vote of ") + Moment(this.get("end_date")).fromNow();
        }
      case this.IDEA_PANEL_CONFIGURE_CTX:
          return i18n.gettext("Configure this voting widget");
      case this.VOTE_REPORTS:
          if (activityState == "ended") {
            return i18n.gettext("See results from the vote of ") + Moment(this.get("end_date")).fromNow();
          }
    }
    return "";
  },

  isRelevantFor: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    var activityState = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_ACCESS_CTX:
        // assume non-root idea, relevant widget type
        return (linkType === "VotableIdeaWidgetLink"
             && activityState === "active");
      case this.IDEA_PANEL_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        // Should we add config on votable?
        return linkType === "BaseIdeaWidgetLink";
      case this.VOTE_REPORTS:
        return (activityState === "ended");
      case this.TABLE_OF_IDEA_MARKERS:
        return (linkType == "BaseIdeaWidgetLink"
            && activityState === "active");
      default:
        return false;
    }
  }
});

var CreativitySessionWidgetModel = WidgetModel.extend({
  baseUri: "/static/widget/session/",

  getCreationUrl: function(ideaId, locale) {
    if (locale === undefined) {
      locale = Ctx.getLocale();
    }
    return this.baseUri + "#/admin/create_from_idea?admin=1&locale=" + locale + "&idea="
      + encodeURIComponent(ideaId) + "&view=creativity_widget";
  },

  getConfigurationUrl: function(targetIdeaId) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    return base + "?locale=" + locale + "#/home?admin=1&config=" + uri;
  },

  getUrlForUser: function(targetIdeaId, page) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    return base + "?locale=" + locale + "#/home?config=" + uri;
  },

  getLinkText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        return i18n.gettext("Configure the creativity session");
      case this.IDEA_PANEL_ACCESS_CTX:
        return i18n.gettext("Access the creativity session");
    }
    return "";
  },

  isRelevantFor: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    var activityState = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        return (linkType === "IdeaCreativitySessionWidgetLink");
      case this.IDEA_PANEL_ACCESS_CTX:
      case this.TABLE_OF_IDEA_MARKERS:
        return (linkType == "IdeaCreativitySessionWidgetLink"
            && activityState === "active");
      default:
        return false;
    }
  }
});

var InspirationWidgetModel = WidgetModel.extend({
  baseUri: "/static/widget/creativity/",

  getCreationUrl: function(ideaId, locale) {
    if (locale === undefined) {
      locale = Ctx.getLocale();
    }
    return this.baseUri + "?admin=1&locale=" + locale + "#/admin/create_from_idea?idea="
      + encodeURIComponent(ideaId + "?view=creativity_widget");
  },

  getConfigurationUrl: function(targetIdeaId) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    base = base + "?admin=1&locale=" + locale
        + "#/admin/configure_instance?widget_uri=" + Ctx.getUrlFromUri(uri);
    if (targetIdeaId) {
      base += "&target=" + encodeURIComponent(targetIdeaId);
    }
    return base;
  },

  getUrlForUser: function(targetIdeaId, page) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    return base + "?config=" + Ctx.getUrlFromUri(uri)
      + "&target=" + encodeURIComponent(targetIdeaId)
      + "&locale=" + locale;
  },

  getLinkText: function(linkType, context, page) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        return i18n.gettext("Configure the Inspiration tool");
      case this.IDEA_PANEL_ACCESS_CTX:
        return i18n.gettext("I need inspiration");
    }
    return "";
  },

  isRelevantFor: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    // Put in subclasses?
    var activityState = this.get("activity_state");
    switch (context) {
      case this.MESSAGE_LIST_INSPIREME_CTX:
        return (activityState === "active");
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume root idea
        return (linkType === "BaseIdeaWidgetLink");
      default:
        return false;
    }
  }
});


var WidgetCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl("/widgets"),
  model: function(attrs, options) {
    switch (attrs["@type"]) {
      case "InspirationWidget":
        return new InspirationWidgetModel(attrs, options);
      case "MultiCriterionVotingWidget":
        return new VotingWidgetModel(attrs, options);
      case "CreativitySessionWidget":
        return new CreativitySessionWidgetModel(attrs, options);
      default:
        log.error("Unknown widget type:" + attrs["@type"]);
        return new WidgetModel(attrs, options);
    }
  },

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
    var base = WidgetModel.getBaseUriFor(cls);
    switch (cls) {
      case "InspirationWidget":
        return InspirationWidgetModel.getCreationUrl();
      case "MultiCriterionVotingWidget":
        return VotingWidgetModel.getCreationUrl();
      case "CreativitySessionWidget":
        return CreativitySessionWidgetModel.getCreationUrl();
      default:
        log.error("WidgetCollection.getCreationUrlForClass: wrong widget class");
    }
  },

  configurableWidgetsUris: function(context) {
   switch (context) {
    case WidgetModel.DISCUSSION_MENU_CONFIGURE_CTX:
      return [this.getCreationUrlForClass("InspirationWidget")];
    case WidgetModel.IDEA_PANEL_CONFIGURE_CTX:
      return [
        this.getCreationUrlForClass("CreativitySessionWidget"),
        this.getCreationUrlForClass("MultiCriterionVotingWidget"),
        this.getCreationUrlForClass("InspirationWidget")];
    default:
        log.error("WidgetCollection.configurableWidgetsUris: wrong context");
   }
  },

  relevantUrlsFor: function(idea, context) {
    // Also give strings...
    // Careful about permissions!
    var widgets = this.relevantWidgetsFor(idea, context),
        ideaId = idea.getId();
    return _.map(widgets, function(w) {
      return w.getUrl(context, ideaId); });
  }
});


var ActiveWidgetCollection = WidgetCollection.extend({
  url: Ctx.getApiV2DiscussionUrl("/active_widgets")
});

module.exports = {
  Model: WidgetModel,
  Collection: WidgetCollection,
  ActiveWidgetCollection: ActiveWidgetCollection
};
