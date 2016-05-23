"use strict";

var Backbone = require("backbone"),
    Marionette = require("../shims/marionette.js"),
    _ = require("underscore"),
    i18n = require('../utils/i18n.js'),
    Moment = require('moment'),
    Widget = require("../models/widget.js"),
    Ctx = require('../common/context.js'),
    Permissions = require('../utils/permissions.js');


var WidgetButtonView = Marionette.ItemView.extend({
  constructor: function WidgetButtonView() {
    Marionette.ItemView.apply(this, arguments);
  },

  template: "#tmpl-widgetButton",
  initialize: function(options) {
    this.options = options;
  },
  ui: {
    button: ".btn",
  },
  events: {
    // "click @ui.button": "onButtonClick",
    'click .js_widget-vote': "onButtonClick",
    'click .js_widget-vote-result': "onResultButtonClick"
  },
  onButtonClick: function(evt) {
    console.log("WidgetButtonView::onButtonClick()");
    var context = this.options.context;
    var idea = this.options.idea;

    var openTargetInModalOnButtonClick = (this.model.getCssClasses(context, idea).indexOf("js_openTargetInModal") != -1);
    console.log("openTargetInModalOnButtonClick: ", openTargetInModalOnButtonClick);
    if ( openTargetInModalOnButtonClick !== false ) {
      var options = {
        footer: false
      };
      return Ctx.openTargetInModal(evt, null, options);
    }
    else {
      //Pass the event in case need to stop the default action of evt.
      this.model.trigger("buttonClick", evt);
    }
    return false;
  },
  onResultButtonClick: function(ev){
    console.log("triggering 'showResult' event on model", this.model);
    this.model.trigger('showResult', ev);
  },
  serializeData: function() {
    var endDate = this.model.get("end_date");
    
    return {
      link: this.model.getUrl(this.options.context, this.options.idea.getId()),
      button_text: this.model.getLinkText(this.options.context, this.options.idea),
      description: this.model.getDescriptionText(this.options.context, this.options.idea),
      classes: this.model.getCssClasses(this.options.context, this.options.idea),
      until_text: this.model.getDescriptionText(this.model.UNTIL_TEXT, this.options.idea),
      canSeeResults: Ctx.getCurrentUser().can(Permissions.SYSADMIN)
    };
  }
});

var WidgetButtonListView = Marionette.CollectionView.extend({
  constructor: function WidgetButtonListView() {
    Marionette.CollectionView.apply(this, arguments);
  },

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
