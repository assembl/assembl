/**
 * Resolve configuration before access to a controller
 * */
SessionApp.factory('UserService',['$resource', function ($resource) {
    return $resource('/data/Discussion/:id/all_users/current', null, {

        'get': {
            method: 'GET', params: { id: '@id' },
            transformResponse: function(widget) {
                widget = angular.fromJson(widget);
                return widget;
            }
        },

        'getAuthorize': {
            method: 'GET', params: { id: '@id' },
            transformResponse: function(widget) {
                widget = angular.fromJson(widget);
                return widget.permissions;
            }
        }

    });
}]);
