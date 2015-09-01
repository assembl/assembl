'use strict';

// UMD style module defintion. Simplified details below. Read comments to understand dependencies
var moduleName = 'Analytics_Abstract',
    dependencies = [];

(function(root, factory){
  if (typeof define === 'function' && define.amd){
    // AMD. Register as an anonymous module.
    define(dependencies, function(){ //Update list of args. eg. function($, _, someModule) 
      return (root[moduleName] = factory(arguments)); 
    });
  } else if (typeof module === 'object' && module.exports) {
    // Node-like environments. Not strict CommonJS but CommonJS-like env.
    // Update arguments here by adding require('dependency') as paramter to factory().
    // eg. module.exports = factory(require('jquery'));
    module.exports = factory();
  } else {
    // Browser global
    // Update arguments here by adding root.Dependecy as parameter to factory()
    // eg. root[moduleName] = factory(root.jquery);
    root[moduleName] = factory();
  }
})(this, function(){ //Update arguments to factory here
  
  /*
   *
   * In order to understand the event structure, please refer to docs/events.md for a broad explanation. 
   * If any changes in architecture are made to the this file, please update docs/events.md, as appropriate.
   * However, event definitions and summary should be done right here, in this file.
   * 
   */

  /** 
   * _CATEGORY_DEFINITIONS: Normally accessed as dispatcher.categories.CONSTANT
   * Defines which UI element a custom event originate from?
   * 
   */
  var _CATEGORY_DEFINITIONS = {
      TABLE_OF_IDEAS: 'TABLE_OF_IDEAS',
      SYNTHESIS: 'SYNTHESIS',
      IDEA_PANEL: 'IDEA_PANEL',
      MESSAGE_LIST: 'MESSAGE_LIST',
      /** Message list of a specific idea.  Only use if you need to 
       * distinguish the event from MESSAGE_LIST above
       */
      MESSAGE_LIST_IDEA: 'MESSAGE_LIST_IDEA',
      /**
       * An operation on a message thread as a whole.  Typically accessing 
       * the message in it's full context.
       */
      MESSAGE_THREAD: 'MESSAGE_THREAD',
      /** 
       * Operation on a SINGLE message
       */
      MESSAGE: 'MESSAGE',
      /** 
       * The "Acordeon"
       */
      NAVIGATION_PANEL: 'NAVIGATION_PANEL',
      SHARED_URL: 'SHARED_URL',
      NOTIFICATION: 'NOTIFICATION',
      LOGIN: 'LOGIN',
      REGISTER: 'REGISTER',
      CONFIRM_ACCOUNT: 'CONFIRM_ACCOUNT'
  };

  /** 
   * _CATEGORY_DEFINITIONS: Normally accessed as dispatcher.actions.CONSTANT
   * Defines which UI element a custom event originate from?
   * 
   */
  var _ACTION_DEFINITIONS = {
      /** 
       * The process by which a user discovers and initially learns the system
       * ex:  login, regitration, join discussion, tour, etc.
       */
      ONBOARDING: 'ONBOARDING',
      /** 
       * Reading user created content (messages, ideas)
       */
      READING: 'READING',
      /**
       * Actively searching for content
       */
      FINDING: 'FINDING',
      /**
       * Strong interaction with content that are not in and of themselves
       * content creation, such as liking
       */
      INTERACTING: 'INTERACTING',
      /**
       * Actually producing content (posting, replying, harvesting, etc.)
       */
      PRODUCING: 'PRODUCING'
  };


  var _EVENT_DEFINITIONS = {
      /**
       * Event fired when clicked on 'About' section of navigation carrousal on left  
       * assembl/static/js/app/views/navigation/navigation.js
       */
      NAVIGATION_OPEN_CONTEXT_SECTION: {action: 'FINDING', category: 'NAVIGATION_PANEL', eventName: 'OPEN_CONTEXT_SECTION'},

      /**
       * Event fired when clicking on 'Discussion' section of navigation carrousal on left
       * assembl/static/js/app/views/ideaList.js
       * assembl/static/js/app/views/navigation/navigation.js
       */
      NAVIGATION_OPEN_DEBATE_SECTION: {action: 'FINDING', category: 'NAVIGATION_PANEL', eventName: 'OPEN_DEBATE_SECTION'},

      /**
       * Event fired when clicking on 'Synthesis' section of navigation carrousal on left
       * assembl/static/js/app/views/navigation/navigation.js
       */
      NAVIGATION_OPEN_SYNTHESES_SECTION: {action: 'FINDING', category: 'NAVIGATION_PANEL', eventName: 'OPEN_SYNTHESES_SECTION'},

      /**
       * Event fired when clicking on a specific synthesis under the 'Synthesis' section of navigation carrousal on left
       * assembl/static/js/app/views/navigation/synthesisInNavigation.js
       */
      NAVIGATION_OPEN_SPECIFIC_SYNTHESIS: {action: 'FINDING', category: 'NAVIGATION_PANEL', eventName: 'NAVIGATE_TO_SYNTHESIS'},

      /**
       * Event fired when clicking on the 'Statistics' section of navigation carrousal on left
       * assembl/static/js/app/views/navigation/navigation.js
       */
      NAVIGATION_OPEN_VISUALIZATIONS_SECTION: {action: 'FINDING', category: 'NAVIGATION_PANEL', eventName: 'OPEN_VISUALIZATIONS_SECTION'},


      /**
       * Event fired anytime an idea is clicked under any table of ideas 
       * (ex: 'Discussion' section of navigation, Popups with a table of idea,
       * any table of idea in a panel group.)
       * assembl/static/js/app/views/ideaInIdeaList.js
       */
      NAVIGATE_TO_IDEA_IN_TABLE_OF_IDEAS: {action: 'FINDING', category: 'TABLE_OF_IDEAS', eventName: 'NAVIGATE_TO_IDEA'},

      /**
       * Same as NAVIGATE_TO_IDEA_IN_TABLE_OF_IDEAS, but fired when the number 
       * of new messages is NOT clicked (user requested all messages).
       * assembl/static/js/app/views/ideaInIdeaList.js
       */
      OPEN_IDEA_IN_TABLE_OF_IDEAS: {action: 'FINDING', category: 'TABLE_OF_IDEAS', eventName: 'OPEN_IDEA'},

      /**
       * Same as NAVIGATE_TO_IDEA_IN_TABLE_OF_IDEAS, but when the number of new
       *  messages is clicked  (user requested only new messages).
       * assembl/static/js/app/views/ideaInIdeaList.js
       */
      OPEN_IDEA_NEW_MESSAGES_IN_TABLE_OF_IDEAS: {action: 'FINDING', category: 'TABLE_OF_IDEAS', eventName: 'OPEN_IDEA_NEW_MESSAGES'},

      /**
       * Similar to NAVIGATE_TO_IDEA_IN_TABLE_OF_IDEAS, but for synthesis.
       * Event fired when an idea inside of a synthesis is clicked.
       * assembl/static/js/app/views/ideaInSynthesis.js
       */
      NAVIGATE_TO_IDEA_IN_SYNTHESIS: {action: 'FINDING', category: 'SYNTHESIS', eventName: 'NAVIGATE_TO_IDEA'},

      /**
       * Event fired when a user started composing a message.
       * This is the case where:
       * - The message textbox was previously empty
       * - The message is a reply to another message
       * assembl/js/app/views/messageSend.js
       */
      ENTER_EMPTY_MESSAGE_WRITING_AREA_ON_MESSAGE_REPLY: {action: 'PRODUCING', category: 'MESSAGE', eventName: 'ENTER_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user started composing a message.
       * This is the case where:
       * - The message text was previously started by the user
       * - The message is a reply to another message
       * assembl/js/app/views/messageSend.js
       */
      ENTER_NON_EMPTY_MESSAGE_WRITING_AREA_ON_MESSAGE_REPLY: {action: 'PRODUCING', category: 'MESSAGE', eventName: 'ENTER_NON_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user stopped composing a message.
       * This is the case where:
       * - The message textbox is still empty (the user didn't actually start composing)
       * - The message is a reply to another message
       * assembl/js/app/views/messageSend.js
       */
      LEAVE_EMPTY_MESSAGE_WRITING_AREA_ON_MESSAGE_REPLY: {action: 'PRODUCING', category: 'MESSAGE', eventName: 'LEAVE_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user stopped composing a message.
       * This is the case where:
       * - The message textbox is NOT empty (the user did actually start composing)
       * - The message is a reply to another message
       * assembl/js/app/views/messageSend.js
       */
      LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA_ON_MESSAGE_REPLY: {action: 'PRODUCING', category: 'MESSAGE', eventName: 'LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user started composing a message.
       * This is the case where:
       * - The message textbox was previously empty
       * - The message is a top post on a specifix idea
       * assembl/js/app/views/messageSend.js
       */
      ENTER_EMPTY_MESSAGE_WRITING_AREA_ON_IDEA_REPLY: {action: 'PRODUCING', category: 'MESSAGE_LIST_IDEA', eventName: 'ENTER_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user started composing a message.
       * This is the case where:
       * - The message text was previously started by the user
       * - The message is a top post on a specifix idea
       * assembl/js/app/views/messageSend.js
       */
      ENTER_NON_EMPTY_MESSAGE_WRITING_AREA_ON_IDEA_REPLY: {action: 'PRODUCING', category: 'MESSAGE_LIST_IDEA', eventName: 'ENTER_NON_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user stopped composing a message.
       * This is the case where:
       * - The message textbox is still empty (the user didn't actually start composing)
       * - The message is a top post on a specifix idea
       * assembl/js/app/views/messageSend.js
       */
      LEAVE_EMPTY_MESSAGE_WRITING_AREA_ON_IDEA_REPLY: {action: 'PRODUCING', category: 'MESSAGE_LIST_IDEA', eventName: 'LEAVE_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user stopped composing a message.
       * This is the case where:
       * - The message textbox is NOT empty (the user did actually start composing)
       * - The message is a top post on a specifix idea
       * assembl/js/app/views/messageSend.js
       */
      LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA_ON_IDEA_REPLY: {action: 'PRODUCING', category: 'MESSAGE_LIST_IDEA', eventName: 'LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user started composing a message.
       * This is the case where:
       * - The message textbox was previously empty
       * - The message is a top post on the discussion
       * assembl/js/app/views/messageSend.js
       */
      ENTER_EMPTY_MESSAGE_WRITING_AREA_ON_TOP_POST: {action: 'PRODUCING', category: 'MESSAGE_LIST', eventName: 'ENTER_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user started composing a message.
       * This is the case where:
       * - The message text was previously started by the user
       * - The message is a top post on the discussion
       * assembl/js/app/views/messageSend.js
       */
      ENTER_NON_EMPTY_MESSAGE_WRITING_AREA_ON_TOP_POST: {action: 'PRODUCING', category: 'MESSAGE_LIST', eventName: 'ENTER_NON_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user stopped composing a message.
       * This is the case where:
       * - The message textbox is still empty (the user didn't actually start composing)
       * - The message is a top post on the discussion
       * assembl/js/app/views/messageSend.js
       */
      LEAVE_EMPTY_MESSAGE_WRITING_AREA_ON_TOP_POST: {action: 'PRODUCING', category: 'MESSAGE_LIST', eventName: 'LEAVE_EMPTY_MESSAGE_WRITING_AREA'},

      /**
       * Event fired when a user stopped composing a message.
       * This is the case where:
       * - The message textbox is NOT empty (the user did actually start composing)
       * - The message is a top post on the discussion
       * assembl/js/app/views/messageSend.js
       */
      LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA_ON_TOP_POST: {action: 'PRODUCING', category: 'MESSAGE_LIST', eventName: 'LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA'},

      /*
       * Events fired when a message is successfully stored in server and model is returned to front-end, which is a reply to a message, or an idea, or a top post
       * assembl/js/app/views/messageSend.js
       */
      MESSAGE_POSTED_ON_MESSAGE_REPLY: {action: 'PRODUCING', category: 'MESSAGE', eventName: 'MESSAGE_POSTED'},
      MESSAGE_POSTED_ON_IDEA_REPLY: {action: 'PRODUCING', category: 'MESSAGE_LIST_IDEA', eventName: 'MESSAGE_POSTED'},
      MESSAGE_POSTED_ON_TOP_POST: {action: 'PRODUCING', category: 'MESSAGE_LIST', eventName: 'MESSAGE_POSTED'},

      /**
       * Event fired when the reply button is clicked on a message
       * assembl/js/app/views/message.js
       */
      MESSAGE_REPLY_BTN_CLICKED: {action: 'PRODUCING', category: 'MESSAGE', eventName: 'REPLY_BUTTON_CLICKED'},

      /*
       * Events fired when the 'like' icon is clicked (when empty=> liked; when liked => unlike)
       * assembl/static/js/app/views/message.js
       */
      MESSAGE_LIKED: {action: 'INTERACTING', category: 'MESSAGE', eventName: 'MESSAGE_LIKED'},
      MESSAGE_UNLIKED: {action: 'INTERACTING', category: 'MESSAGE', eventName: 'MESSAGE_UNLIKED'},

      /**
       * Event fired when the 'share' icon is clicked on a message
       * assembl/static/js/app/views/message.js
       */
      MESSAGE_SHARE_BTN_CLICKED: {action: 'INTERACTING', category: 'MESSAGE', eventName: 'SHARE_BUTTON_CLICKED'},

      /*
       * Events fired when a message is marked as read/unread. Either via the 
       * options box, 'Mark as Read/Unread' or the green/white circle
       * 
       * It is NOT fired when replying to a message (which marks the message as 
       * read as well)
       * assembl/static/js/app/views/message.js
       */
      MESSAGE_MANUALLY_MARKED_READ: {action: 'INTERACTING', category: 'MESSAGE', eventName: 'MANUALLY_MARK_READ'},
      MESSAGE_MANUALLY_MARKED_UNREAD: {action: 'INTERACTING', category: 'MESSAGE', eventName: 'MANUALLY_MARK_UNREAD'},

      /**
       * Event fired when the "view full conversation" on a message list view is clicked.  
       * assembl/static/js/app/views/messageFamily.js
       */
      THREAD_VIEW_COMPLETE_CONVERSATION: {action: 'INTERACTING', category: 'MESSAGE_THREAD', eventName: 'VIEW_COMPLETE_CONVERSATION'},

      /**
       * Event fired when the login button is pressed, regardless of whether the
       * form is validated or not. Social logins, event is fired when the 
       * social login button is clicked, regardless of successful login or not.  
       * assembl/templates/login.jinja2
       */      
      EMAIL_LOGIN: {action:'ONBOARDING', category: 'LOGIN', eventName: 'ASSEMBL_USER_CLICK_LOGIN'},
      FACEBOOK_LOGIN: {action: 'ONBOARDING', category: 'LOGIN', eventName: 'FACEBOOK_USER_CLICK_LOGIN'},
      TWITTER_LOGIN: {action:'ONBOARDING', category: 'LOGIN', eventName: 'TWITTER_USER_CLICK_LOGIN'},
      GOOGLE_LOGIN: {action: 'ONBOARDING', category: 'LOGIN', eventName: 'GOOGLE_USER_CLICK_LOGIN'},

      /**
       * Event fired when the 'register' button is pressed, regardless of 
       * successful registration or not.
       * assembl/templates/register.jinja2
       */      
      USER_REGISTER: {action:'ONBOARDING', category: 'REGISTER', eventName: 'ASSEMBL_USER_CLICK_LOGIN'},

      /**
       * Event fired when the user is deemed to have just logged in. 
       * assembl/static/js/app/common/context.js
       */      
      USER_LOGIN: {action: 'ONBOARDING', category: 'LOGIN', eventName: 'USER_LOGGED_IN'},

      /**
       * Event fired when user enters account confirmation page (usually from an
       * email confirmation)
       * assembl/templates/email_confirmed.jinja2
       */
      CONFIRM_ACCOUNT: {action: 'ONBOARDING', category: 'CONFIRM_ACCOUNT', eventName: 'ASSEMBL_USER_ACCOUNT_CONFIRM'},

      /*
       * Events fired when the user lands on assembl with URL containing a query 
       * string ?source=notification or ?source=share
       * before the routeManager loads the root URL without the query strings
       * assembl/static/js/app/routeManager.js
       */
      ENTER_POST_VIA_NOTIFICATION: {action: 'ONBOARDING', category: 'NOTIFICATION', eventName: 'ENTER_ASSEMBL_OPEN_POST'},
      ENTER_POST_VIA_SHARE: {action: 'ONBOARDING', category: 'SHARED_URL', eventName: 'ENTER_ASSEMBL_OPEN_POST'},
      ENTER_IDEA_VIA_SHARE: {action: 'ONBOARDING', category: 'SHARED_URL', eventName: 'ENTER_ASSEMBL_OPEN_IDEA'}

      /*
      JOIN_GROUP:'JOIN_GROUP',
      JOIN_GROUP_REFUSED: 'JOIN_GROUP_REFUSED',
      */
  };

  /**
   * Virtual pages defined within the single page application
   */
  var _PAGE_DEFINITIONS = { 
      /**
       * The 'About' page, accessed through the carrousel. Fired in parallel 
       * with the NAVIGATION_OPEN_CONTEXT_SECTION event
       * assembl/static/js/app/views/navigation/navigation.js
       */
      'SIMPLEUI_CONTEXT_SECTION': 'SIMPLEUI_CONTEXT_SECTION',

      /**
       * The 'Discussion' page, accessed through the carrousel. Fired in 
       * parallel with the NAVIGATION_OPEN_DEBATE_SECTION event
       * assembl/static/js/app/views/navigation/navigation.js
       */      
      'SIMPLEUI_DEBATE_SECTION': 'SIMPLEUI_DEBATE_SECTION',

      /**
       * The 'Synthesis' page, accessed through the carrousel. Fired in parallel
       *  with the NAVIGATION_OPEN_SYNTHESIS_SECTION event
       * assembl/static/js/app/views/navigation/navigation.js
       */      
      'SIMPLEUI_SYNTHESES_SECTION': 'SIMPLEUI_SYNTHESES_SECTION',

      /**
       * The 'Statistics' page, accessed through the carrousel. Fired in 
       * parallel with the NAVIGATION_OPEN_VISUALIZATIONS_SECTION event
       * assembl/static/js/app/views/navigation/navigation.js
       */      
      'SIMPLEUI_VISUALIZATIONS_SECTION': 'SIMPLEUI_VISUALIZATIONS_SECTION',

      /**
       * Note: Context of a specific idea.  In practice set when the state of 
       * the group is set to a specific idea
       *  
       * Tries to capture the context when a user is exploring a single idea, 
       * even though he may be solely focussed on it's messages. 
       * Eg. Clicking on a specific idea in the TOI, opens messages, but 
       * page = IDEA. 
       * 
       * assembl/static/js/app/views/groups/groupContent.js 
       * (But ultimately called in multiple locations.)
       */      
      'IDEA': 'IDEA',

      /**
       * A 'Messages' page is defined when the context of requesting messages
       * originates with asking for messages outside the context of a single
       * idea.  As implemented currently, it's the exact reverse of 'IDEA'.
       * Eg. Clicking on 'View full discussion' in a message list.
       * This code is called in multiple locations.  
       * assembl/static/js/app/views/groups/groupContent.js
       *
       * Note: Context of messages.  Means the state of the group was just set
       * to a null idea, or user is playing with the filters
       */
      'MESSAGES': 'MESSAGES',

      /**
       * NOT a virtual page. The login page is a seperate page than the app 
       * assembl/templates/login.jinja2
       */      
      'LOGIN': 'LOGIN',
      
      /**
       * NOT a virtual page. The register page is a seperate page than the app
       * assembl/templates/login.jinja2
       */      
      'REGISTER': 'REGISTER',

      //NOT YET IMPLEMENTED
      'MESSAGE': 'MESSAGE', //Context of a specific message.  To be implemented in showMessageById
      'SYNTHESIS': 'SYNTHESIS' //Context of a specific synthesis.  To be implemented in showMessageById AND synthesisInNavigation.js

  };

  var _CUSTOM_VARIABLES = {
    HAS_ELEVATED_RIGHTS: {name: 'HAS_ELEVATED_RIGHTS', index: 1},
    IS_DISCUSSION_MEMBER: {name: 'IS_DISCUSSION_MEMBER', index: 2},
    HAS_POSTED_BEFORE: {name: 'HAS_POSTED_BEFORE', index: 3},
    /* Is on a return visit if 24h has passed since the user's first login */
    IS_ON_RETURN_VISIT: {name: 'IS_ON_RETURN_VISIT', index: 4},

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
    debug: false,
    events: _EVENT_DEFINITIONS,
    actions: _ACTION_DEFINITIONS,
    categories: _CATEGORY_DEFINITIONS,
    pages: _PAGE_DEFINITIONS,
    customVariables: _CUSTOM_VARIABLES,

    
    validateEventsArray: function() {
      var that = this;

      _.each(this.events, function(event) {
        if (!(event.action in that.actions)) {
          throw new Error("Action "+event.action+" not in _ACTION_DEFINITIONS");
        }
        if (!(event.category in that.categories)) {
          throw new Error("Category "+event.category+" not in _CATEGORY_DEFINITIONS");
        }
      });
    },
    
    initialize: function(options){
      throw new Error('Cannot call abstract method!');
    },

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

    trackEvent: function(eventDefinition, value, options) {
      throw new Error('Cannot call abstract method!');
    },

    setCustomVariable: function(variableDefinition, value) {
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


  return Wrapper;
  
});
