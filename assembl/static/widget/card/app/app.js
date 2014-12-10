"use strict";

var appCards = angular.module('appCards',
    ['ngRoute', 'ngSanitize', 'creativityServices', 'pascalprecht.translate', 'angular-growl']);

appCards.config(['$routeProvider', '$translateProvider', '$locationProvider', 'growlProvider',
    function ($routeProvider, $translateProvider, $locationProvider, growlProvider) {

        $locationProvider.html5Mode(false);

        $routeProvider.
            when('/', {
                templateUrl: 'app/partials/cards.html',
                controller: 'cardsCtl',
                resolve: {
                    app: function ($route, configService) {
                        console.log("$route.current.params:", $route.current.params);
                        if ( "idea" in $route.current.params )
                            return configService.populateFromUrl($route.current.params.idea, 'idea');
                        if ( "config" in $route.current.params )
                            return configService.populateFromUrl($route.current.params.config, 'widget');
                        console.log("Error: no 'config' or 'idea' URL parameter given");
                        return null;
                    }
                }
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