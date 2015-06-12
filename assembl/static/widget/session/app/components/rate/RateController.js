'use strict';

RateModule.controller('RateController', [
    '$rootScope',
    '$scope',
    'config',
    'growl',
    '$timeout',
    'UtilsService',
    '$http',

    function($rootScope, $scope, config, growl, $timeout, UtilsService, $http) {

        $scope.widget = config;
        /**
         * Due to the latency to init $rootScope we need a delay
         * */
        $timeout(function () {

            $scope.getSubIdeaForVote();

        }, 800);

        /**
         * Fetch all ideas newly added
         */
        $scope.getSubIdeaForVote = function () {

            var
                rootUrl = UtilsService.getURL($scope.widget.ideas_url),
                ideas = [];

            $http.get(rootUrl).then(function (response) {

                if (response.data.length) {
                    angular.forEach(response.data, function (item) {

                        if (item.widget_add_post_endpoint) {

                            ideas.push(item);
                        }
                    })

                }
                return ideas;

            }).then(function (ideas) {

                var urlRoot = UtilsService.getURL($scope.widget.user_states_url);

                $http.get(urlRoot).then(function (response) {

                    if (response.data.length) {
                        var rate = JSON.parse(response.data[0].session_user_vote);

                        angular.forEach(ideas, function (idea) {

                            var id_idea = idea['@id'].split('/')[1],
                                id_idea = parseInt(id_idea, 10);

                            idea.rate = 0;

                            angular.forEach(rate, function (r) {
                                var id_rate = parseInt(_.keys(r), 10),
                                    rate_value = _.values(r);
                                //FIXME : need a default value for rating
                                if (id_idea === id_rate) {

                                    idea.rate = parseInt(rate_value, 10);
                                }
                            });
                        });

                    }

                });

                $scope.ideas = ideas;

            });
        }

        /**
         * Valid votes and send to the server separetely
         * */
        $scope.validVote = function () {

            var
                subIdeaSelected = [],
                commentSelected = [],
                subIdea = angular.element('#postVote .sub-idea'),
                commentSubIdea = angular.element('#postVote .comment-to-sub-idea'),
                rootUrlSubIdea = UtilsService.getURL($scope.widget.confirm_ideas_url),
                rootUrlMessage = UtilsService.getURL($scope.widget.confirm_messages_url);

            $scope.$watch('message', function (value) {
                //TODO: find a good translation for confirm that the catching sub idea is valid
                switch (value) {
                    case 'validVote:success':
                        growl.success('validVoteCatcher');
                        break;
                    case 'validVote:error':
                        growl.error('errorVoteCatcher');
                        break;
                    default:
                        break;
                }
            })

            angular.forEach(subIdea, function (idea) {

                if ($(idea).is(':checked')) {

                    subIdeaSelected.push($(idea).val());
                }
            })

            angular.forEach(commentSubIdea, function (comment) {

                if ($(comment).is(':checked')) {

                    commentSelected.push($(comment).val());
                }
            })

            if (commentSelected.length > 0) {

                var obj = {};
                obj.ids = JSON.stringify(commentSelected);

                $http({
                    method: 'POST',
                    url: rootUrlMessage,
                    data: $.param(obj),
                    async: true,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function (data, status, headers) {

                    $scope.message = 'validVote:success';

                }).error(function (status, headers) {

                    $scope.message = 'validVote:error';
                });

            }

            if (subIdeaSelected.length > 0) {

                var obj = {};
                obj.ids = JSON.stringify(subIdeaSelected);

                $http({
                    method: 'POST',
                    url: rootUrlSubIdea,
                    data: $.param(obj),
                    async: true,
                    headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function (data, status, headers) {

                    $scope.message = 'validVote:success';

                }).error(function (status, headers) {

                    $scope.message = 'validVote:error';
                });
            }

        }


    }]);