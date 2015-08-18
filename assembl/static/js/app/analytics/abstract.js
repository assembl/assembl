'use strict';

var _EVENT_DEFINITIONS = {
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILED: 'LOGIN_FAILED',
    JOIN_GROUP:'JOIN_GROUP',
    JOIN_GROUP_REFUSED: 'JOIN_GROUP_REFUSED',
    NAVIGATE_IDEA: 'NAVIGATE_IDEA',
    REPLY_MESSAGE_START: 'REPLY_MESSAGE_START',
    REPLY_MESSAGE_COMPLETE: 'REPLY_MESSAGE_COMPLETE'
};

/*
  TODO: Update category registry with well defined Categories
 */
var _CATEGORY_DEFINITIONS = {};

/*
  TODO: Update actions registry with well defined Actions to track
 */
var _ACTION_DEFINITIONS = {
  CLICK: 'CLICK',
  READ: 'READ',
  WRITE: 'WRITE'
};

var _PAGE_DEFINITIONS = {
  'CONTEXT/-': 'CONTEXT/-'
}
/**
 * Abstract Base Class for Analytics Wrapper 
 */
function Wrapper() {
  if (this.constructor === Wrapper){
    throw new Error("Abstract class cannot be constructed!");
  }
};

Wrapper.prototype = {
  debug: true,
  events: _EVENT_DEFINITIONS,
  actions: _ACTION_DEFINITIONS,
  categories: _CATEGORY_DEFINITIONS,
  pages: _PAGE_DEFINITIONS,

  initialize: function(options){
    throw new Error('Cannot call abstract method!');
  },

  // this.updatePageUrl = function(target, options){
  //   throw new Error('Cannot call abstract method!');
  // },
  // 
  // this.updateTitle = function(title){
  //   throw new Error('Cannot call abstract method!'); 
  // },

  /**
   * Change the state of the current page for other events, and log the navigation
   * to the new page.
   * 
   * Concrete implementions should call both piwik's updatePageUrl and updateTitle
   * (or whatever equivalent in the implementation)
   * 
   * @param page One of this.pages
   */
  changeCurrentPage: function(page, options) {
    throw new Error('Cannot call abstract method!');
  },

  trackEvent: function(category, action, eventName, value, options) {
    throw new Error('Cannot call abstract method!');
  },

  setCustomVariable: function(name, value, options){
    throw new Error('Cannot call abstract method!');
  },
 
  deleteCustomVariable: function(options){
    throw new Error('Cannot call abstract method!');
  },

  trackLink: function(urlPath, options){
    throw new Error('Cannot call abstract method!');
  },

  trackDomElement: function(element) {
    throw new Error('Cannot call abstract method!');
  },

  trackGoal: function(goalId, options){
    throw new Error('Cannot call abstract method!');
  },

  createNewVisit: function(){
    throw new Error('Cannot call abstract method!');
  },

  setUserId: function(id) {
    throw new Error('Cannot call abstract method!');
  }
};


module.exports = Wrapper;
