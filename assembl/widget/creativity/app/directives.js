"use strict";

creativityApp.directive('vote', function(){
    return{
        restrict:'E',
        transclude: true,
        scope: {
            idea:'=idea'
        },
        templateUrl:'app/partials/vote.html',
        link: function($scope, elements, attrs){

            $scope.formData = {};

            $scope.$watch('formData.vote', function(){

              //console.log($scope.formData.vote, '|', $scope.idea['@id']);


            }, true)

        }
    }
})

creativityApp.directive('comments', function($http, $rootScope){
    return {
        restrict:'E',
        scope: {
           idea:'=idea'
        },
        templateUrl: 'app/partials/comments.html',
        link: function($scope, element, attr){

            $scope.formData = {};
            $scope.comments = [];

            $scope.$watch('message', function(value){

                switch(value){
                    case 'commentSubIdea:success':
                        $scope.getCommentsFromSubIdea();
                        break;
                    case 'commentSubIdea:error':
                        break;

                }
            }, true);

            /**
             * get all comments from a sub idea
             */
            $scope.getCommentsFromSubIdea = function(){

                 var rootUrl = $scope.idea.widget_add_post_endpoint,
                     user_id = $rootScope.widgetConfig.user['@id'].split('/')[1],
                     username = $rootScope.widgetConfig.user.name;

                $http.get(rootUrl).then(function(response){
                    angular.forEach(response.data, function(com){

                        com.date = moment(com.date).fromNow();
                        com.avatar = '/user/id/'+ user_id +'/avatar/20';
                        com.username = username;

                        $scope.comments.push(com);
                    })

                });
            }

            /**
             * Comment an idea from creativity session
             */
            $scope.commentSubIdea = function(){

                var rootUrl = $scope.idea.widget_add_post_endpoint,
                    user_id = $rootScope.widgetConfig.user['@id'].split('/')[1];

                var data = {
                    type: 'Post',
                    subject: 'test_message',
                    body: $scope.formData.comment,
                    creator_id: user_id,
                    message_id: 'bogus'
                }

                if(data.body && data.creator_id && rootUrl) {

                    $http({
                        method:'POST',
                        url:rootUrl,
                        data:$.param(data),
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).success(function(data, status, headers){

                        $scope.message = "commentSubIdea:success";
                        $scope.formData.comment = null;

                    }).error(function(status, headers){

                        $scope.message = "commentSubIdea:success";
                    });

                }
            }

            /**
             *
             * */
            $scope.expand = function(e){

                var elm = angular.element(e.currentTarget);

                elm.css('overflow','hidden');
                elm.css('height', 0);
                elm.css('height',elm[0].scrollHeight+'px');

            }

            /**
             * init method
             * */
            $scope.getCommentsFromSubIdea();

        }
    }
})

creativityApp.directive('rating', function($http){
   return {
       restrict:'E',
       scope: {
           comment:'=comment'
       },
       templateUrl:'app/partials/rating-comments.html',
       link: function($scope){

          $scope.getCommentsForRating = function(){

              var rootUrl = '/data/'+$scope.comment.widget_add_post_endpoint.split(':')[1];
              var comments = [];

              if(rootUrl){

                  $http.get(rootUrl).then(function(response){
                      angular.forEach(response.data, function(comment){

                         comments.push(comment);
                      })

                      $scope.subIdeaComment = comments;
                  });
              }
           }

           $scope.getCommentsForRating();
       }
   }

});