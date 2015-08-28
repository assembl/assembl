All custom events that will currently be fired by assembl are defined in:
../../assembl/static/js/app/internal_modules/analytics/abstract.js


Events in Piwik (and other Analytics software) are on multi-axis spectrum. These axis are:
Category, Action, and Event Name

Within Piwik, each axis can be viewed in relation to 1 of the other axii. Assembl has decided that these axis should convey a meaningful structure. As a result, each axis answers the following question:

- Category: Which UI element did the event originate from?
- Action: From which high-level operation did the event originate from?
- Event Name: Contexual event name

As of August 27, 2015, these definitions are:

Category:

  TABLE_OF_IDEAS
  SYNTHESIS
  IDEA_PANEL
  MESSAGE_LIST
  MESSAGE_LIST_IDEA
  MESSAGE_THREAD
  MESSAGE
  NAVIGATION_PANEL
  SHARED_URL
  NOTIFICATION
  LOGIN
  REGISTER
  CONFIRM_ACCOUNT

Actions:

  ONBOARDING
  READING
  FINDING
  INTERACTING
  PRODUCING


Event Name: 

  OPEN_CONTEXT_SECTION:
    - Category: NAVIGATION_PANEL
    - Action: FINDING
    - (Name in Code) : NAVIGATION_OPEN_CONTEXT_SECTION
    - Description: Fired when the About section is clicked

  OPEN_DEBATE_SECTION:
    - Category: NAVIGATION_PANEL
    - Action: FINDING
    - (Name in Code): NAVIGATION_OPEN_DEBATE_SECTION
    - Description: Fired when the Discussion section is clicked

  OPEN_SYNTHESES_SECTION:
    - Category: NAVIGATION_PANEL
    - Action: FINDING
    - (Name in Code): NAVIGATION_OPEN_SYNTHESES_SECTION
    - Description: Fired when Synthesis section is clicked

  NAVIGATE_TO_SYNTHESIS:
    - Category: NAVIGATION_PANEL
    - Action: FINDING
    - (Name in Code): NAVIGATION_OPEN_SPECIFIC_SYNTHESIS
    - Description: Fired when a specific Synthesis is clicked within the Synthesis section

  OPEN_VISUALIZATIONS_SECTION:
    - Category: NAVIGATION_PANEL
    - Action: FINDING
    - (Name if Code): NAVIGATION_OPEN_VISUALIZATIONS_SECTION 
    - Description: Statistics section?

  SHOW:
    - Category: TABLE_OF_IDEAS
    - Action: FINDING
    - (Name if Code): SHOW_TABLE_OF_IDEAS
    - Description: ?

  OPEN_IDEA:
    - Category: TABLE_OF_IDEAS
    - Action: FINDING
    - (Name if Code): OPEN_IDEA_IN_TABLE_OF_IDEAS
    - Description: Fired when an Idea in the table of ideas is clicked

  OPEN_IDEA_NEW_MESSAGES: 
    - Category: TABLE_OF_IDEAS
    - Action: FINDING
    - (Name if Code): OPEN_IDEA_NEW_MESSAGES_IN_TABLE_OF_IDEAS
    - Description: ?

  NAVIGATE_TO_IDEA: 
    - Category: TABLE_OF_IDEAS
    - Action: FINDING
    - (Name if Code): NAVIGATE_TO_IDEA_IN_TABLE_OF_IDEAS 
    - Description: ? (Difference with open idea?) 

  NAVIGATE_TO_IDEA: 
    - Category: SYNTHESIS
    - Action: FINDING
    - (Name if Code): NAVIGATE_TO_IDEA_IN_SYNTHESIS
    - Description: Fired when clicked on idea in a specific synthesis

  ENTER_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE
    - Action: PRODUCING
    - (Name if Code): ENTER_EMPTY_MESSAGE_WRITING_AREA_ON_MESSAGE_REPLY
    - Description: Fired when the textarea for a reply to a message comes into focus

  ENTER_NON_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE
    - Action: PRODUCING
    - (Name if Code): ENTER_NON_EMPTY_MESSAGE_WRITING_AREA_ON_MESSAGE_REPLY
    - Description: Fired when textarea of a reply with no content goes out of focus

  LEAVE_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE
    - Action: PRODUCING,
    - (Name if Code): LEAVE_EMPTY_MESSAGE_WRITING_AREA_ON_MESSAGE_REPLY
    - Description: Fired when the textarea of an empty message reply goes out of focus (no content written)

  LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE
    - Action: PRODUCING
    - (Name if Code): LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA_ON_MESSAGE_REPLY
    - Description: Fired when the textare of a non-empty message reply goes out of focus (content was written, went out of focus) on an idea

  ENTER_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE_LIST_IDEA
    - Action: PRODUCING
    - (Name if Code): ENTER_EMPTY_MESSAGE_WRITING_AREA_ON_IDEA_REPLY
    - Description: Fired when textarea for an idea reply comes into focus in the idea message list

  ENTER_NON_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE_LIST_IDEA
    - Action: PRODUCING
    - (Name if Code): ENTER_NON_EMPTY_MESSAGE_WRITING_AREA_ON_IDEA_REPLY
    - Description: Fired when the textarea with content comes into focus, in the idea message list

  LEAVE_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE_LIST_IDEA
    - Action: PRODUCING
    - (Name if Code): LEAVE_EMPTY_MESSAGE_WRITING_AREA_ON_IDEA_REPLY
    - Description: Fired when an empty textarea in the idea message list goes out of focus

  LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE_LIST_IDEA
    - Action: PRODUCING
    - (Name if Code): LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA_ON_IDEA_REPLY
    - Description: Fired when a content filled textarea in the idea message list goes out of focus

  ENTER_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE_LIST
    - Action: PRODUCING
    - (Name if Code): ENTER_EMPTY_MESSAGE_WRITING_AREA_ON_TOP_POST
    - Description: Fired when empty textarea response to the top post in the message list comes into focus

  ENTER_NON_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE_LIST
    - Action: PRODUCING
    - (Name if Code): ENTER_NON_EMPTY_MESSAGE_WRITING_AREA_ON_TOP_POST
    - Description: Fired when non-empty textarea reply to a top post comes into focus

  LEAVE_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE_LIST
    - Action: PRODUCING
    - (Name if Code): LEAVE_EMPTY_MESSAGE_WRITING_AREA_ON_TOP_POST
    - Description: Fired when empty textarea reply to a top post goes out of focus

  LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA: 
    - Category: MESSAGE_LIST
    - Action: PRODUCING
    - (Name if Code): LEAVE_NON_EMPTY_MESSAGE_WRITING_AREA_ON_TOP_POST
    - Description: Fired when empty textarea reply to a top post goes out of focus

  MESSAGE_POSTED: 
    - Category: MESSAGE
    - Action: PRODUCING
    - (Name if Code): MESSAGE_POSTED_ON_MESSAGE_REPLY
    - Description: Fired when a reply to a message is posted

  MESSAGE_POSTED: 
    - Category: MESSAGE_LIST_IDEA
    - Action: PRODUCING
    - (Name if Code): MESSAGE_POSTED_ON_IDEA_REPLY
    - Description: Fired when a reply to a message is posted under ideas

  MESSAGE_POSTED: 
    - Category: MESSAGE_LIST
    - Action: PRODUCING
    - (Name if Code): MESSAGE_POSTED_ON_TOP_POST
    - Description: Fired when a reply to a message is posted under message list to a top post

  REPLY_BUTTON_CLICKED: 
    - Category: MESSAGE
    - Action: PRODUCING
    - (Name if Code): MESSAGE_REPLY_BTN_CLICKED
    - Description: Fired when reply button to a message is clicked

  MESSAGE_LIKED: 
    - Category: MESSAGE
    - Action: INTERACTING
    - (Name if Code): MESSAGE_LIKED
    - Description: Fired when the like button on a message is clicked

  MESSAGE_UNLIKED: 
    - Category: MESSAGE
    - Action: INTERACTING
    - (Name if Code): MESSAGE_UNLIKED
    - Description: Fired when the like button on a message is clicked when the post has already been liked before by the same user

  SHARE_BUTTON_CLICKED: 
    - Category: MESSAGE
    - Action: INTERACTING
    - (Name if Code): MESSAGE_SHARE_BTN_CLICKED
    - Description: Fired when a message's share button is clicked

  MANUALLY_MARK_READ: 
    - Category: MESSAGE
    - Action: INTERACTING
    - (Name if Code): MESSAGE_MANUALLY_MARKED_READ
    - Description: Fired when a message is opened by the user. 

  MANUALLY_MARK_UNREAD: 
    - Category: MESSAGE
    - Action: INTERACTING
    - (Name if Code): MESSAGE_MANUALLY_MARKED_UNREAD
    - Description: Fired when a message is when user clicks on 'mark as unread' in the message options (or the green button) 

  VIEW_COMPLETE_CONVERSATION: 
    - Category: MESSAGE_THREAD
    - Action: INTERACTING
    - (Name if Code): THREAD_VIEW_COMPLETE_CONVERSATION
    - Description: Fired when a 'view entire conversation' is clicked on a message in non-threaded views

  ASSEMBL_USER_CLICK_LOGIN: 
    - Category: LOGIN
    - Action: ONBOARDING
    - (Name if Code): EMAIL_LOGIN
    - Description: Fired when a user clicks 'log in' using their Assembl email and password

  FACEBOOK_USER_CLICK_LOGIN: 
    - Category: LOGIN
    - Action: ONBOARDING
    - (Name if Code): FACEBOOK_LOGIN
    - Description: Fired when a user clicks on 'log in with facebook' button

  TWITTER_USER_CLICK_LOGIN: 
    - Category: LOGIN
    - Action: ONBOARDING
    - (Name if Code): TWITTER_LOGIN
    - Description: Fired when a user clicks on 'log in with twitter' button

  GOOGLE_USER_CLICK_LOGIN: 
    - Category: LOGIN
    - Action: ONBOARDING
    - (Name if Code): GOOGLE_LOGIN
    - Description: Fired when a user clicks on 'log in with google+' button

  ASSEMBL_USER_CLICK_LOGIN: 
    - Category: REGISTER
    - Action: ONBOARDING
    - (Name if Code): USER_REGISTER
    - Description: Fired when a user clicks on 'register' after entering their email information to register to Assembl

  USER_LOGGED_IN: 
    - Category: LOGIN // This is a questionable source
    - Action: ONBOARDING
    - (Name if Code): USER_LOGIN
    - Description: Fired when a user is logged into Assembl, regardless of the type of logged in process taken

  ASSEMBL_USER_ACCOUNT_CONFIRM: 
    - Category: CONFIRM_ACCOUNT
    - Action: ONBOARDING
    - (Name if Code): CONFIRM_ACCOUNT
    - Description: Fired when a user clicks on the confirm email link that is sent to their inbox

  ENTER_ASSEMBL_OPEN_POST: 
    - Category: NOTIFICATION
    - Action: ONBOARDING
    - (Name if Code): ENTER_POST_VIA_NOTIFICATION
    - Description: Fired when a user lands on Assembl to a specific post which was sent via a notification email

  ENTER_ASSEMBL_OPEN_POST: 
    - Category: SHARED_URL
    - Action: ONBOARDING
    - (Name if Code): ENTER_POST_VIA_SHARE
    - Description: Fired when a user lands on Assembl to a specific post which was shared externally

  ENTER_ASSEMBL_OPEN_IDEA: 
    - Category: SHARED_URL
    - Action: ONBOARDING
    - (Name if Code): ENTER_IDEA_VIA_SHARE
    - Description: Fired when a user lands on Assembl to a specific idea which was shared externally
    


