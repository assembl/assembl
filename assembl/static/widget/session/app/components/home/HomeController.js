'use strict';

HomeModule.controller('HomeController', [
    '$scope',
    'config',
    'CardGameService',
    '$timeout',
    '$sce',
    'UtilsService',
    '$http',
    'growl',

    function($scope, config, CardGameService, $timeout, $sce, UtilsService, $http, growl) {

        $scope.widget = config;
        $scope.formData = {};
        $scope.displayed_cards = [];
        $scope.displayed_card_index = 0;

        // when the session end up, switch to read only mode
        if(config.settings.endDate){
            $scope.readOnly = new Date().getTime() > new Date(config.settings.endDate).getTime();
        }

        $scope.$watch("message", function (value) {

            switch (value) {
                case 'sendNewIdea:success':
                    growl.success('New sub idea posted');
                    $scope.getSubIdeaFromIdea();
                    break;
                case 'sendNewIdea:error':
                    growl.error('Something wrong');
                    break;

            }
        }, true);


        /**
         * Fetch all ideas newly added
         */
        $scope.getSubIdeaFromIdea = function () {

            var rootUrl = UtilsService.getURL($scope.widget.ideas_url),
                ideas = [];

            $scope.parentIdeaTitle = $scope.widget.base_idea.shortTitle;

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
         * @params type {string}
         * @params short_title {string}
         * @params definition {string}
         * */
        $scope.sendSubIdea = function () {
            if ($scope.formData) {

                var rootUrl = UtilsService.getURL($scope.widget.ideas_url),
                    random_index = angular.element('.random_index');

                $scope.formData.type = 'Idea';

                $http({
                    method: 'POST',
                    url: rootUrl,
                    data: $scope.formData,
                    headers: {'Content-Type': 'application/json'}
                }).success(function () {

                    $scope.message = "sendNewIdea:success";
                    $scope.formData.short_title = null;
                    $scope.formData.definition = null;

                }).error(function () {

                    $scope.message = "sendNewIdea:error";
                });
            }
        }

        /**
         * Load config card
         * params {int} which is the id of the card game config/game_{int}.json
         */
        CardGameService.getCards(1).success(function (data) {
            $scope.game = data['game01'];
            $scope.shuffle();
        });

        /**
         * Card random
         * */
        $scope.shuffle = function () {

            var n_cards = $scope.game.length;
            if (n_cards > 0) {
                $scope.random_index = Math.floor((Math.random() * n_cards));
                $scope.displayed_cards.push($scope.game[$scope.random_index]);
                $scope.displayed_card_index = $scope.displayed_cards.length - 1;
                $scope.displayed_cards[$scope.displayed_card_index].body = $sce.trustAsHtml($scope.game[$scope.random_index].body);
                $scope.game.splice($scope.random_index, 1);


                //console.log('random_index', $scope.random_index)
                //console.log('$scope.displayed_card_index', $scope.displayed_card_index)
            }

        },


        /**
         * Due to the latency to init $rootScope we need a delay
         * */
        $timeout(function () {

            $scope.getSubIdeaFromIdea();

            //$scope.setJeton();

        }, 1000);

}]);
