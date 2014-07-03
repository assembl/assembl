"use strict";

var creativityApp = angular.module('creativityApp',
    ['ngRoute','ngSanitize','creativityServices', 'pascalprecht.translate','angular-growl']);

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
              }
            }
        }).
        when('/videos', {
            templateUrl:'app/partials/videos.html',
            controller:'videosCtl',
            resolve: {
              app: function($route, configService) {
                return configService.getWidget($route.current.params.config);
              },
              init: function(JukeTubeVideosService){
                  JukeTubeVideosService.init();
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