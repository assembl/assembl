"use strict";

var creativityApp = angular.module('creativityApp',['ngRoute']);

creativityApp.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/cards', {
           templateUrl:'app/partials/cards.html',
           controller:'cardsController'
        }).
        when('/videos', {
            templateUrl:'app/partials/videos.html',
            controller:'videosController'
        }).
        otherwise({
            redirectTo: '/cards'
        });
}]);

