"use strict";

voteApp.factory('utils', function($translate) {

  var fn = {};

  fn.changeLanguage = function(langKey) {
    $translate.use(langKey);
  }

  return fn;
});
