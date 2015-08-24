'use strict';

var _ = require('../shims/underscore.js'),
    Backbone = require("../shims/backbone.js"),
    Base = require("./base.js"),
    i18n = require('../utils/i18n.js'),
    Moment = require('moment'),
    Permissions = require('../utils/permissions.js'),
    Ctx = require("../common/context.js");

var WidgetModel = Base.Model.extend({
  urlRoot: Ctx.getApiV2DiscussionUrl("/widgets"),

  defaults: {
    "base_idea": null,
    "start_date": null,
    "end_date": null,
    "activity_state": "active",
    "discussion": null,
    "settings": null,
    "ui_endpoint": null,
    "vote_specifications": null,
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
  IDEA_PANEL_CREATE_CTX: 4,
  DISCUSSION_MENU_CONFIGURE_CTX: 5,
  DISCUSSION_MENU_CREATE_CTX: 6,
  VOTE_REPORTS: 7,
  TABLE_OF_IDEA_MARKERS: 8,
  INFO_BAR: 9,
  UNTIL_TEXT: 10,

  isRelevantForLink: function(linkType, context, idea) {
    return false;
  },

  findLink: function(idea) {
    var id = this.getId(),
        links = idea.get("widget_links");
    links = _.filter(links, function(link) {
      return link.widget == id;
    });
    if (links.length > 0) {
      return links[0]["@type"];
    }
  },

  isRelevantFor: function(context, idea) {
    if (idea === null) {
      return this.isRelevantForLink(null, context, null);
    }
    var that = this, id=this.getId(),
        widgetLinks = idea.get("widget_links", []);
    widgetLinks = _.filter(widgetLinks, function(link) {
      return link.widget == id &&
             that.isRelevantForLink(link["@type"], context, idea);
    });
    return widgetLinks.length > 0;
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
        console.error("Widget.getBaseUriFor: wrong type");
    }
  },

  getCreationUrl: function(ideaId, locale) {
    console.error("Widget.getCreationUrl: wrong type");
  },

  getConfigurationUrl: function(targetIdeaId) {
    console.error("Widget.getConfigurationUrl: unknown type");
  },

  getUrlForUser: function(targetIdeaId, page) {
    // Is it the same as widget.get("ui_endpoint")?
    console.error("Widget.getUrlForUser: wrong type");
  },

  getCssClasses: function(context, idea) {
    return "";
  },

  getLinkText: function(context, idea) {
    return "";
  },

  getDescriptionText: function(context, idea) {
    return "";
  },

  getUrl: function(context, targetIdeaId, page) {
    switch (context) {
      case this.DISCUSSION_MENU_CREATE_CTX:
      case this.IDEA_PANEL_CREATE_CTX:
        return this.getCreationUrl(targetIdeaId);
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        return this.getConfigurationUrl(targetIdeaId);
      case this.MESSAGE_LIST_INSPIREME_CTX:
      case this.IDEA_PANEL_ACCESS_CTX:
      case this.VOTE_REPORTS:
      case this.INFO_BAR:
        return this.getUrlForUser(targetIdeaId);
      case this.TABLE_OF_IDEA_MARKERS:
      default:
        console.error("Widget.getUrlForUser: wrong context");
    }
  }
});

var VotingWidgetModel = WidgetModel.extend({
  baseUri: "/static/widget/vote/",
  defaults: {
    '@type': 'MultiCriterionVotingWidget'
  },

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
        base = this.baseUri + "?config=" + encodeURIComponent(uri)
          + "&locale=" + locale;
    if (activityState == "ended") {
      base += "#/results"; // was "&page=results";
    }
    return base;
  },

  getLinkText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state"),
        endDate = this.get("end_date");
    switch (context) {
      case this.IDEA_PANEL_CREATE_CTX:
        return i18n.gettext("Create a voting session on this idea");
      case this.INFO_BAR:
        return i18n.gettext("Vote");
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (activityState) {
          case "active":
            var voteSpecs = this.get("vote_specifications");
            var voteCounts = _.map(voteSpecs, function(vs) {
              return (vs.my_votes || []).length;
            });
            var minVoteCount = _.min(voteCounts);
            var maxVoteCount = _.max(voteCounts);
            if (maxVoteCount == 0) {
              return i18n.gettext("Vote");
            } else if (minVoteCount == this.get("votable_ideas", []).length) {
              return i18n.gettext("Modify your vote");
            } else {
              return i18n.gettext("Complete your vote");
            }
          case "ended":
            return i18n.gettext("See the vote results");
        }
      case this.IDEA_PANEL_CONFIGURE_CTX:
          return i18n.gettext("Configure this vote widget");
      case this.VOTE_REPORTS:
          if (activityState == "ended") {
            return i18n.gettext("See results from the vote of ") + Moment(endDate).fromNow();
          }
    }
    return "";
  },

  getCssClasses: function(context, idea) {
    switch (context) {
      case this.INFO_BAR:
        return "js_openVote";
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (this.get("activity_state")) {
          case "active":
            return "btn-primary";
          case "ended":
            return "btn-secondary";
        }
    }
    return "";
  },

  getDescriptionText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state"),
        endDate = this.get("end_date");
    switch (context) {
      case this.INFO_BAR:
        var message = i18n.gettext("A vote session is ongoing.");
        if (endDate) {
          message += " " + this.getDescriptionText(this.UNTIL_TEXT, idea);
        }
        return message;
      case this.IDEA_PANEL_ACCESS_CTX:
        var link = this.findLink(idea) || "";
        switch (link + "_" + activityState) {
          case "VotedIdeaWidgetLink_active":
          case "VotableIdeaWidgetLink_active":
            return i18n.sprintf(i18n.gettext("The option “%s” is being considered in a vote"), idea.get('shortTitle'));
          case "VotedIdeaWidgetLink_ended":
          case "VotableIdeaWidgetLink_ended":
            return i18n.sprintf(i18n.gettext("The option “%s” was considered in a vote"), idea.get('shortTitle'));
          case "BaseIdeaWidgetLink_active":
            return i18n.gettext("A voting session is ongoing on this issue");
          case "BaseIdeaWidgetLink_ended":
            return i18n.gettext("A voting session has happened on this issue");
          case "VotingCriterionWidgetLink_active":
            return i18n.sprintf(i18n.gettext("“%s” is being used as a criterion in a vote"), idea.get('shortTitle'));
          case "VotingCriterionWidgetLink_ended":
            return i18n.sprintf(i18n.gettext("“%s” was used as a criterion in a vote"), idea.get('shortTitle'));
        }
        break;
      case this.UNTIL_TEXT:
        switch ( activityState ){
          case "ended":
            return "";
            break;
          default:
            if (endDate) {
              return i18n.sprintf(i18n.gettext("You have %s to vote"), Moment(endDate).fromNow(true));
            }
        }
        break;
    }
    return "";
  },

  isRelevantForLink: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    var activityState = this.get("activity_state"),
        currentUser = Ctx.getCurrentUser();
    switch (context) {
      case this.INFO_BAR:
        return (activityState === "active" && !this.get("closeInfobar")
          && this.get("settings", {}).show_infobar !== false
          && currentUser.can(Permissions.VOTE));
      case this.IDEA_PANEL_ACCESS_CTX:
        // assume non-root idea, relevant widget type
        return (activityState == "ended"
            || currentUser.can(Permissions.VOTE));
      case this.IDEA_PANEL_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        // Should we add config on votable?
        return linkType === "BaseIdeaWidgetLink";
      case this.VOTE_REPORTS:
        return (activityState === "ended");
      case this.TABLE_OF_IDEA_MARKERS:
        return (linkType === "BaseIdeaWidgetLink"
            && activityState === "active"
            && currentUser.can(Permissions.VOTE));
      default:
        return false;
    }
  }
});

var CreativitySessionWidgetModel = WidgetModel.extend({
  baseUri: "/static/widget/session/",
  defaults: {
    '@type': 'CreativitySessionWidget'
  },

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
    targetIdeaId = targetIdeaId || self.get("base_idea", {})["@id"];
    return base + "?locale=" + locale + "#/home?config=" + encodeURIComponent(uri)
      + "&target="+encodeURIComponent(targetIdeaId);
  },

  getLinkText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_CREATE_CTX:
        return i18n.gettext('Create a creativity session on this idea');
      case this.INFO_BAR:
        return i18n.gettext("Participate");
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        return i18n.gettext("Configure the creativity session on this idea");
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (activityState) {
          case "active":
            return i18n.gettext("Participate");
          case "ended":
            return i18n.gettext("Review the session");
        }
    }
    return "";
  },

  getCssClasses: function(context, idea) {
    switch (context) {
      case this.INFO_BAR:
        return "js_openTargetInModal";
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (this.get("activity_state")) {
          case "active":
            return "btn-primary";
          case "ended":
            return "btn-secondary";
        }
    }
    return "";
  },

  getDescriptionText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state"),
        endDate = this.get("end_date");
    switch (context) {
      case this.INFO_BAR:
        var message = i18n.gettext("A creativity session is ongoing.");
        if (endDate) {
          message += " " + this.getDescriptionText(this.UNTIL_TEXT, idea);
        }
        return message;
      case this.IDEA_PANEL_ACCESS_CTX:
        switch (activityState) {
          case "active":
            return i18n.gettext("A creativity session is ongoing on this issue");
          case "ended":
            return i18n.gettext("A creativity session has happened on this issue");
        }
      case this.UNTIL_TEXT:
        if (endDate) {
          return i18n.sprintf(i18n.gettext("You have %s to participate"), Moment(endDate).fromNow(true));
        }
    }
    return "";
  },

  isRelevantForLink: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    var activityState = this.get("activity_state"),
        currentUser = Ctx.getCurrentUser();
    switch (context) {
      case this.INFO_BAR:
        return (activityState === "active" && !this.get("closeInfobar")
          && this.get("settings", {}).show_infobar !== false
          && currentUser.can(Permissions.ADD_POST));
      case this.IDEA_PANEL_CONFIGURE_CTX:
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume non-root idea, relevant widget type
        return (linkType === "IdeaCreativitySessionWidgetLink");
      case this.IDEA_PANEL_ACCESS_CTX:
      case this.TABLE_OF_IDEA_MARKERS:
        return (linkType == "IdeaCreativitySessionWidgetLink"
            && activityState === "active"
            && currentUser.can(Permissions.ADD_POST));
      default:
        return false;
    }
  }
});

var InspirationWidgetModel = WidgetModel.extend({
  baseUri: "/static/widget/creativity/",
  defaults: {
    '@type': 'InspirationWidget'
  },

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
    var id = this.getId(), locale = Ctx.getLocale(),
        url = this.baseUri + "?config=" + encodeURIComponent(Ctx.getUrlFromUri(id)) + "&locale=" + locale;
    if (targetIdeaId !== undefined) {
      url += "&target=" + encodeURIComponent(targetIdeaId);
    }
    return url;
  },

  getLinkText: function(context, idea) {
    var locale = Ctx.getLocale(),
        activityState = this.get("activity_state");
    switch (context) {
      case this.IDEA_PANEL_CREATE_CTX:
        return i18n.gettext("Create an inspiration module on this idea");
      case this.DISCUSSION_MENU_CREATE_CTX:
        return i18n.gettext("Create an inspiration module on this discussion");
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        return i18n.gettext("Configure the inspiration module associated to the discussion");
      case this.IDEA_PANEL_CONFIGURE_CTX:
        return i18n.gettext("Configure the inspiration module associated to this idea");
      case this.IDEA_PANEL_ACCESS_CTX:
        return i18n.gettext("I need inspiration");
    }
    return "";
  },

  isRelevantForLink: function(linkType, context, idea) {
    // TODO: This should depend on widget configuration.
    // Put in subclasses?
    var activityState = this.get("activity_state");
    switch (context) {
      case this.MESSAGE_LIST_INSPIREME_CTX:
        return (activityState === "active");
      case this.DISCUSSION_MENU_CONFIGURE_CTX:
        // assume root idea
        return (linkType === "IdeaInspireMeWidgetLink");
      default:
        return false;
    }
  }
});


var localWidgetClassCollection = new Base.Collection([
    new VotingWidgetModel(), new CreativitySessionWidgetModel(), new InspirationWidgetModel()
  ]);

var globalWidgetClassCollection = new Base.Collection([
    new InspirationWidgetModel()
  ]);

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
        console.error("Unknown widget type:" + attrs["@type"]);
        return new WidgetModel(attrs, options);
    }
  },

  relevantWidgetsFor: function(idea, context) {
      return this.filter(function(widget) {
        return widget.isRelevantFor(context, null);
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
        console.error("WidgetCollection.getCreationUrlForClass: wrong widget class");
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
        console.error("WidgetCollection.configurableWidgetsUris: wrong context");
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


/**
 * @class WidgetSubset
 *
 * A subset of the widgets relevant to a widget context
 */
var WidgetSubset = Backbone.Subset.extend({
  beforeInitialize: function(models, options) {
    this.context = options.context;
    this.idea = options.idea;
    this.liveupdate_keys = options.liveupdate_keys;
  },

  sieve: function(widget) {
    return widget.isRelevantFor(this.context, this.idea);
  },

  comparator: function(widget) {
    return widget.get("end_date");
  }
});


module.exports = {
  Model: WidgetModel,
  Collection: WidgetCollection,
  WidgetSubset: WidgetSubset,
  localWidgetClassCollection: localWidgetClassCollection,
  globalWidgetClassCollection: globalWidgetClassCollection,
  ActiveWidgetCollection: ActiveWidgetCollection
};
