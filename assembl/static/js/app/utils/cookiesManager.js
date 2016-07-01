'use strict';

/**
 * @module app.utils.cookiesManager
 */
 
var Ctx = require('../common/context.js');

var getUserCookiesAuthorization = function() {
  var cookies = document.cookie;
  var discussionId = Ctx.getDiscussionId();
  var cookieName = 'cookiesUserAuthorization_discussion' + discussionId;
  return cookies.indexOf(cookieName) > -1;
};

var setUserCookiesAuthorization = function() {
  var date = new Date();
  var discussionId = Ctx.getDiscussionId();
  //Cookie policy: in UE the user choice is available for 13 months
  date.setMonth(date.getMonth() + 13);
  document.cookie = 'cookiesUserAuthorization_discussion' + discussionId + '=done' + ';expires=' + date + ';';
};

module.exports = {
    getUserCookiesAuthorization: getUserCookiesAuthorization,
    setUserCookiesAuthorization:setUserCookiesAuthorization
};