"use strict";

var creativityApp = angular.module('creativityApp',
    ['ngRoute','ngSanitize','creativityServices', 'pascalprecht.translate','angular-growl']);

creativityApp.run(['$rootScope','$timeout','$window',
    function ($rootScope, $timeout, $window) {

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
    /*if(!WidgetConfigService.user){
        $('#myModal').modal({
            keyboard:false
        });

        $rootScope.countdown();

        $timeout(function(){
          $window.location = '/login';
          $timeout.flush();
        }, 5000);
    } */

    //$rootScope.widgetConfig = WidgetConfigService;

}]).run(['JukeTubeVideosService', function (JukeTubeVideosService) {

    JukeTubeVideosService.init();

}]);

creativityApp.config(['$routeProvider','$translateProvider','$locationProvider','growlProvider',
    function($routeProvider, $translateProvider, $locationProvider, growlProvider){

    $locationProvider.html5Mode(false);

    $routeProvider.
        when('/cards', {
           templateUrl:'app/partials/cards.html',
           controller:'cardsCtl',
           resolve: {
              app: function($route, configService) {
                return configService.getWidget($route.current.params.config);
              },
              user: function(configService){


              }

            }
        }).
        when('/videos', {
            templateUrl:'app/partials/videos.html',
            controller:'videosCtl',
            resolve: {
              app: function($route, configService) {
                return configService.getWidget($route.current.params.config);
              }
            }
        }).
        when('/session', {
           templateUrl:'app/partials/session.html',
           controller:'sessionCtl',
           resolve: {
             app: function($route, configService) {
               return configService.getWidget($route.current.params.config);
             }
           }
        }).
        when('/rating', {
            templateUrl:'app/partials/rating.html',
            controller:'ratingCtl',
            resolve: {
              app: function($route, configService) {
                return configService.getWidget($route.current.params.config);
              }
            }
        }).
        when('/edit', {
            templateUrl:'app/partials/edit.html',
            controller:'editCtl',
            resolve: {
              app: function($route, configService) {
                return configService.getWidget($route.current.params.config);
              }
            }
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
