"use strict";

// "Small" controllers are here. When a controller becomes too big (> X lines of code), put it in its own file

voteApp.controller('adminConfigureInstanceCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService', 
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

  $scope.current_step = 1;
  $scope.current_substep = 1;

  $scope.widget_uri = null; // "local:Widget/24"
  $scope.widget_endpoint = null; // "/data/Widget/24"
  $scope.target = null;

  $scope.init = function(){
    console.log("adminConfigureInstanceCtl::init()");

    $scope.widget_uri = $routeParams.widget_uri;
    console.log($scope.widget_uri);

    if ( !$scope.widget_uri )
    {
      alert("Please provide a 'widget_uri' URL parameter.");
      $location.path( "/admin" );
    }

    $scope.target = $routeParams.target;

    $scope.widget_endpoint = AssemblToolsService.resourceToUrl($scope.widget_uri);
  };

  $scope.deleteThisWidget = function (){
      var approve = confirm("Do you confirm that you want to delete this widget instance?"); // TODO: i18n
      if ( approve )
      {
          $scope.deleteWidget($scope.widget_endpoint, $("#widget_delete_result"));
      }
  };

  $scope.deleteWidget = function(endpoint, result_holder){
      $http({
          method: 'DELETE',
          url: endpoint,
          headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).success(function(data, status, headers){
          console.log("success");
          result_holder.text("Success!");
          alert("The widget has been successfully deleted!"); // TODO: i18n
          window.parent.exitModal();
      }).error(function(status, headers){
          console.log("error");
          result_holder.text("Error");
      });
  };
}]);

voteApp.controller('adminConfigureInstanceSetSettingsItemCtl', ['$scope', 'VoteWidgetService', function($scope, VoteWidgetService){
  // ask and remove the remaining criteria if there are more than 1
  $scope.confirmDeleteRemainingCriteria = function(max_size) {
    if ( $scope.item.criteria.length > max_size && confirm('This item currently has more criteria than needed. Would you like to remove these remaining criteria?') )
    {
      $scope.item.criteria.splice(max_size, 999);
    }
  };

  $scope.$watch('item.type', function (newValue, oldValue) {
    if ( newValue != oldValue )
    {
      // create the necessary amount of criterion fields, depending on the item type chosen, and the minimum of criterion they require
      $.each(VoteWidgetService.item_types, function(index, item_type){
        if ( 'key' in item_type && newValue == item_type.key ){
          if ( 'number_of_criteria' in item_type ){
            while ( $scope.item.criteria.length < item_type.number_of_criteria ){
              var criterion = {};
              VoteWidgetService.addDefaultFields(criterion, VoteWidgetService.mandatory_criterion_fields);
              $scope.widget.settings.items[$scope.item_index].criteria.push(criterion);
            }
            $scope.confirmDeleteRemainingCriteria(item_type.number_of_criteria);
          }
        }
      });
    }
  });
}]);

voteApp.controller('adminConfigureInstanceSetSettingsItemCriterionCtl', ['$scope', function($scope){
  // pre-fill "name" field: if the user selects a criterion for a voting item (or sets the currently selected criterion to another one), set its "pretty" name to the criterion shortTitle
  $scope.$watch('criterion.entity_id', function (newValue, oldValue) {
    if ( newValue != oldValue ) // && !$scope.criterion.name
    {
      var criterionWithDetails = _.find($scope.criteria, function(criterion){
        return criterion["@id"] == newValue;
      });
      if ( criterionWithDetails && criterionWithDetails.shortTitle )
        $scope.criterion.name = criterionWithDetails.shortTitle;
    }
  });
}]);


voteApp.controller('votedCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion){

  $scope.init = function(){
    console.log("votedCtl::init()");

    $scope.settings = configService.settings;
    console.log("settings:");
    console.log($scope.settings);
  }

}]);

voteApp.controller('resultsCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("resultsCtl::init()");

      console.log("configService:");
      console.log(configService);
      $scope.settings = configService.settings;
      console.log("settings 0:");
      console.log($scope.settings);


      // check that the user is logged in
      if ( !configService.user || !configService.user.verified )
      {
        alert('You have to be authenticated to vote. Please log in and try again.');
        window.location.assign("/login");
        return;
      }
      $scope.user = configService.user;
      

      // TODO (when the API is implemented): check that the user has the right to participate in this vote

      $scope.vote_results_uri = configService.vote_results_url;
      $scope.vote_count_uri = configService.vote_count_url;

      $scope.vote_results_endpoint = AssemblToolsService.resourceToUrl($scope.vote_results_uri);
      $scope.vote_count_endpoint = AssemblToolsService.resourceToUrl($scope.vote_count_uri);

    };

}]);
