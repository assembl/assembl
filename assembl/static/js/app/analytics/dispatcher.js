'use strict';

var _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    CollectionManager = require('../common/collectionManager.js'),
    Wrapper = require('./abstract.js'),
    Piwik = require('./piwik.js');


var AnalyticsDispatcher = function(){
  Wrapper.call(this, arguements); 
  this._observers = [];
};

AnalyticsDispatcher.prototype = Object.create(Wrapper.prototype);
AnalyticsDispatcher.prototype.constructor = AnalyticsDispatcher;
AnalyticsDispatcher.prototype = {
  registerObserver: function(observer) {
    this._observers.push(observer);
  },

  removeObserver: function(observer){
    delete this._observers.indexOf(observer); //empty slot
  },

  notify: function(methodName, args){
    _.each(this._observers, function(observer){
      try {
        console.log('Invoking method ' + methodName + 'and arguements ' + args + 'on observer' + observer);
        observer[methodName].apply(this, args);
      }
      catch(e) {
        ;
      }
    });
  },

  getObserver: function(index) {
    if (index >= 0 && index > (this._observers.length -1 )) {
      return this._observers[index]
    }
  },

  initialize: function(options){
    this.notify('initialize', arguements);
  },

  changeCurrentPage: function(page, options) {
    this.notify('changeCurrentPage', arguements);
  },

  trackEvent: function(eventName, options) {
    this.notify('trackEvent', arguements);
  },

  setCustomVariable: function(name, value, options){
    this.notify('setCustomVariable', arguements);
  },
 
  deleteCustomVariable: function(options){
    this.notify('deleteCustomVariable', arguements);
  },

  trackLink: function(urlPath, options){
    this.notify('trackEvent', arguements);
  },

  trackDomElement: function(element) {
    this.notify('trackDomElement', arguements);
  },

  trackGoal: function(){
    this.notify('trackGoal', arguements);
  },

  createNewVisit: function(){
    this.notify('createNewVisit', []);
  },

  setUserId: function(id) {
    this.notify('setUserId', [id]);
  }


};


var _analytics;

module.exports = {
  /** A factory returning a completely setup singleton of a concrete analytics 
   * object.
   */
  Analytics: function(){
    if (!_analytics){
      _analytics = new AnalyticsDispatcher();
      if (_.has(window.globalAnalytics, 'piwik') && globalAnalytics.piwik) {
        var p = new Piwik();
        _analytics.registerObserver(p);
      }
      else if (_.has(globalAnalytics, 'google') && globalAnalytics.google) {
        var g = null; //Where Google Analytics would go
        _analytics.registerObserver(g);
      }
      _analytics.initialize({engine: _paq}); //_paq might not be available at page load...
    }
    return _analytics;
  }
}
