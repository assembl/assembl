appSession.controller('sessionCtl',
    ['$scope', 'cardGameService', '$rootScope', '$timeout', '$http', 'growl', 'configService', '$sce', 'utils',
        function ($scope, cardGameService, $rootScope, $timeout, $http, growl, configService, $sce, utils) {

            // activate the right tab
            $("ul.nav li").removeClass("active");
            $("ul.nav li .home").closest("li").addClass("active");

            $scope.formData = {};
            $scope.displayed_cards = [];
            $scope.displayed_card_index = 0;
            $scope.widget = configService.data.widget;
            $rootScope.wallet = $scope.widget.settings.session.number;

            $scope.setJeton = function () {
                var
                    user_state = _.isUndefined($scope.widget.user_state) ?
                        [] : JSON.parse($scope.widget.user_state.session_user_vote);

                var jeton = 0;

                angular.forEach(user_state, function (value) {

                    jeton += parseInt(_.values(value), 10);
                })

                $rootScope.wallet = $rootScope.wallet - jeton;
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

                var
                    rootUrl = utils.urlApiSession($scope.widget.ideas_url),
                    ideas = [];

                $scope.parentIdeaTitle = $scope.widget.base_idea.shortTitle;

                $http.get(rootUrl).then(function (response) {

                    angular.forEach(response.data, function (item) {
                        if (item.widget_add_post_endpoint) {
                            item.widget_add_post_endpoint = utils.urlApiSession(_.values(item.widget_add_post_endpoint));
                            item.creationDate = moment(item.creationDate).fromNow();
                            ideas.push(item);
                        }
                    });

                    return ideas;

                }).then(function (ideas) {

                    angular.forEach(ideas, function (idea) {
                        var urlRoot = utils.urlApiSession(idea.proposed_in_post.idCreator);

                        $http.get(urlRoot).then(function (response) {
                            idea.username = response.data.name;
                            idea.avatar = response.data.avatar_url_base + '30';
                        });

                    });

                    $scope.ideas = ideas.reverse();
                });
            }

            /**
             * @params type {string}
             * @params short_title {string}
             * @params definition {string}
             * */
            $scope.sendSubIdea = function () {
                if ($scope.formData) {

                    var rootUrl = utils.urlApiSession($scope.widget.ideas_url);
                    var random_index = angular.element('.random_index');

                    $scope.formData.type = 'Idea';


                    //console.log($scope.formData)
                    //console.log(random_index.val());
                    //return;

                    $http({
                        method: 'POST',
                        url: rootUrl,
                        data: $.param($scope.formData),
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
            cardGameService.getCards(1).success(function (data) {
                $scope.game = data.game01;
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


                    console.log('random_index', $scope.random_index)
                    console.log('$scope.displayed_card_index', $scope.displayed_card_index)
                }

            }

            /**
             * Due to the latency to init $rootScope we need a delay
             * */
            $timeout(function () {

                $scope.getSubIdeaFromIdea();

                $scope.setJeton();

            }, 1000);

        }]);

appSession.controller('ratingCtl',
    ['$scope', '$rootScope', '$timeout', '$http', 'growl', 'utils', 'configService',
        function ($scope, $rootScope, $timeout, $http, growl, utils, configService) {

            // activate the right tab
            $("ul.nav li").removeClass("active");
            $("ul.nav li .rating").closest("li").addClass("active");

            var Widget = configService.data.widget;
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
                    rootUrl = utils.urlApiSession(Widget.ideas_url),
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

                    var urlRoot = utils.urlApiSession(Widget.user_states_url);

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
                    rootUrlSubIdea = utils.urlApiSession(Widget.confirm_ideas_url),
                    rootUrlMessage = utils.urlApiSession(Widget.confirm_messages_url);

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

appSession.controller('editCtl',
    ['$scope', '$http', 'configService', 'utils', 'growl', '$routeParams', 'cardGameService',
        function ($scope, $http, configService, utils, growl, $routeParams, cardGameService) {

            // activate the right tab
            $("ul.nav li").removeClass("active");
            $("ul.nav li .edit").closest("li").addClass("active");

            $scope.widget = configService.data.widget;

            $scope.formData = {};
            $scope.urlRoot = utils.urlApiSession($scope.widget.widget_settings_url);
            $scope.urlEdit = utils.urlApiSession($routeParams.config);

            if (angular.isDefined($scope.widget.settings.session)) {

                if ($scope.widget.settings.session.question)
                    $scope.formData.question = $scope.widget.settings.session.question;
                else
                    $scope.formData.question = "";

                if ($scope.widget.settings.session.number)
                    $scope.formData.number = $scope.widget.settings.session.number;
                else
                    $scope.formData.number = 0;

                if ($scope.widget.settings.session.startDate)
                    $scope.formData.startDate = $scope.widget.settings.session.startDate;

                if ($scope.widget.settings.session.endDate)
                    $scope.formData.endDate = $scope.widget.settings.session.endDate;

            }

            $scope.$watch("message", function (value) {

                switch (value) {
                    case 'createQuestion:success':
                        growl.success('Question configured');
                        break;
                    case 'createQuestion:error':
                        growl.error('An error occur when you set the question');
                        break;
                    case 'setJeton:success':
                        growl.success('jeton added');
                        break;
                    case 'setJeton:error':
                        growl.error('An error occur when you set the number of jeton');
                        break;
                }
            }, true);

            /**
             * Load config card
             * params {int} which is the id of the card game config/game_{int}.json
             */
            cardGameService.getCards(1).success(function (data) {
                $scope.game = data.game;
            });

            $http.get($scope.urlEdit).then(function (session) {
                if (session.data.length)
                    $scope.widgetInstance = session.data;
            });

            $scope.setSettings = function () {

                if ($scope.formData.number &&
                    $scope.formData.startDate &&
                    $scope.formData.endDate) {

                    $scope.formData.startDate = new Date($scope.formData.startDate);
                    $scope.formData.endDate = new Date($scope.formData.endDate);

                    var data = {};

                    data.session = $scope.formData;

                    $http({
                        url: $scope.urlRoot,
                        method: 'PUT',
                        data: data,
                        headers: {
                            'Content-Type': 'application/json'
                        }

                    }).success(function (data, status) {

                        $scope.message = "createQuestion:success";

                    }).error(function (data, status) {

                        $scope.message = "createQuestion:error";
                    })
                }

            }

        }]);

appSession.controller('navigation', ['$scope', function ($scope) {

    var config = 'local:Widget/2';

    $scope.home = '#/index?config=' + config;
    $scope.rating = '#/rating?config=' + config;
    $scope.edition = '#/edit?config=' + config;

}]);