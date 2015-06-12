SessionApp.directive('Vote', function($http, $rootScope, utils){
    return{
        restrict:'E',
        scope: {
            idea:'=idea',
            widget:'=widget'
        },
        templateUrl:'app/shared/directives/vote/vote.html',
        link: function($scope){

            $scope.formData = {};

            var
                user_state = _.isUndefined($scope.widget.user_state) ? [] : JSON.parse($scope.widget.user_state.session_user_vote),
                id_idea = $scope.idea['@id'].split('/')[1];

            var userStateUrl = utils.getURL($scope.widget.user_state_url);

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
