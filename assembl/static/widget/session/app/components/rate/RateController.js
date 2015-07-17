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
        $scope.idea_title = config.base_idea.shortTitle;

        /**
         * Fetch all ideas newly added
         */
        $scope.getSubIdeaForVote = function () {

            var rootUrl = UtilsService.getURL($scope.widget.ideas_url),
                ideas = [];

            $http.get(rootUrl).then(function (response) {

                angular.forEach(response.data, function (item) {
                    if (item.widget_add_post_endpoint) {
                        item.widget_add_post_endpoint = UtilsService.getURL(_.values(item.widget_add_post_endpoint));
                        item.beautify_date = moment(new Date(item.creationDate)).fromNow();
                        ideas.push(item);
                    }
                });

                return ideas;

            }).then(function (ideas) {

                angular.forEach(ideas, function (idea) {
                    var urlRoot = UtilsService.getURL(idea.proposed_in_post.idCreator);

                    $http.get(urlRoot).then(function (response) {
                        idea.username = response.data.name;
                        idea.avatar = response.data.avatar_url_base + '30';
                    });

                });

                $scope.ideas = ideas;

            });
        }

        /**
         * Valid votes and send to the server separetely
         * */
        $scope.validSelection = function () {

            var subIdeaSelected = [],
                commentSelected = [],
                subIdea = angular.element('#postForm .sub-idea'),
                commentSubIdea = angular.element('#postForm .comment-to-sub-idea'),
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
            });

            angular.forEach(subIdea, function (idea) {

                if ($(idea).is(':checked')) {

                    subIdeaSelected.push($(idea).val());
                }
            });

            angular.forEach(commentSubIdea, function (comment) {

                if ($(comment).is(':checked')) {

                    commentSelected.push($(comment).val());
                }
            });

           if (commentSelected.length > 0) {

                var obj = {};
                obj.ids = commentSelected;

                $http({
                    method: 'POST',
                    url: rootUrlMessage,
                    data: obj,
                    async: true,
                    headers: {'Content-Type': 'application/json'}
                }).success(function (data, status, headers) {

                    $scope.message = 'validVote:success';

                }).error(function (status, headers) {

                    $scope.message = 'validVote:error';
                });

            }

           if (subIdeaSelected.length > 0) {

                var obj = {};
                obj.ids = subIdeaSelected;

                $http({
                    method: 'POST',
                    url: rootUrlSubIdea,
                    data: obj,
                    async: true,
                    headers: {'Content-Type': 'application/json'}
                }).success(function (data, status, headers) {

                    $scope.message = 'validVote:success';

                }).error(function (status, headers) {

                    $scope.message = 'validVote:error';
                });
            }

        }

        /**
         *
         * */
        $scope.selectedItems = 0;
        $scope.$watch('ideas', function(ideas){
           var selectedItems = 0;
            angular.forEach(ideas, function(idea){
                selectedItems += idea.selected ? 1 : 0;
            });
            $scope.selectedItems = selectedItems;

        }, true);

        //init
        $scope.getSubIdeaForVote();

    }]);
