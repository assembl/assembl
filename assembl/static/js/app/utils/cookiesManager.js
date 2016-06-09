'use strict';

var $ = require('jquery');

var getCookiesAuthorisation = function() {
  //var name = 'cookiePolicyDecided';
  //document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
  var cookies = document.cookie;
  if(cookies.indexOf('cookiePolicyDecided') <= -1){
    return true;
  }
};
var setCookiesAuthorisation = function() {
  var date = new Date();
  document.cookie = 'cookiePolicyDecided=' + date;
};
module.exports = {
    getCookiesAuthorisation: getCookiesAuthorisation,
    setCookiesAuthorisation:setCookiesAuthorisation
};
