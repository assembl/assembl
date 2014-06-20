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
        when('/admin', {
           templateUrl:'app/partials/admin.html',
           controller:'adminCtl'
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

    function startAngularApplication(){
      angular.bootstrap('#voteApp', ['voteApp']);
    }


    // TODO: better way to access the admin panel
    // if the user is trying to access the admin panel, skip the loading of the configuration file and start the Angular application directly
    var admin_variable = getUrlVariableValue("admin");
    console.log("admin_variable:");
    console.log(admin_variable);
    if ( admin_variable != null )
    {
      startAngularApplication();
      return;
    }

    
    // get the "target" URL parameter
    // this parameter is meant to contain the identifier of the item about which the user is voting
    var target = getUrlVariableValue("target");
    

    var successCallback = function(configData){
        console.log("successCallback ()");
        voteApp.config(['configServiceProvider', function (configServiceProvider) {
            console.log("configServiceProvider config()");
            configServiceProvider.config(configData);
            // save (or override) the "target" URL parameter into the config
            if ( target != null || !configServiceProvider.target )
            {
                configServiceProvider.config({"target": target});
            }
        }]);
        startAngularApplication();
    };

    var configFileDefault = "/data/Widget/19";
    var configFile = decodeURIComponent(getUrlVariableValue("config"));
    if ( !configFile || !( /^http(s)?:\/\/.*/.test(configFile) ) )
        configFile = configFileDefault;

    // TODO: implement an error callback, in case the config URL given is invalid or there is a network error
    var errorCallback = function(jqXHR, textStatus, errorThrown){
      console.log("error");
      console.log("jqXHR:");
      console.log(jqXHR);
      console.log("textStatus:");
      console.log(textStatus);
      console.log("errorThrown:");
      console.log(errorThrown);

      var error_code = jqXHR.status;
      var error_content = jqXHR.responseText;
      
      console.log("error_code:");
      console.log(error_code);
      console.log("error_content:");
      console.log(error_content);

      alert("Error while trying to load the configuration file.\nError code: " + error_code + "\nError thrown: " + errorThrown + "\nError content:" + error_content);
    };

    // if the "target" URL parameter is set, pass it along when calling the widget configuration file
    var data = {};
    if ( target )
      data.target = target;
    $.get(configFile, data, successCallback).fail(errorCallback);
});


