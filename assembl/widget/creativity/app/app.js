"use strict";

var creativityApp = angular.module('creativityApp',
    ['ngRoute','ngSanitize','creativityServices', 'pascalprecht.translate']);

creativityApp.run(['Configuration','$rootScope','$timeout','$window',
    function (Configuration, $rootScope, $timeout, $window) {
    /*
     * TODO: this params { type, idea, discutionId } need to be dynamic
     * */
    var data = {
        type: 'CreativityWidget',
        settings: JSON.stringify({"idea": 'local:Idea/2'})
    };

    $rootScope.counter = 5;
    $rootScope.countdown = function() {
        $timeout(function() {
            $rootScope.counter--;
            $rootScope.countdown();
        }, 1000);
    };

    Configuration.getWidget($.param(data), function(conf){
        conf.get(function(data){

            if(!data.user){

                $('#myModal').modal({
                    keyboard:false
                });

                $rootScope.countdown();

                $timeout(function(){

                  $window.location = '/login';

                  $timeout.flush();

                }, 5000);
            }

            $rootScope.widgetConfig = data;

        });
    });


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

}]).config(['$translateProvider', function($translateProvider){

    $translateProvider.useStaticFilesLoader({
        prefix: 'app/locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('fr');

}]);
