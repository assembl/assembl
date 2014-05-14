"use strict";

var creativityApp = angular.module('creativityApp',
    ['ngRoute','ngSanitize','creativityServices', 'pascalprecht.translate']);

creativityApp.config(['$routeProvider', '$provide', function($routeProvider, $provide){
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
        otherwise({
            redirectTo: '/cards'
        });

}]).config(['$translateProvider', function($translateProvider){

    $translateProvider.useStaticFilesLoader({
        prefix: 'app/locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('fr');

}]).run(['JukeTubeVideosService', function (JukeTubeVideosService) {

    JukeTubeVideosService.init();

}]);;

