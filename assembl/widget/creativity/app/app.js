var app = angular.module('creativity',['ngRoute','cardsController','videosController']);

app.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/cards', {
           templateUrl:'app/partials/cards.html',
           controller:'cards'
        }).
        when('/videos', {
            templateUrl:'app/partials/videos.html',
            controller:'videos'
        }).
        otherwise({
            redirectTo: '/cards'
        });
}]);



