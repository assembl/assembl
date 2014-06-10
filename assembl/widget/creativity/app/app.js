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

creativityApp.run(['WidgetConfigService', '$rootScope','$timeout','$window',
    function (WidgetConfigService, $rootScope, $timeout, $window) {

    $rootScope.counter = 5;
    $rootScope.countdown = function() {
        $timeout(function() {
            $rootScope.counter--;
            $rootScope.countdown();
        }, 1000);
    };

    /**
     * Check that the user is logged in
     * */
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

creativityApp.config(['$routeProvider','$translateProvider','$locationProvider','growlProvider',
    function($routeProvider, $translateProvider, $locationProvider, growlProvider){

    $locationProvider.html5Mode(false);

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
            templateUrl:'app/partials/edit.html',
            controller:'editCtl'
        }).
        otherwise({
            redirectTo: '/cards'
        });

    $translateProvider.useStaticFilesLoader({
        prefix: 'app/locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('fr');

    /**
     * Set growl position and timeout
     * */
    growlProvider.globalPosition('top-center');
    growlProvider.globalTimeToLive(5000);

    /**
     * Display an unique error message for the same type of error
     * */
    growlProvider.onlyUniqueMessages(true);

}]);


/**
 * Before initializing manually Angular, we get the config of the widget, by accessing the "config" parameter of the current URL
 * For example: http://localhost:6543/widget/creativity/?config=http://localhost:6543/data/Widget/19#/
 * */
angular.element(document).ready(function (){
    /**
     * returns the value of a given parameter in the URL of the current page
     * */
    function getUrlVariableValue(variable) {
        var query = window.location.search.substring(1),
            vars = query.split("&");

        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            if (pair[0] == variable) {
                return pair[1];
            }
        }

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

    var configFile = getUrlVariableValue("config");

    //TODO: Redirect on the discussion
    /**
     * If discussion_admin, redirect on widget creation page.
     * */
    if (!configFile) {
        alert("No configuration.");
        return;
    }

    if (configFile.split(':')[0] === "local") {
        configFile = "/data/"+configFile.split(':')[1];
    }

    // TODO: implement an error callback, in case the config URL given is invalid or there is a network error
    $.get(configFile, successCallback);
});
