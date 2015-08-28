'use strict';

AdminModule.controller('AdminController',
    ['$rootScope',
     '$scope',
     '$http',
     'growl',
     '$translate',
     'CardGameService',
     'ConfigService',
     'UtilsService',
     'config',

    function($rootScope, $scope, $http, growl, $translate, CardGameService, ConfigService, UtilsService, widget) {

      $scope.widget = widget;
      $scope.locale = $scope.locale || $rootScope.locale;
      // console.log("widget", widget);
      $scope.idea_title = widget.base_idea.shortTitle;
      $scope.home = widget['@id'];
      $scope.formData = {};

      $scope.goToDiscussion = function() {
        $scope.config_status = 1;
      }

      if (angular.isDefined(widget.settings)) {
        // console.log("widget.settings: ", widget.settings);
        if (widget.settings.question)
            $scope.formData.question = widget.settings.question;
        else
            $scope.formData.question = "";

        if ("start_date" in widget)
            $scope.formData.startDate = widget.start_date;

        if ("end_date" in widget)
            $scope.formData.endDate = widget.end_date;

        //Need to display button if there is a minimal config
        $scope.goToDiscussion();

      }

      $scope.$watch("message", function(value) {

        switch (value) {
          case 'createQuestion:success':
            $translate("The session was successfully configured").then(function (tr) {
              growl.success(tr);
            });
            break;
          case 'createQuestion:error':
          case 'setJeton:error':
            $translate("Sorry, an error occured").then(function (tr) {
              growl.error(tr);
            });
            break;
          case 'setJeton:success':
            $translate("Token added successfully").then(function (tr) {
              growl.success(tr);
            });
            break;
        }
      }, true);

      $scope.setSettings = function() {

        if ($scope.formData.startDate && $scope.formData.endDate) {

          $scope.formData.startDate = $scope.formData.startDate;
          $scope.formData.endDate = $scope.formData.endDate;

          var data = $scope.widget.settings || {},
              dates = {},
              startDate = $scope.formData.startDate,
              endDate = $scope.formData.endDate;
          if (startDate) {
            if (startDate instanceof Date) {
              startDate = startDate.toISOString();
            }
            dates.start_date = startDate;
          }
          if ($scope.formData.endDate) {
            if (endDate instanceof Date) {
              endDate = endDate.toISOString();
            }
            dates.end_date = endDate;
          }

          data.startDate = startDate;
          data.endDate = endDate;
          data.question = $scope.formData.question;
          data.idea = $scope.widget.settings.idea;

          $http({
            url: UtilsService.getURL($scope.widget.widget_settings_url),
            method: 'PUT',
            data: data,
            headers: {
              'Content-Type': 'application/json'
            }

          }).error(function(data, status) {
            $scope.message = "createQuestion:error";
          });
          $http({
            url: UtilsService.getURL($scope.widget["@id"]),
            method: "PATCH",
            data: dates,
            headers: {
              "Content-Type": "application/json"
            }
          }).success(function(data, status) {
            $scope.message = "createQuestion:success";
            $scope.goToDiscussion();
          }).error(function(data, status) {
            $scope.message = "createQuestion:error";
          });
        }
      }

    }]);
