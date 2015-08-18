"use strict";

var Backbone = require("../shims/backbone.js"),
    Marionette = require("../shims/marionette.js"),
    _ = require("../shims/underscore.js"),
    i18n = require('../utils/i18n.js'),
    Widget = require("../models/widget.js");


var WidgetButtonView = Marionette.ItemView.extend({
  template: "#tmpl-widgetButton",
  initialize: function(options) {
    this.options = options;
  },
  ui: {
    button: ".btn"
  },
  events: {
    "click @ui.btn": "onButtonClick"
  },
  onButtonClick: function(evt) {
    var options = {
      footer: false
    };
    return Ctx.openTargetInModal(evt, null, options);
  },
  serializeData: function() {
    var endDate = this.model.get("end_date");
    
    return {
      link: this.model.getUrl(this.options.context, this.options.idea.getId()),
      button_text: this.model.getLinkText(this.options.context, this.options.idea),
      description: this.model.getDescriptionText(this.options.context, this.options.idea),
      classes: this.model.getCssClasses(this.options.context, this.options.idea),
      until_text: endDate?i18n.sprintf(i18n.gettext(
        "You have %s"), Moment(endDate).fromNow(true)):null
    };
  }
});

var WidgetButtonListView = Marionette.CollectionView.extend({
  childView: WidgetButtonView,

  initialize: function(options) {
    this.childViewOptions = {
      context: options.context || options.collection.context,
      idea: options.idea || options.collection.idea
    };
    if (this.childViewOptions.context === undefined) {
      console.error("Undefined context in WidgetButtonListView");
    }
  }
});


module.exports = {
  WidgetButtonView: WidgetButtonView,
  WidgetButtonListView: WidgetButtonListView
};
