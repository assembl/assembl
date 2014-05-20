"use strict";

var creativityApp = angular.module('creativityApp',
    ['ngRoute','ngSanitize','creativityServices', 'pascalprecht.translate']);

creativityApp.run(['Configuration','$rootScope', function (Configuration, $rootScope) {
    /*
     * TODO: this params { type, idea, discutionId } need to be dynamic
     * */
    var data = {
        widget_type: 'creativity',
        settings: JSON.stringify({"idea": 'local:Idea/2'})
    };

    Configuration.getWidget($.param(data), function(conf){
        conf.get(function(data){

            var widgetConfig = {
                discussion: data.discussion,
                ideas_uri: data.ideas_uri,
                main_idea_view: data.main_idea_view,
                messages_uri: data.messages_uri,
                settings: data.settings,
                state: data.settings,
                user: data.user,
                user_permissions: data.user_permissions
            }

            $rootScope.widgetConfig = widgetConfig;

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
