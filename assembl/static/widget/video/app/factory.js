"use strict";

videosApp.factory('utils', function($translate, $rootScope, $timeout, $window) {

  var fn = {};

  fn.changeLanguage = function(langKey) {
    $translate.use(langKey);
  }

  /**
   * Transform in safe mode raw url
   * */
  fn.urlApi = function(url) {
    if (!url) return;

    var api = url.toString();

    if (/^local:.*/.test(url))
    {
      api = api.split(':')[1],
      api = '/data/' + api;
    }

    //else if ( /^http(s)?:\/\/.*/.test(url) )
    //{
    //    return api;
    //}

    return api;
  }

  fn.notification = function() {

    $('#myModal').modal({
      keyboard: false
    });

    $rootScope.counter = 5;
    $rootScope.countdown = function() {
      $timeout(function() {
        $rootScope.counter--;
        $rootScope.countdown();
      }, 1000);
    }

    $rootScope.countdown();

    $timeout(function() {
      $window.location = '/login';
      $timeout.flush();
    }, 5000);
  }

  return fn;
});
