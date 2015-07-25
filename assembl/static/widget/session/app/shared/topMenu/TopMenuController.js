'use strict';

TopMenuModule.controller('TopMenuController', [
    '$scope',
    '$stateParams',
    'UserService',
    'WidgetService',
    '$location',

    function($scope, $stateParams, UserService, WidgetService, $location) {

      $scope.urlLink = $scope.$parent.$state.params.config;

      $scope.isActive = function(route) {
        return route === $location.path();
      }

      var id = decodeURIComponent($scope.urlLink).split('/')[1],
          widget = WidgetService.get({id: id}).$promise;

      widget.then(function(w) {

        $scope.discussion = w.discussion;

        var discussion_id = w.discussion.split('/')[1];

        return UserService.getAuthorize({id: discussion_id}).$promise;

      }).then(function(permissions) {

        $scope.visibleMenu = false;

        if (_.contains(permissions[$scope.discussion], 'admin_discussion')) {
          $scope.visibleMenu = true;
        }
      });

    }]);
