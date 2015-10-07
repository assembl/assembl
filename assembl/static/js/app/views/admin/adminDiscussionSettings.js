"use strict";

var Marionette = require('../../shims/marionette.js'),
    i18n = require('../../utils/i18n.js'),
    CollectionManager = require('../../common/collectionManager.js'),
    Promise = require('bluebird'),
    Sources = require('../../models/sources.js'),
    SourceView = require('./generalSource.js');

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
    createSource: "#create-source"
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
