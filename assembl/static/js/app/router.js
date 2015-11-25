'use strict';

var Marionette = require('./shims/marionette.js'),
    routeManager = require('./routeManager.js'),
    message = require('./models/message.js'),
    idea = require('./models/idea.js'),
    agent = require('./models/agents.js');

var Router = Marionette.AppRouter.extend({
  controller: routeManager,

  //Note:  This should match with assembl/lib/frontend_url.py
  appRoutes: {
    "": "home",
    "edition": "edition",
    "partners": "partners",
    "notifications": "notifications",
    "settings": "settings",
    "about": "about",
    "discussion_preferences": "adminDiscussionPreferences",
    "sentrytest": "sentryTest",
    "user/notifications": "userNotifications",
    "user/profile": "profile",
    "user/account": "account",
    "user/discussion_preferences": "userDiscussionPreferences",
    "posts/*id": "post",
    "idea/*id": "idea",
    "profile/*id": "user",
    "G/*path": "groupSpec",
    "*actions": "defaults"
  }

});

// Monkey patch ensures that shared knowledge is in a single file
// TODO: improve.
message.Model.prototype.routerBaseUrl = "posts/";
idea.Model.prototype.routerBaseUrl = "idea/";
agent.Model.prototype.routerBaseUrl = "profile/";

module.exports = Router;
