'use strict';

var getUserCookiesAuthorization = function() {
  var cookies = document.cookie;
  return cookies.indexOf('cookiesUserAuthorization') > -1;
};

var setUserCookiesAuthorization = function() {
  var date = new Date();
  //Cookie policy: in UE the user choice is available for 13 months
  date.setMonth(date.getMonth() + 13);
  document.cookie = 'cookiesUserAuthorization=done' + ';expires=' + date + ';';
};

module.exports = {
    getUserCookiesAuthorization: getUserCookiesAuthorization,
    setUserCookiesAuthorization:setUserCookiesAuthorization
};