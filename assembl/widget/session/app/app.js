"use strict";

var appSession = angular.module('appSession',
    ['ngRoute','ngSanitize', 'pascalprecht.translate','angular-growl','mgcrea.ngStrap.datepicker']);

appSession.config(['$routeProvider','$translateProvider','$locationProvider','growlProvider',
    function($routeProvider, $translateProvider, $locationProvider, growlProvider){

    //$locationProvider.html5Mode(true);

    $routeProvider.
        when('/index', {
            templateUrl:'partials/session.html',
            controller:'sessionCtl',
            resolve: {
                app: function($route, configService) {
                    return configService.getWidget($route.current.params.config);
                }
            }
        }).
        when('/edit',{
            templateUrl:'partials/edit.html',
            controller:'editCtl',
            resolve: {
                app: function($route, configService) {
                    return configService.getWidget($route.current.params.config);
                }
            }
        }).
        when('/rating',{
            templateUrl:'partials/rating.html',
            controller:'ratingCtl',
            resolve: {
                app: function($route, configService) {
                    return configService.getWidget($route.current.params.config);
                }
            }
        }).
        otherwise({
            redirectTo: '/index'
        });

    $translateProvider.useStaticFilesLoader({
        prefix: 'locales/',
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