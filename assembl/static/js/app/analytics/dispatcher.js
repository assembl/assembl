'use strict';

var _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Wrapper = require('./abstract.js'),
    Piwik = require('./piwik.js');


var AnalyticsDispatcher = function(){
  if(this.debug) {
    console.log("AnalyticsDispatcher constructor called");
  }
  Wrapper.call(this, arguments); 
  this._observers = [];
};

AnalyticsDispatcher.prototype = Object.create(Wrapper.prototype);
AnalyticsDispatcher.prototype.constructor = AnalyticsDispatcher;
_.extend(AnalyticsDispatcher.prototype, {

  registerObserver: function(observer) {
    this._observers.push(observer);
  },

  removeObserver: function(observer){
    delete this._observers.indexOf(observer); //empty slot
  },

  notify: function(methodName, args, check_cb){
    var that = this,
        check_cb = check_cb, 
        args = args;

    if(this.debug) {
      console.log("dispatching " + methodName + " on " + this._observers.length + " observer(s) with argument(s):", args);
    }

    _.each(this._observers, function(observer){
      if (check_cb !== undefined) {
        if (!check_cb(observer)) {
          return;
        }
      }
      if(observer.debug) {
        console.log('Invoking method ' + methodName + ' with argument(s)', args, 'on observer', observer);
      }
      if(observer[methodName]===undefined) {
        throw new Error('Method ' + methodName + ' does not exist');
      }
      observer[methodName].apply(observer, args);
    });
  },

  getObserver: function(index) {
    if (index >= 0 && index > (this._observers.length -1 )) {
      return this._observers[index]
    }
  },

  initialize: function(options){
    if(this.debug  && this._observers.length < 1) {
      console.warn("No observers registered for analytics");
    }
    this.notify('initialize', arguments);
  },

  changeCurrentPage: function(page, options) {
    if (!(page in this.pages)) {
      throw new Error("Unknown page definition");
    }
    this.notify('changeCurrentPage', arguments);
  },

  trackEvent: function(category, action, eventName, value, options) {
    if (!(eventName in this.events)) {
      throw new Exception("Unknown event type");
    }
    this.notify('trackEvent', arguments);
  },

  setCustomVariable: function(name, value, options){
    this.notify('setCustomVariable', arguments);
  },
 
  deleteCustomVariable: function(options){
    this.notify('deleteCustomVariable', arguments);
  },

  trackLink: function(urlPath, options){
    this.notify('trackEvent', arguments);
  },

  trackDomElement: function(element) {
    this.notify('trackDomElement', arguments);
  },

  trackGoal: function(goalId, options){
    this.notify('trackGoal', arguments, function(observer){
      // To add more checks for other Observer types, must update this check_cb
      if (observer.constructor.name === 'Piwik') {
        if (_.has(globalAnalytics.piwik.goals, goalId)){
          return true;
        }
        else { return false; }
      }
    });
  },

  createNewVisit: function(){
    this.notify('createNewVisit', []);
  },

  setUserId: function(id) {
    this.notify('setUserId', [id]);
  },

  //For debug use ONLY
  commit: function(options){
    if (options.piwik){
      this._observers[0].commit();
    }
  },

  /**
   * Either manually or automatically track content.
   * @param  {[type]} options Must include contentName,
   * contentPiece, contentTarget for base case.
   *
   * To track all content impressions, options must have:
   * { piwik_trackAll: true}
   *
   * To track visible content impressions, options must have:
   * {
   *   piwik_trackVisible: true,
   *   piwik_trackVisible_options: {
   *     checkOnScroll: true/false,
   *     timeInterval: 50 // in milliseconds
   *   }
   * }
 
   * @return {[type]}         null
   */
  trackContentImpression: function(options) {
    var trackAll = options.piwik_trackAll,
        trackVisible = options.piwik_trackVisible;

    console.log('Incomplete method!');
    
  },
  trackContentInteraction: function(interaction, contentName, contentPiece, contentTarget, options){
    throw new Error('Cannot call abstract method!');
  }
});

var _analytics;

module.exports = {
  /** A factory returning a completely setup singleton of a concrete analytics 
   * object.
   */
  getInstance: function(){
    if (!_analytics){
      _analytics = new AnalyticsDispatcher();
      if (_.has(window.globalAnalytics, 'piwik') && globalAnalytics.piwik.isActive) {
        if(_analytics.debug) {
          console.log("Registering piwik");
        }
        var p = new Piwik();
        _analytics.registerObserver(p);
      }
      else if (_.has(window.globalAnalytics, 'google') && globalAnalytics.google.isActive) {
        if(_analytics.debug) {
          console.log("Registering Google Analytics");
        }
        var g = null; //Where Google Analytics would go
        _analytics.registerObserver(g);
      }
      _analytics.initialize({
        engine: _paq,
        piwik_customVariableSize: globalAnalytics.piwik.customVariableSize
      });
    }
    return _analytics;
  }
}
