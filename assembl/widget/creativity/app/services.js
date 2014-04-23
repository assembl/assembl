"use strict";

var creativityServices = angular.module('creativityServices', ['ngResource']);

creativityServices.factory('globalVideoConfig', function($http){

    var api_rest = 'test/config_test.json';

    return {
        fetch : function() {
            return $http.get(api_rest);
        }
    }

});

creativityServices.factory('globalConfig', function($http){

    var api_rest = 'test/config_test.json';

    return {
        fetch : function() {
            return $http.get(api_rest);
        }
    }

});

creativityServices.factory('globalMessages', function($http){

    var api_rest = 'test/session.json';

    return {
        fetch: function() {
            return $http.get(api_rest);
        }
    }

});

// WIP: use Angular's REST and Custom Services as our Model for Messages
creativityServices.factory('Discussion', ['$resource', function($resource){
    return $resource('http://localhost:6543/data/Discussion/:discussionId', {}, {
        query: {method:'GET', params:{discussionId:'1'}, isArray:false}
        });
}]);

