"use strict";

var creativityApp = angular.module('creativityApp',
    ['ngRoute','ngSanitize','creativityServices', 'pascalprecht.translate']);

creativityApp.run(['JukeTubeVideosService', function (JukeTubeVideosService) {
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
        otherwise({
            redirectTo: '/cards'
        });

}]).config(['$translateProvider', function($translateProvider){

    $translateProvider.useStaticFilesLoader({
        prefix: 'app/locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('fr');
}]);

