'use strict';
/**
 * 
 * @module app.internal_modules.analytics.piwik
 */

// UMD style module defintion. Simplified details below. Read comments to understand dependencies
var moduleName = 'Analytics_Piwik',
    dependencies = ['underscore', 'abstract'];

(function(root, factory){
  if (typeof define === 'function' && define.amd){
    // AMD. Register as an anonymous module.
    define(dependencies, function(_, Wrapper){ //Update list of args. eg. function($, _, someModule) 
      return (root[moduleName] = factory(_, Wrapper)); 
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node-like environments. Not strict CommonJS but CommonJS-like env.
    // Update arguments here by adding require('dependency') as paramter to factory().
    // eg. module.exports = factory(require('jquery'));
    module.exports = factory(require('underscore'), require('./abstract.js'));
  } else {
    // Browser global
    // Update arguments here by adding root.Dependecy as parameter to factory()
    // eg. root[moduleName] = factory(root.jquery);
    root[moduleName] = factory(root._, root.Analytics_Abstract);
  }
})(this, function(_, Wrapper) { //update args to factory here

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

    setCustomVariable: function(variableDefinition, value) {
      this._invoke('setCustomVariable', [variableDefinition.index, variableDefinition.name, value, 'visit']);
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

  return Piwik;

});
