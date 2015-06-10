'use strict';

AdminModule.controller('AdminController',
    ['$rootScope',
     '$scope',
     '$http',
     'growl',
     'CardGameService',
     'ConfigService',
     'UtilsService',
     'config',

    function($rootScope, $scope, $http, growl, CardGameService, ConfigService, UtilsService, config) {

        //console.debug('AdminController', config);

        $scope.widget = config;

        $scope.formData = {};
        $scope.urlRoot = UtilsService.urlApiSession($scope.widget.widget_settings_url);
        $scope.urlEdit = UtilsService.urlApiSession(config['@id']);


        /**
         * Load config card
         * params {int} which is the id of the card game config/game_{int}.json
         */
        CardGameService.getCards(1).success(function (data) {
            $scope.game = data.game;
        });

        $http.get($scope.urlEdit).then(function (session) {
            if (session.data.length)
                $scope.widgetInstance = session.data;


            console.debug(session)


        });


        if (angular.isDefined($scope.widget.settings.session)) {

            if ($scope.widget.settings.session.question)
                $scope.formData.question = $scope.widget.settings.session.question;
            else
                $scope.formData.question = "";

            /*if ($scope.widget.settings.session.number)
                $scope.formData.number = $scope.widget.settings.session.number;
            else
                $scope.formData.number = 0;*/

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



        $scope.setSettings = function () {

            if ($scope.formData.number &&
                $scope.formData.startDate &&
                $scope.formData.endDate) {

                $scope.formData.startDate = new Date($scope.formData.startDate);
                $scope.formData.endDate = new Date($scope.formData.endDate);

                var data = {};

                data.session = $scope.formData;

                console.debug(data);

                return;

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