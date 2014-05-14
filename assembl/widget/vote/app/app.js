"use strict";

var voteApp = angular.module('voteApp',
    ['ngRoute','ngSanitize','creativityServices', 'pascalprecht.translate']);

voteApp.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/', {
           templateUrl:'app/partials/index.html',
           controller:'indexCtl'
        }).
        otherwise({
            redirectTo: '/'
        });

}]).config(['$translateProvider', function($translateProvider){

    $translateProvider.useStaticFilesLoader({
        prefix: 'app/locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('fr');

}]).run(['configService',function(configService){

    configService.init();

}]);

