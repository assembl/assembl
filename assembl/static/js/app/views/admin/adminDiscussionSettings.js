"use strict";

var Marionette = require('../../shims/marionette.js'),
    i18n = require('../../utils/i18n.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Sources = require('../../models/sources.js'),
    SourceView = require('./generalSource.js'),
    AdminNavigationMenu = require('./adminNavigationMenu.js');

var AdminDiscussionSettings = Marionette.LayoutView.extend({
  template: '#tmpl-adminDiscussionSettings',
  className: 'admin-settings',
  ui: {
    addSource: '.js_addSource'
  },
  events: {
    'click @ui.addSource': 'addFakeFacebookSource'
  },
  regions: {
    sources: "#sources-content",
    createSource: "#create-source",
    navigationMenuHolder: '.navigation-menu-holder'
  },
  onBeforeShow: function() {
    var that = this,
        collectionManager = new CollectionManager();

    collectionManager.getDiscussionSourceCollectionPromise2()
      .then(function(discussionSource) {
        that.collection = discussionSource;
        var discussionSourceList = new SourceView.DiscussionSourceList({
          collection: discussionSource
        });
        that.getRegion('sources').show(discussionSourceList);
      });
    
    this.getRegion('createSource').show(new SourceView.CreateSource());

    var menu = new AdminNavigationMenu({selectedSection: "settings"});
    this.getRegion('navigationMenuHolder').show(menu);
  },

  addFakeFacebookSource: function(evt){
    evt.preventDefault();

    //Mock facebook view
    // this.collection.add(new Sources.Model.Facebook({
    //   '@type': 'FacebookSinglePostSource',
      
    //   name: 'Benoit!'
    // }));
  }
});

module.exports = AdminDiscussionSettings;
