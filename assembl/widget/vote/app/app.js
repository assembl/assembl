"use strict";

var voteApp = angular.module('voteApp',
    ['ngRoute','ngSanitize','creativityServices', 'pascalprecht.translate']);

voteApp.config(['$routeProvider', function($routeProvider){
    $routeProvider.
        when('/', {
           templateUrl:'app/partials/index.html',
           controller:'indexCtl'
        }).
        when('/voted', {
           templateUrl:'app/partials/voted.html',
           controller:'votedCtl'
        }).
        otherwise({
            redirectTo: '/'
        });

}]);

voteApp.config(['$translateProvider', function($translateProvider){

    $translateProvider.useStaticFilesLoader({
        prefix: 'app/locales/',
        suffix: '.json'
    });

    $translateProvider.preferredLanguage('fr');

}]);

voteApp.provider('configService', function (){
  var options = {};
  this.config = function (opt){
    angular.extend(options, opt);
  };
  this.$get = [function (){
    if ( !options )
    {
      throw new Error('Config options must be configured');
    }
    return options;
  }];
});

voteApp.run(['configTestingService',function(configTestingService){
    //configTestingService.init();
}]);

// Before initializing manually Angular, we get the config of the widget, by accessing the "config" parameter of the current URL
// For example: http://localhost:6543/widget/vote/?config=http://localhost:6543/data/Widget/19#/
angular.element(document).ready(function (){
    console.log("angular.element(document).ready()");

    // returns the value of a given parameter in the URL of the current page
    function getUrlVariableValue(variable) {
      var query = window.location.search.substring(1);
      var vars = query.split("&");
      for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
          return pair[1];
        }
      } 
      //alert('Query Variable ' + variable + ' not found');
      return null;
    }

    var successCallback = function(configData){
        console.log("successCallback ()");
        voteApp.config(['configServiceProvider', function (configServiceProvider) {
            console.log("configServiceProvider config()");
            configServiceProvider.config(configData);
        }]);
        angular.bootstrap('#voteApp', ['voteApp']);
    };

    var configFileDefault = "http://localhost:6543/data/Widget/19";
    var configFile = getUrlVariableValue("config");
    if ( !configFile || !( /^http(s)?:\/\/.*/.test(configFile) ) )
        configFile = configFileDefault;

    // TODO: implement an error callback, in case the config URL given is invalid or there is a network error
    $.get(configFile, successCallback);
});


