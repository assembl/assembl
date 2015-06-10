/**
 * Resolve configuration before access to a controller
 * */
SessionApp.factory('WidgetService',['$resource', function ($resource) {
    return $resource('/data/Widget/:id', null, {

        'get': {
            method: 'GET', params: { id: '@id' },
            transformResponse: function(widget) {
                widget = angular.fromJson(widget);
                return widget;
            }
        }


        /*data: {},
        getWidget: function (url) {

            var defer = $q.defer(),
                data = this.data;

            if (!url) defer.reject({message: 'invalid url configuration'});

            var urlRoot = UtilsService.urlApiSession(url);

            $http.get(urlRoot).success(function (response) {
                data.widget = response;

                /**
                 *  Need more spec for this case
                 *  03/09/14 Gaby Hourlier
                 * */

        /*var
                 endDate = new Date(data.widget.settings.session.endDate),
                 currentDate = new Date(),
                 userPermission = data.widget.user_permissions;

                 if((currentDate > endDate) &&
                 !_.contains(userPermission, 'admin_discussion')){

                 }

                defer.resolve(data);
            }).error(function (data, status) {

                if (status === 401) UtilsService.notification();

                defer.reject({message: 'error to get widget information'});
            });

            return defer.promise;
        }*/
    });
}]);