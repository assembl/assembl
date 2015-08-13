"use strict";

var Backbone = require("../shims/backbone.js"),
    Marionette = require("../shims/marionette.js"),
    _ = require("../shims/underscore.js"),
    Widget = require("../models/widget.js");


var WidgetLinkView = Marionette.ItemView.extend({
  template: "#tmpl-widgetLink",
  initialize: function(options) {
    this.options = options;
  },
  ui: {
    anchor: ".js_widgetLinkAnchor"
  },
  events: {
    "click @ui.anchor": "onAnchorClick"
  },
  onAnchorClick: function(evt) {
    var that = this;

    var onDestroyCallback = function() {
      setTimeout(function() {
        that.clearWidgetDataAssociatedToIdea();
        that.render();
      }, 0);
    };

    var options = {
      footer: false
    };

    if (evt && evt.currentTarget && $(evt.currentTarget).hasClass(
        "js_clearWidgetDataAssociatedToIdea")) {
      return Ctx.openTargetInModal(evt, onDestroyCallback, options);
    } else {
      return Ctx.openTargetInModal(evt, null, options);
    }
  },
  serializeData: function() {
    return {
      link: this.model.getUrl(this.options.context, this.options.idea.getId()),
      text: this.model.getLinkText(this.options.context, this.options.idea)
    };
  }
});

var WidgetLinkListView = Marionette.CollectionView.extend({
  childView: WidgetLinkView,
  tagName: "ul",

  initialize: function(options) {
    this.childViewOptions = {
      context: options.collection.context,
      idea: options.collection.idea
    };
  }
});


var WidgetLinkSubset = Backbone.Subset.extend({
  beforeInitialize: function(models, options) {
    this.context = options.context;
    this.idea = options.idea;
    this.widgets = options.parent.relevantWidgetsFor(options.idea, options.context);
  },

  sieve: function(widget) {
    return _.contains(this.widgets, widget);
  }
});

module.exports = {
  WidgetLinkView: WidgetLinkView,
  WidgetLinkListView: WidgetLinkListView,
  WidgetLinkSubset: WidgetLinkSubset
};
