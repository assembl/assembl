"use strict";

var appSession = angular.module('appSession',
    ['ngRoute','ngSanitize', 'pascalprecht.translate','angular-growl']);

appSession.config(['$routeProvider','$translateProvider','$locationProvider','growlProvider',
    function($routeProvider, $translateProvider, $locationProvider, growlProvider){

    //$locationProvider.html5Mode(true);

    $routeProvider.
        when('/', {
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