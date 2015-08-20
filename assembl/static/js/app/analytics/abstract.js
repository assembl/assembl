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
var _CATEGORY_DEFINITIONS = {
  BASE_CATEGORY: 'BASE_CATEGORY'
};

/*
  TODO: Update actions registry with well defined Actions to track
 */
var _ACTION_DEFINITIONS = {
  CLICK: 'CLICK',
  READ: 'READ',
  WRITE: 'WRITE'
};

/**
 * Pseudo URLs: (/TARGET/TRIGGER_INFO (NOT origin target ), ex: IDEA/SYNTHESIS,
 *  meaning an idea was navigated to from the synthesis (any synthesis) but NOT 
 *  IDEA/SYNTHESIS_SECTION (meaning an idea was navigated to from the synthesis
 *  section of the accordeon) 
 *  A dash (-) means that the TRIGGER_INFO in unknown, or irrelevent
 *  Ex: TODO
 */
var _PAGE_DEFINITIONS = {
    //IMPLEMENTED
    'NAVIGATION_CONTEXT_SECTION/NAVIGATION': 'NAVIGATION_CONTEXT_SECTION/NAVIGATION',
    'NAVIGATION_DEBATE_SECTION/NAVIGATION': 'NAVIGATION_DEBATE_SECTION/NAVIGATION',
    'NAVIGATION_DEBATE_SECTION/-': 'NAVIGATION_DEBATE_SECTION/-',
    'NAVIGATION_SYNTHESES_SECTION/NAVIGATION': 'NAVIGATION_SYNTHESES_SECTION/NAVIGATION',
    'NAVIGATION_SYNTHESES_SECTION/-': 'NAVIGATION_SYNTHESES_SECTION/-',
    'NAVIGATION_VISUALIZATIONS_SECTION/NAVIGATION': 'NAVIGATION_VISUALIZATIONS_SECTION/NAVIGATION',
    //NOT YET IMPLEMENTED
    'LOGIN/-': 'LOGIN/-',
    'SIGNUP/-': 'SINGUP/-',
    'JOIN_GROUP/-': 'JOIN_GROUP/-',

};

var CUSTOM_VARIABLES = {
  SAMPLE_CUSTOM_VAR: ['SAMPLE_CUSTOM_VAR', 1]
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
  customVariableSize: 5,
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

  trackGoal: function(goalId, options){
    throw new Error('Cannot call abstract method!');
  },

  createNewVisit: function(){
    throw new Error('Cannot call abstract method!');
  },

  setUserId: function(id) {
    throw new Error('Cannot call abstract method!');
  },

  //The below functions do not seem to have a correlation to GA, used by Piwik only
  trackImpression: function(contentName, contentPiece, contentTarget) {
    throw new Error('Cannot call abstract method!');
  },

  trackVisibleImpression: function(checkOnScroll, timeInterval){
    throw new Error('Cannot call abstract method!');
  },

  trackDomNodeImpression: function(domNode){
    throw new Error('Cannot call abstract method!');
  },

  trackContentInteraction: function(interaction, contentName, contentPiece, contentTarget){
    throw new Error('Cannot call abstract method!');
  },

  trackDomNodeInteraction: function(domNode, contentInteraction){
    throw new Error('Cannot call abstract method!');
  }
};


module.exports = Wrapper;
