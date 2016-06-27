'use strict';
/**
 * 
 * @module app.views.breadcrumb
 */

var Marionette = require('../shims/marionette.js'),
  $ = require('jquery'),
  _ = require('underscore'),
  CollectionManager = require('../common/collectionManager.js');

/**
 * Generic Breadcrumb ItemView.
 * Must pass a serializer function in order to correctly show the content
 * If not, the passed model will be displayed
 *
 * @param {function} options.serializerFunc  The serializer function taking the passed model and returning a template string
 */
var BreadcrumbItemView = Marionette.ItemView.extend({
  constructor: function BreadcrumbItemView() {
    Marionette.ItemView.apply(this, arguments);
  },

// from http://jsfiddle.net/zaSvT/
  
  initialize: function(options){
    this.serializerFunc = options.serializerFunc;
  },

  renderData: function(serialzedModel){
    if (!serialzedModel) { return ""; }

    if (this.serializerFunc) {
      return this.serializerFunc(serialzedModel);
    }

    else {
      return serialzedModel;
    }
  },

  template: _.template("<%= entity %>"),

  serializeData: function(){
    return {
      entity: this.renderData(this.model)
    }
  },
  
  className: 'breadcrumb'
});

var BreadcrumbCollectionView = Marionette.CollectionView.extend({
  constructor: function BreadcrumbCollectionView() {
    Marionette.CollectionView.apply(this, arguments);
  },

  
  initialize: function(options){
    this.serializerFunc = options.serializerFunc || null;
    this.listenTo(this.collection, 'change', this.render );
    // this.render();
  },

  childView: BreadcrumbItemView,

  childViewOptions: function(){
    return {
      serializerFunc: this.serializerFunc
    }
  }
});

module.exports = {
  BreadcrumbItemView: BreadcrumbItemView,
  BreadcrumbCollectionView: BreadcrumbCollectionView
};
