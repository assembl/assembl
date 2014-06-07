"use strict";

creativityApp.directive('vote', function($rootScope, setVote){
    return{
        restrict:'E',
        scope: {
            idea:'=idea',
            widget:'=widget'
        },
        templateUrl:'app/partials/vote.html',
        link: function($scope, element){

            $scope.formData = {};
            $rootScope.wallet = 10;

            var
                widget_id = $scope.widget['@id'].split('/')[1],
                state = JSON.parse($scope.widget.state),
                id_idea = $scope.idea['@id'].split('/')[1];

            /**
             * compare state_json content and the idea id to check the rate
             * */
            $scope.setPreviousRate = function(){
                var
                    id = parseInt(id_idea, 10);

                angular.forEach(state, function(value){

                    var current_id = parseInt(_.keys(value), 10);

                    if(current_id === id){

                        $scope.rate = parseInt(_.values(value), 10);
                    }

                });

                $scope.formData.vote = $scope.rate;
            }

            /**
             * Remove duplicate entry in the array
             * */
            $scope.removeDuplicateItem = function(origine, newObj){

                var
                    k_newObj = parseInt(_.keys(newObj), 10),
                    newArr = [],
                    found, k;

                // compare obj in a collection objects
                angular.forEach(origine, function(value){

                    k = parseInt(_.keys(value), 10);
                    found = false;

                    if(k_newObj === k){
                         found=true;
                    }

                    if(!found){
                        newArr.push(value);
                    }
                });
                newArr.push(newObj);

                return newArr;
            }

            /**
             * watch data change
             * */
            $scope.$watch('formData.vote', function(newValue, oldValue){

                if((newValue !== oldValue) && $rootScope.wallet >0){

                    var
                        obj = {},
                        data = {};

                    obj[id_idea] = newValue;

                    var newArr = $scope.removeDuplicateItem(state, obj);

                    data.state_json = JSON.stringify(newArr);

                    $rootScope.wallet -= $scope.formData.vote;

                    setVote.addVote({discussionId:1, id:widget_id}, $.param(data));
                }

            }, true);

            /**
             * Set value of radio button
             * */
            $scope.setPreviousRate();

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