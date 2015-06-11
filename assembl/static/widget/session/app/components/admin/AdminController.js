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

        console.debug('AdminController', config);

        $scope.widget = config;

        $scope.home = config['@id'];

        $scope.formData = {};

        $scope.goToDiscussion = function (){
            $scope.config_status = 1;
        }

        if (angular.isDefined($scope.widget.settings)) {

            if ($scope.widget.settings.question)
                $scope.formData.question = $scope.widget.settings.question;
            else
                $scope.formData.question = "";

            if ($scope.widget.settings.startDate)
                $scope.formData.startDate = $scope.widget.settings.startDate;

            if ($scope.widget.settings.endDate)
                $scope.formData.endDate = $scope.widget.settings.endDate;

            //Need to display button if there is a minimal config
            $scope.goToDiscussion();

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

            if ($scope.formData.startDate && $scope.formData.endDate) {

                $scope.formData.startDate = $scope.formData.startDate;
                $scope.formData.endDate = $scope.formData.endDate;

                var data = {};

                data.startDate = $scope.formData.startDate;
                data.endDate = $scope.formData.endDate;
                data.question = $scope.formData.question;
                data.idea = config.settings.idea;

                $http({
                    url: UtilsService.getURL($scope.widget.widget_settings_url),
                    method: 'PUT',
                    data: data,
                    headers: {
                        'Content-Type': 'application/json'
                    }

                }).success(function (data, status) {

                    $scope.message = "createQuestion:success";
                    $scope.goToDiscussion();

                }).error(function (data, status) {

                    $scope.message = "createQuestion:error";
                })
            }
        }

}]);