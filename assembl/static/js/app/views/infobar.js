'use strict';

var Marionette = require('../shims/marionette.js'),
    Assembl = require('../app.js'),
    i18n = require("../utils/i18n.js"),
    Moment = require('moment'),
    CollectionManager = require('../common/collectionManager.js'),
    $ = require('../shims/jquery.js');


var InfobarItem = Marionette.LayoutView.extend({
  template: '#tmpl-infobar',
  className: 'content-infobar',
  events: {
    'click .js_closeInfobar': 'closeInfobar',
    'click .js_openSession': 'openSession',
    'click .js_openTargetInModal': 'openTargetInModal',
    'click .js_openVote': 'openVote'
  },

  openTargetInModal: function(evt){
    return Ctx.openTargetInModal(evt);
  },

  openVote: function(evt){
    // TODO
  },

  serializeModel: function(model) {
    var n = model.get("activity_notification"),
        widgetEndpoint = n.widget_endpoint;
    if (n.base_idea) {
      widgetEndpoint = widgetEndpoint + "&target=" + n.base_idea;
    }
    if (n.end_date) {
      n.end_date_moment = Moment(n.end_date).fromNow();
    } else {
      n.end_date_moment = '';
    }

    return {
      message: i18n.sprintf(i18n.gettext(n.message), n),
      call_to_action_msg: i18n.sprintf(i18n.gettext(n.call_to_action_msg), n),
      widget_endpoint: widgetEndpoint,
      call_to_action_class: n.call_to_action_class,
    };
  },

  closeInfobar: function() {
    this.model.set("closeInfobar", true);
    Assembl.vent.trigger('infobar:closeItem');
    //this.options.parentPanel.adjustInfobarSize();
  }
});

var WidgetWithBroadcastSubset = Backbone.Subset.extend({
  sieve: function(widget) {
    return widget.get("activity_notification") != null && !widget.get("closeInfobar");
  },
  comparator: function(widget) {
    return widget.get("end_date");
  },
  liveupdate_keys: ["closeInfobar"]
});

var Infobars = Marionette.CollectionView.extend({
  childView: InfobarItem,
  initialize: function(options) {
    this.childViewOptions = {
      parentPanel: this
    };
    this.adjustInfobarSize();
  },
  collectionEvents: {
    "add remove reset change": "adjustInfobarSize"
  },
  adjustInfobarSize: function() {
    var el = Assembl.groupContainer.$el;
    var n = this.collection.length;

    for (var i = 1; i < 6; i++) {
      if (i === n) {
        el.addClass("hasInfobar-" + String(i));
      } else {
        el.removeClass("hasInfobar-" + String(i));
      }
    }
  }
}, {
  // static methods
  getCollectionPromise: function() {
    var collectionManager = new CollectionManager();
    return collectionManager.getAllActiveWidgetsPromise().then(function(widgets) {
      // TODO: Convert widgets into Infobar items, and use that as model.
      return new WidgetWithBroadcastSubset([], {
        parent: widgets});
    });
//    return subCollection;
  }
});


module.exports = Infobars;
