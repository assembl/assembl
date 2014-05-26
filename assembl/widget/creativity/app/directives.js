"use strict";

creativityApp.directive('vote', function(){
    return{
        restrict:'E',
        transclude: true,
        scope: {
            id:'=id'
        },
        templateUrl:'app/partials/vote.html',
        link: function(scope, elements, attrs){

            scope.rate = 0;

            scope.rateUp = function(){
               if(scope.rate > 4){
                   return;
               }
                scope.rate += 1;
            }

            scope.rateDown = function(){
                if(scope.rate <= 0){
                    return;
                }
                scope.rate -= 1;
            }


        }
    }
})

creativityApp.directive('comments', function($http){
    return {
        restrict:'E',
        scope: {
           idea:'=idea'
        },
        templateUrl: 'app/partials/comments.html',
        link: function($scope, element, attr){

            $scope.formData = {};

            /**
             * get all comments from a sub idea
             */
            $scope.getCommentsFromSubIdea = function(){

                 var rootUrl = $scope.idea.widget_add_post_endpoint;
                     rootUrl = rootUrl +'?view=default';
                 var comment = [];

                $http.get(rootUrl).then(function(response){
                    angular.forEach(response.data, function(com){

                        com.date = moment(com.date).fromNow();

                        comment.push(com);
                    })

                    $scope.comments = comment;

                });
            }

            /**
             * Comment an idea from creativity session
             */
            $scope.commentSubIdea = function(){

                var rootUrl = $scope.idea.widget_add_post_endpoint;

                var data = {
                    type: 'Post',
                    subject: 'test_message',
                    body: $scope.formData.comment,
                    creator_id: 245,
                    message_id: 'bogus'
                }

                if(data.body && rootUrl) {

                    $http({
                        method:'POST',
                        url:rootUrl,
                        data:$.param(data),
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).success(function(data, status, headers){

                        $scope.getCommentsFromSubIdea();

                    }).error(function(status, headers){

                        console.log('error:',status)
                    });

                }
            }

            $scope.getCommentsFromSubIdea();

        }
    }
})
