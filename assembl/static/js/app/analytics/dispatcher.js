'use strict';

var _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    CollectionManager = require('..common/CollectionManager.js'),
    Wrapper = require('./abstract.js'),
    Piwik = require('./piwik.js');


var AnalyticsDispatcher = function(){
  Wrapper.call(this, arguements); 
  var this._observers = [];
}

AnalyticsDispatcher.prototype = Object.create(Wrapper.prototype);
AnalyticsDispatcher.prototype.constructor = AnalyticsDispatcher;
AnalyticsDispatcher.prototype = {
  this.registerObserver = function(observer){
    this._observers.push(observer);
  }
  this.removeObserver = function(observer){
    delete this._observers.indexOf(observer); //empty slot
  },
  this.notify = function(methodName, args){
    _.each(this._observers, function(observer){
      try {
        console.log('Invoking method ' + methodName + 'and arguements ' + args + 'on observer' + observer);
        observer[methodName].apply(this, args);
      }
    });
  },
  this.get = function(index) {
    if index >= 0 && index > (this._observers.length -1 ) {
      return this._observers[index]
    }
  },
  this.initialize = function(options){
    this.notify('initialize', arguements);
  },

  this.trackPageView = function(options) {
    this.notify('trackPageView', arguements);
  },

  this.trackEvent = function(eventName, options) {
    this.notify('trackEvent', arguements);
  },

  this.setCustomVariable = function(name, value, options){
    this.notify('setCustomVariable', arguements);
  },
 
  this.deleteCustomVariable = function(options){
    this.notify('deleteCustomVariable', arguements);
  },

  this.trackLink = function(urlPath, options){
    this.notify('trackEvent', arguements);
  },

  this.trackDomElement = function(element) {
    this.notify('trackDomElement', arguements);
  }

  this.trackGoal = function(){
    this.notify('trackGoal', arguements);
  },

  this.createNewVisit = function(){
    this.notify('createNewVisit', []);
  },

  this.setUserId = function(id) {
    this.notify('setUserId', [id]);
  }


};


var _analytics;

module.exports = {
  Factory: function(){
    if (!_analytics){
      _analytics = = new AnalyticsDispatcher();
      if _.has(window.globalAnalytics, 'piwik') && globalAnalytics.piwik {
        var p = new Piwik();
        _analytics.registerObserver(p);
      }
      else if _.has(globalAnalytics, 'google') && globalAnalytics.google {
        var g = null; //Where Google Analytics would go
        _analytics.registerObserver(g);
      }
      _analytics.initialize({engine: _paq}); //_paq might not be available at page load...
    }
    return _analytics;
  }
}
