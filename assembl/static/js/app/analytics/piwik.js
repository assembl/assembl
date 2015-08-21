'use strict';

var _ = require('../shims/underscore.js'),
    Wrapper = require('./abstract.js');

var Piwik = function(){
  Wrapper.call(this, arguments);
}

Piwik.prototype = Object.create(Wrapper.prototype);
Piwik.prototype.constructor = Piwik;
_.extend(Piwik.prototype, {
  _invoke: function(methodName, args){
    if(this.debug) {
      console.log("Piwik: About to invoke " + methodName + " with args:", args);
    }
    if (typeof methodName !== 'string') {
      throw new Error('The function name was not of type string');
    }
    else {
      if (this.usePaq) {
        _paq.push([methodName].concat(args));
      }
      else {
        if(_paq[methodName] === undefined) {
          throw new Error('Method ' + methodName + ' does not exist');
        }
        _paq[methodName].apply(this, args);
      }
    }
  },

  initialize: function(options){
    this.userId = options.userId;
    this.customVariableSize = options.piwik_customVariableSize;
    this.customVariables = {};
    if (_.isFunction(_paq['push'])) {
      this.usePaq = true;
    }
    else {
      this.usePaq = false;
    }
  },

  setUserId: function(userId){
    if (userId) {
      this._invoke('setUserId', [userId]);
    }
    else {
      throw new Error('Cannot set user ID without an actual ID');
    }
  }, 
  
  trackEvent: function(eventDefinition, value, options){
    this._invoke('trackEvent', [eventDefinition.category, eventDefinition.action, eventDefinition.eventName, value]);
  },

  trackGoal: function(goalId, options){
    var customRevenue = options.customRevenue || null;
    this._invoke('trackGoal', [goalId, customRevenue]);
  },

  changeCurrentPage: function(page, options){
    this._invoke('setCustomUrl', [page]);
    this._invoke('trackPageView');
  },

  setCustomVariable: function(name, value, options){
    var scope = options.scope,
        index = options.index;
    this._invoke('setCustomVariable', [index, name, value, scope]);
  },

  //For debug use ONLY
  commit: function(){
    this._invoke('trackPageView');
  },

  //Very thin wrappers here.  
  //http://developer.piwik.org/guides/content-tracking
  trackImpression: function(contentName, contentPiece, contentTarget) {
    this._invoke('trackContentImpression', [contentName, contentPiece, contentTarget]);
  },

  trackVisibleImpression: function(checkOnScroll, timeInterval){
    this._invoke('trackVisibleContentImpressions', [checkOnScroll, timeInterval]);
  },

  trackDomNodeImpression: function(domNode){
    this._invoke('trackContentImpressionsWithinNode', [domNode]);
  },

  trackContentInteraction: function(interaction, contentName, contentPiece, contentTarget){
    this._invoke('trackContentInteraction', [interaction, contentName, contentPiece, contentTarget]);
  },

  trackDomNodeInteraction: function(domNode, contentInteraction){
    this._invoke('trackContentInteractionNode', [domNode, contentInteraction]);
  }
});

module.exports = Piwik;
