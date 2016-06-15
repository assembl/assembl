'use strict';

var getCookiesAuthorization = function() {
  var cookies = document.cookie;
  console.log(cookies);
  return cookies.indexOf('cookiesUserAuthorization') > -1;
};

var setCookiesAuthorization = function() {
  var date = new Date();
  //Cookie policy: in UE the user choice is available for 13 months
  date.setMonth(date.getMonth() + 13);
  document.cookie = 'cookiesUserAuthorization=done' + ';expires=' + date + ';';
};

module.exports = {
    getCookiesAuthorization: getCookiesAuthorization,
    setCookiesAuthorization:setCookiesAuthorization
};