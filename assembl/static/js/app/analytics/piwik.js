'use strict';

var _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
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
        this.engine.push([methodName].concat(args));
      }
      else {
        if(this.engine[methodName] === undefined) {
          throw new Error('Method ' + methodName + ' does not exist');
        }
        this.engine[methodName].apply(this, args);
      }
    }
  },

  commit: function(){
    this._invoke('changeCurrentPage');
  },

  initialize: function(options){
    this.engine = options.engine;
    this.userId = options.userId;
    if (_.isFunction(this.engine['push'])) {
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
  }, 
  trackEvent: function(eventName, options){
    var category = options.category,
        action = options.action,
        value = options.value || null;

    this._invoke('trackEvent', [category, action, eventName, value]);
  },

  trackGoal: function(goalId, options){
    var customRevenue = options.customRevenue || null;
    this._invoke('trackGoal', [goalId, customRevenue]);
  },

  changeCurrentPage: function(page, options){
    this._invoke('setCustomUrl', [page]);
    this._invoke('trackPageView');
  }
});

module.exports = Piwik;
