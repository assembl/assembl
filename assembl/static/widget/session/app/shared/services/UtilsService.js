"use strict";

SessionApp.factory('UtilsService', function($translate, $rootScope, $timeout, $window) {

  var fn = {};

  fn.changeLanguage = function(langKey) {
    $translate.use(langKey);
  };

  /**
   * Transform in safe mode raw url
   * */
  fn.getURL = function(url) {
    if (!url) return;

    var api = url.toString(),
        api = api.split(':')[1],
        api = '/data/' + api;

    return api;
  };

  fn.notification = function() {

    $('#myModal').modal({
      keyboard:false
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
  };

  fn.getNiceDateTime = function(date, precise, with_time, forbid_future) {
    var Moment = moment;

    // set default values
    precise = (precise === undefined) ? false : precise;
    with_time = (with_time === undefined) ? true : with_time;

    //var momentDate = moment(date);

    // we assume that server datetimes are given in UTC format
    // (Right now, the server gives UTC datetimes but is not explicit enough because it does not append "+0000". So Moment thinks that the date is not in UTC but in user's timezone. So we have to tell it explicitly, using .utc())
    var momentDate = Moment.utc(date);
    momentDate.local(); // switch off UTC mode, which had been activated using .utc()

    if (forbid_future) { // server time may be ahead of us of some minutes. In this case, say it was now
      var now = Moment();
      var now_plus_delta = Moment().add(30, 'minutes');
      if (momentDate > now && momentDate < now_plus_delta)
          momentDate = now;
    }

    if (momentDate) {
      if (precise == true) {
        if (with_time == true)
            return momentDate.format('LLLL');
        else
            return momentDate.format('LL');
      }

      var one_year_ago = Moment().subtract(1, 'years');
      if (momentDate.isBefore(one_year_ago)) { // show the exact date
        return momentDate.format('L');
      }
      else { // show "x days ago", or something like that
        return momentDate.fromNow();
      }
    }

    return momentDate; // or date?
  };

  return fn;
});
