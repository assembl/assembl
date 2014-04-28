"use strict";

var creativityApp = angular.module('creativityApp',['ngRoute','ngSanitize','creativityServices']);

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
        when('/video/:videoId', {
            templateUrl:'app/partials/video-detail.html',
            controller:'videoDetailCtl'
        }).
        when('/session', {
           templateUrl:'app/partials/session.html',
           controller:'creativitySessionCtl'
        }).
        otherwise({
            redirectTo: '/cards'
        });
}]);

