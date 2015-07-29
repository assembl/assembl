'use strict';

var Base = require("./base.js"),
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
     
  }

});

var widgetCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl("/widgets"),
  model: widgetModel
});

var activeWidgetCollection = Base.Collection.extend({
  url: Ctx.getApiV2DiscussionUrl("/active_widgets"),
  model: widgetModel
});

module.exports = {
  Model: widgetModel,
  Collection: activeWidgetCollection
};
