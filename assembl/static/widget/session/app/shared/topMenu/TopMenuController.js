'use strict';

TopMenuModule.controller('TopMenuController', [
    '$scope',
    '$stateParams',
    'UserService',
    'WidgetService',

    function($scope, $stateParams, UserService, WidgetService){

        $scope.urlLink = $scope.$parent.$state.params.config;

        var id = decodeURIComponent($scope.urlLink).split('/')[1],
            widget = WidgetService.get({id: id}).$promise;

        widget.then(function(w){

          $scope.discussion = w.discussion;

          var discussion_id = w.discussion.split('/')[1];

          return UserService.getAuthorize({id: discussion_id}).$promise;

        }).then(function(permissions){

            $scope.visibleMenu = false;

            if(_.contains( permissions[$scope.discussion], 'admin_discussion')){
                $scope.visibleMenu = true;
            }
        });

    $scope.urlLink = $scope.$parent.$state.params.config;

}]);
