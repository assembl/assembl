"use strict";

var creativityServices = angular.module('creativityServices', ['ngResource']);

creativityServices.service('AssemblToolsService', ['$window', '$rootScope', '$log', function ($window, $rootScope, $log) {
  this.resourceToUrl = function(str)
  {
    var start = "local:";
    if ( str.indexOf(start) == 0 )
    {
      str = "/data/" + str.slice(start.length);
    }
    return str;
  };
}]);


creativityServices.factory('globalConfig', function($http){

    var api_rest = 'test/config_test.json';

    return {
        fetch : function() {
            return $http.get(api_rest);
        }
    }

});


//CONFIG
creativityServices.factory('configTestingService', [function(){
  return {
    init: function(){
      
    },
    testCall: function(){
      $.ajax({
        url:'http://localhost:6543/data/Discussion/1/widgets',
        type:'POST',
        data: {
           type:'MultiCriterionVotingWidget',
           settings: JSON.stringify({"idea":"local:Idea/2"})
        },
        success: function(data, textStatus, jqXHR){

           getConfig(jqXHR.getResponseHeader('location'));
        },
        error: function(jqXHR, textStatus, errorThrown){

           console.log(jqXHR);

        }
      });

      function getConfig(value){
        var widget = value.split(':');
        console.log('http://localhost:6543/data/'+widget[1]);
      }
    },
    getConfiguration: function(url, fnSuccess, fnError){
      fnSuccess = fnSuccess || function (data){console.log("data:");console.log(data);};
      fnError = fnError || function(jqXHR, textStatus, errorThrown){};
      $.ajax({
        url:url,
        type:'GET',
        data: {},
        success: fnSuccess,
        error: fnError
      });
    }
  }

}]);


//CARD inspire me: send an idea to assembl
creativityServices.factory('sendIdeaService', ['$resource',function($resource){
    return $resource('http://localhost:6543/api/v1/discussion/:discussionId/posts')
}]);

// WIP: use Angular's REST and Custom Services as our Model for Messages
creativityServices.factory('Discussion', ['$resource', function($resource){
    return $resource('http://localhost:6543/data/Discussion/:discussionId', {}, {
        query: {method:'GET', params:{discussionId:'1'}, isArray:false}
        });
}]);

