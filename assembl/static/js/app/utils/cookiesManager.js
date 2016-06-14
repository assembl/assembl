'use strict';

var getCookiesPolicyUserChoice = function() {
  var cookies = document.cookie;
  console.log(cookies);
  return cookies.indexOf('cookiesPolicyUserChoice') > -1;
};
var setCookiesPolicyUserChoice = function(accept) {
  var date = new Date();
  //Cookie policy: in France the user choice is available for 13 months
  date.setMonth(date.getMonth() + 13);
  document.cookie = 'cookiesPolicyUserChoice=' + accept + ';expires=' + date + ';';
};
module.exports = {
    getCookiesPolicyUserChoice: getCookiesPolicyUserChoice,
    setCookiesPolicyUserChoice:setCookiesPolicyUserChoice
};