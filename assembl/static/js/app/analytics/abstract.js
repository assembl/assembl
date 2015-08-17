'use strict';

var _e = {
  'login_success': 'login_success',
  'login_failed': 'login_failed',
  'join_group': 'join_group',
  'join_group_refused': 'join_group_refused',
  'navigate_idea': 'navigate_idea',
  'reply_message_start': 'reply_message_start',
  'reply_message_complete': 'reply_message_complete' 
};

/**
 * Abstract Base Class for Analytics Wrapper 
 */
function Wrapper() {
  if (this.constructor === Wrapper){
    throw new Error("Abstract class cannot be constructed!");
  }
  this.events = _e;
};

Wrapper.prototype = {

  this.initialize = function(options){
    throw new Error('Cannot call abstract method!');
  },

  // this.updatePageUrl = function(target, options){
  //   throw new Error('Cannot call abstract method!');
  // },
  // 
  // this.updateTitle = function(title){
  //   throw new Error('Cannot call abstract method!'); 
  // },

  //this should call the updatePageUrl and updateTitle
  this.trackPageView = function(options) {
    throw new Error('Cannot call abstract method!');
  },

  this.trackEvent = function(eventName, options) {
    throw new Error('Cannot call abstract method!');
  },

  this.setCustomVariable = function(name, value, options){
    throw new Error('Cannot call abstract method!');
  },
 
  this.deleteCustomVariable = function(options){
    throw new Error('Cannot call abstract method!');
  },

  this.trackLink = function(urlPath, options){
    throw new Error('Cannot call abstract method!');
  },

  this.trackDomElement = function(element) {
    throw new Error('Cannot call abstract method!');
  }

  this.trackGoal = function(){
    throw new Error('Cannot call abstract method!');
  },

  this.createNewVisit = function(){
    throw new Error('Cannot call abstract method!');
  },

  this.setUserId = function(id) {
    throw new Error('Cannot call abstract method!');
  }
};


module.exports = Wrapper;
