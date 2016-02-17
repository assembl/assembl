'use strict';

var _ = require('../../shims/underscore.js'),
    $ = require('../../shims/jquery.js'),
    Promise = require('bluebird'),
    Marionette = require('../../shims/marionette.js'),
    Ctx = require('../../common/context.js'),
    Permissions = require('../../utils/permissions.js');

var SimpleLinkView = Marionette.ItemView.extend({
  constructor: function SimpleLinkView() {
    Marionette.ItemView.apply(this, arguments);
  },

  template: '#tmpl-simpleLink',
  initialize: function(options) {
    this.groupContent = options.groupContent;
  },
  ui: {
    'links': '.externalvizlink'
  },
  events: {
    'click @ui.links': 'linkClicked'
  },
  linkClicked: function(a) {
    var content = this.groupContent;
    Ctx.deanonymizationCifInUrl(this.model.get('url'), function(url) {
        content.NavigationResetVisualizationState(url);
    });
  }
}),
LinkListView = Marionette.CollectionView.extend({
  constructor: function LinkListView() {
    Marionette.CollectionView.apply(this, arguments);
  },

  childView: SimpleLinkView,
  initialize: function(options) {
    this.collection = options.collection;
    this.groupContent = options.groupContent;
    this.childViewOptions = {
      'groupContent': options.groupContent
    };
  }
});

module.exports = LinkListView;
