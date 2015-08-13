'use strict';

var Base = require("./base.js"),
    _ = require('../shims/underscore.js'),
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

  getConfigurationUrl: function(targetIdea) {
    log.error("Widget.getConfigurationUrl: unknown type");
  },

  getCreationUrl: function(ideaId, locale) {
    log.error("Widget.getCreationUrl: wrong type");
  },

  getUrlForUser: function(targetIdea, page) {
      log.error("Widget.getUrlForUser: wrong type");
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

  getConfigurationUrl: function(targetIdea) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    base = base + "?admin=1#/admin/configure_instance?widget_uri=" + uri;
    if (targetIdea) {
      base += "&target=" + encodeURIComponent(targetIdea);
    }
    return base;
  },

  getUrlForUser: function(targetIdea, page) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    base = base + "?config=" + uri + "&locale=" + locale;
    if (targetIdea !== undefined) {
      base += encodeURIComponent("?target=" + targetIdea);
    }
    return base;
  },

  isRelevantFor: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    var activity_state = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_ACCESS_CTX:
        // assume non-root idea, relevant widget type
        return (linkType === "VotableIdeaWidgetLink"
             && activity_state === "active");
      case this.IDEA_PANEL_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        // Should we add config on votable?
        return linkType === "BaseIdeaWidgetLink";
      case this.VOTE_REPORTS:
        return (activity_state === "ended");
      case this.TABLE_OF_IDEA_MARKERS:
        return (linkType == "BaseIdeaWidgetLink"
            && activity_state === "active");
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

  getConfigurationUrl: function(targetIdea) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    return base + "?locale=" + locale + "#/home?admin=1&config=" + uri;
  },

  getUrlForUser: function(targetIdea, page) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    return base + "?locale=" + locale + "#/home?config=" + uri;
  },

  isRelevantFor: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    var activity_state = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        return (linkType === "IdeaCreativitySessionWidgetLink");
      case this.IDEA_PANEL_ACCESS_CTX:
      case this.TABLE_OF_IDEA_MARKERS:
        return (linkType == "IdeaCreativitySessionWidgetLink"
            && activity_state === "active");
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

  getConfigurationUrl: function(targetIdea) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    base = base + "?admin=1&locale=" + locale
        + "#/admin/configure_instance?widget_uri=" + Ctx.getUrlFromUri(uri);
    if (targetIdea) {
      base += "&target=" + encodeURIComponent(targetIdea);
    }
    return base;
  },

  getUrlForUser: function(targetIdea, page) {
    var base = this.baseUri, uri = this.getId(), locale = Ctx.getLocale();
    return base + "?config=" + Ctx.getUrlFromUri(uri)
      + "&target=" + encodeURIComponent(targetIdea)
      + "&locale=" + locale;
  },

  isRelevantFor: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    // Put in subclasses?
    var activity_state = this.get("activity_state");
    switch (context) {
      case this.MESSAGE_LIST_INSPIREME_CTX:
        return (activity_state === "active");
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
    switch (context) {
      case WidgetModel.MESSAGE_LIST_INSPIREME_CTX:
        return _.map(widgets, function(w) {
          return w.getUrlForUser(ideaId); });
      case WidgetModel.IDEA_PANEL_ACCESS_CTX:
        return _.map(widgets, function(w) {
          return w.getUrlForUser(ideaId); });
      case WidgetModel.IDEA_PANEL_CONFIGURE_CTX:
        return _.map(widgets, function(w) {
          return w.getConfigurationUrl(ideaId); });
      case WidgetModel.DISCUSSION_MENU_CONFIGURE_CTX:
        return _.map(widgets, function(w) {
          return w.getConfigurationUrl(ideaId); });
      case WidgetModel.VOTE_PANEL_ACTIVE_CTX:
        return _.map(widgets, function(w) {
          return w.getUrlForUser(ideaId); });
      case WidgetModel.VOTE_PANEL_ENDED_CTX:
        return _.map(widgets, function(w) {
          return w.getUrlForUser(ideaId); });
      default:
        log.error("Widget.isRelevantFor: wrong context");
    }
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
