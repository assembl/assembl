SessionApp.directive('Rate', ['UtilsService', function($http, UtilsService) {
  return {
    restrict:'E',
    scope: {
      comment:'=comment'
    },
    templateUrl:'app/shared/directives/rate/rate.html',
    link: function($scope) {

      $scope.getCommentsForRating = function() {

        var
            rootUrl = UtilsService.getURL(_.values($scope.comment.widget_add_post_endpoint)),
            comments = [];

        if (rootUrl) {

          $http.get(rootUrl).then(function(response) {
            angular.forEach(response.data, function(comment) {

              comments.push(comment);
            })

            $scope.subIdeaComment = comments;
          });
        }
      }

      $scope.getCommentsForRating();
    }
  }

}]);
