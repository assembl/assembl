"use strict";

var creativityApp = angular.module('creativityApp',
    ['ngRoute','ngSanitize','creativityServices', 'pascalprecht.translate','angular-growl']);


creativityApp.provider('WidgetConfigService', function (){
  var options = {};
  this.config = function (opt){
    angular.extend(options, opt);
  };
  this.$get = [function (){
    if ( !options )
    {
      throw new Error('Config options must be configured');
    }
    return options;
  }];
});

creativityApp.run(['Configuration','WidgetConfigService', '$rootScope','$timeout','$window',
    function (Configuration, WidgetConfigService, $rootScope, $timeout, $window) {

    console.log("creativityApp.run()");

    $rootScope.counter = 5;
    $rootScope.countdown = function() {
        $timeout(function() {
            $rootScope.counter--;
            $rootScope.countdown();
        }, 1000);
    };


    // check that the user is logged in

    if(!WidgetConfigService.user){
        $('#myModal').modal({
            keyboard:false
        });

        $rootScope.countdown();

        $timeout(function(){
          $window.location = '/login';
          $timeout.flush();
        }, 5000);
    }

    $rootScope.widgetConfig = WidgetConfigService;

}]).run(['JukeTubeVideosService', function (JukeTubeVideosService) {

    JukeTubeVideosService.init();

}]);

creativityApp.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/cards', {
           templateUrl:'app/partials/cards.html',
           controller:'cardsCtl'
        }).
        when('/videos', {
            templateUrl:'app/partials/videos.html',
            controller:'videosCtl'
        }).
        when('/session', {
           templateUrl:'app/partials/session.html',
           controller:'creativitySessionCtl'
        }).
        when('/rating', {
            templateUrl:'app/partials/rating.html',
            controller:'ratingCtl'
        }).
        when('/edit', {
            templateUrl:'app/partials/editCard.html',
            controller:'editCardCtl'
        }).
        otherwise({
            redirectTo: '/cards'
        });

}]).config(['$translateProvider','growlProvider', function($translateProvider, growlProvider){

    /**
     * Angular translation en/fr
     * */
    $translateProvider.useStaticFilesLoader({
        prefix: 'app/locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('fr');

    /**
     * Angular growl notification
     * */
    growlProvider.globalPosition('top-center');
    growlProvider.globalTimeToLive(5000);

    /**
     * if you don't want to have a displayed message list
     * */
     growlProvider.onlyUniqueMessages(true);


}]);


// Before initializing manually Angular, we get the config of the widget, by accessing the "config" parameter of the current URL
// For example: http://localhost:6543/widget/creativity/?config=http://localhost:6543/data/Widget/19#/
angular.element(document).ready(function (){
    console.log("angular.element(document).ready()");

    // returns the value of a given parameter in the URL of the current page
    function getUrlVariableValue(variable) {
      var query = window.location.search.substring(1);
      var vars = query.split("&");
      for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
          return pair[1];
        }
      } 
      //alert('Query Variable ' + variable + ' not found');
      return null;
    }

    var successCallback = function(configData){
        console.log("successCallback ()");
        creativityApp.config(['WidgetConfigServiceProvider', function (WidgetConfigServiceProvider) {
            console.log("WidgetConfigServiceProvider config()");
            WidgetConfigServiceProvider.config(configData);
        }]);
        angular.bootstrap('#creativityApp', ['creativityApp']);
    };

    var configFileDefault = "http://localhost:6543/data/Widget/58";
    var configFile = getUrlVariableValue("config");
    if ( !configFile || !( /^http(s)?:\/\/.*/.test(configFile) ) )
        configFile = configFileDefault;

    // TODO: implement an error callback, in case the config URL given is invalid or there is a network error
    $.get(configFile, successCallback);
});
