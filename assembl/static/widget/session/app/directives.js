"use strict";

appSession.directive('vote', function($http, $rootScope, utils){
    return{
        restrict:'E',
        scope: {
            idea:'=idea',
            widget:'=widget'
        },
        templateUrl:'partials/vote.html',
        link: function($scope){

            $scope.formData = {};

            var
                user_state = _.isUndefined($scope.widget.user_state) ? [] : JSON.parse($scope.widget.user_state.session_user_vote),
                id_idea = $scope.idea['@id'].split('/')[1];

            var userStateUrl = utils.urlApiSession($scope.widget.user_state_url);

            /**
             * compare state_json content and the idea id to check the rate
             * */
            $scope.setPreviousRate = function(){

                var id = parseInt(id_idea, 10);

                angular.forEach(user_state, function(value){

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

                    var newArr = $scope.removeDuplicateItem(user_state, obj);

                    data.session_user_vote = JSON.stringify(newArr);

                    $rootScope.wallet -= $scope.formData.vote;

                    $http({
                        method:'PUT',
                        url:userStateUrl,
                        data: data,
                        async:true,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    }).success(function(data, status){

                        console.log(status)

                    }).error(function(status){

                        console.log(status)
                    });

                }

            }, true);

            /**
             * Set value of radio button
             * */
            $scope.setPreviousRate();

        }
    }
})

appSession.directive('comments', function($http, $rootScope, utils){
    return {
        restrict:'E',
        scope: {
            idea:'=idea'
        },
        templateUrl: 'partials/comments.html',
        link: function($scope, element){

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
                    comments = [];

                $http.get(rootUrl).then(function(response){
                    angular.forEach(response.data, function(com){

                        var user_id = com.idCreator.split('/')[1];

                        com.date = moment(com.date).fromNow();
                        com.avatar = '/user/id/'+ user_id +'/avatar/20';

                        comments.push(com);
                    })

                    return comments;

                }).then(function(commments){

                    angular.forEach(commments, function(c){

                        var urlRoot = utils.urlApiSession(c.idCreator);

                        $http.get(urlRoot).then(function(response){

                            c.username = response.data.name;
                        });

                    });

                    $scope.comments = commments;
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
                    }).success(function(){

                        $scope.message = "commentSubIdea:success";
                        $scope.formData.comment = null;

                    }).error(function(){

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

appSession.directive('rating', function($http, utils){
    return {
        restrict:'E',
        scope: {
            comment:'=comment'
        },
        templateUrl:'partials/rating-comments.html',
        link: function($scope){

            $scope.getCommentsForRating = function(){

                var
                    rootUrl = utils.urlApiSession(_.values($scope.comment.widget_add_post_endpoint)),
                    comments = [];

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