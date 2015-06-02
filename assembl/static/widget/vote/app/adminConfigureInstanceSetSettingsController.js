"use strict";

voteApp.controller('adminConfigureInstanceSetSettingsCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService', 
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

  $scope.current_step = 1;
  $scope.current_substep = 1;

  $scope.widget_uri = null; // "local:Widget/24"
  $scope.widget_endpoint = null; // "/data/Widget/24"
  $scope.widget = null;
  //$scope.discussion_uri = null; // "local:Discussion/1"
  //$scope.criteria_url = null; // "local:Discussion/1/widgets/66/criteria"
  //$scope.criteria_endpoint = null; // "/data/Discussion/1/widgets/66/criteria"
  $scope.criteria = null; // array of ideas (their full structure)


  $scope.mandatory_settings_fields = VoteWidgetService.mandatory_settings_fields;
  $scope.optional_settings_fields = VoteWidgetService.optional_settings_fields;
  $scope.mandatory_item_fields = VoteWidgetService.mandatory_item_fields;
  $scope.optional_item_fields = VoteWidgetService.optional_item_fields;
  $scope.mandatory_criterion_fields = VoteWidgetService.mandatory_criterion_fields;
  $scope.optional_criterion_fields = VoteWidgetService.optional_criterion_fields;
  $scope.item_types = VoteWidgetService.item_types;
  $scope.mandatory_typed_criterion_fields = VoteWidgetService.mandatory_typed_criterion_fields;
  //$scope.optional_typed_criterion_fields = VoteWidgetService.optional_typed_criterion_fields;


  // build an object of array, which will be used by Angular to build a <select> DOM element where <option>s will be grouped into <optgroup> by criterion type
  $scope.aggregated_optional_criterion_fields_by_type = {}; // will be like { "LickertIdeaVote": [ {"key": "description", "type": "all", ..}, {"key": "descriptionMin", "type": "LickertIdeaVote", ..}, .. ], .. }
  for ( var j = 0; j < VoteWidgetService.criterion_types.length; ++j ) {
    var type_key = VoteWidgetService.criterion_types[j].key;
    $scope.aggregated_optional_criterion_fields_by_type[type_key] = [];
    // general fields
    for ( var i = 0; i < VoteWidgetService.optional_criterion_fields.length; ++i) {
      var el = VoteWidgetService.optional_criterion_fields[i];
      el.criterion_type = 'all';
      $scope.aggregated_optional_criterion_fields_by_type[type_key].push(el);
    }
    // type-specific fields
    if ( type_key in VoteWidgetService.optional_typed_criterion_fields ){ 
      var val = VoteWidgetService.optional_typed_criterion_fields[type_key];
      for ( var i = 0; i < val.length; ++i) {
        val[i].criterion_type = type_key;
        $scope.aggregated_optional_criterion_fields_by_type[type_key].push(val[i]);
      }
    }
  }



  $scope.criterion_current_selected_field = null;
  $scope.settings_current_selected_field = null;
  $scope.item_current_selected_field = null;

  $scope.init = function(){
    console.log("adminConfigureFromIdeaCtl::init()");
    $scope.widget_uri = $routeParams.widget_uri;
    console.log($scope.widget_uri);


    // get widget information from its endpoint

    $scope.widget_endpoint = AssemblToolsService.resourceToUrl($scope.widget_uri);

    $http({
      method: 'GET',
      url: $scope.widget_endpoint
    }).success(function(data, status, headers){
      console.log(data);
      $scope.widget = data;
      $scope.updateOnceWidgetIsReceived();
    });

  };

  $scope.getOptionalFieldCategoryName = function(key){
    if ( key == 'all' )
      return "General";
    if ( key == 'LickertIdeaVote' )
      return "Optional fields for type Lickert";
    if ( key == 'BinaryIdeaVote' )
      return "Optional fields for type Binary";
    return "Unknown";
  };

  $scope.addItem = function(){
    var item = {
      'criteria': []
    };
    VoteWidgetService.addDefaultFields(item, $scope.mandatory_item_fields);
    $scope.widget.settings.items.push(item);
  };

  $scope.addCriterion = function(item_index){
    var criterion = {};
    VoteWidgetService.addDefaultFields(criterion, $scope.mandatory_criterion_fields);
    $scope.widget.settings.items[item_index].criteria.push(criterion);
  };

  $scope.resetCriterionFromType = function(item_index, criterion_index) {
    console.log("resetCriterionFromType()");
    var criterion = $scope.widget.settings.items[item_index].criteria[criterion_index];
    VoteWidgetService.resetCriterionFromType(criterion);
  };

  $scope.addCriterionField = function(item_index, criterion_index, field_name){
    //console.log("addCriterionField(): ", item_index, criterion_index, field_name);
    if ( field_name ){
      //$scope.widget.settings.items[item_index].criteria[criterion_index][field_name] = VoteWidgetService.getFieldDefaultValue($scope.optional_criterion_fields, field_name, true);
      var current_criterion = $scope.widget.settings.items[item_index].criteria[criterion_index];
      var defaultValue = null;
      defaultValue = VoteWidgetService.getFieldDefaultValue($scope.aggregated_optional_criterion_fields_by_type[current_criterion.type], field_name, true);
      //console.log("defaultValue: ", defaultValue);
      $scope.widget.settings.items[item_index].criteria[criterion_index][field_name] = defaultValue;
      //console.log("settings items after: ", $scope.widget.settings.items);
    }
  };

  $scope.addItemField = function(item_index, field_name){
    $scope.widget.settings.items[item_index][field_name] = VoteWidgetService.getFieldDefaultValue($scope.optional_item_fields, field_name, true);
  };

  $scope.addSettingsField = function(field_name){
    $scope.widget.settings[field_name] = VoteWidgetService.getFieldDefaultValue($scope.optional_settings_fields, field_name, true);
  };

  $scope.deleteCriterionField = function (item_index, criterion_index, field_name){
    delete $scope.widget.settings.items[item_index].criteria[criterion_index][field_name];
  };

  $scope.deleteItemField = function (item_index, field_name){
    delete $scope.widget.settings.items[item_index][field_name];
  };

  $scope.deleteSettingsField = function (field_name){
    delete $scope.widget.settings[field_name];
  };

  $scope.updateOnceWidgetIsReceived = function(){
    if (!$scope.widget.settings || !$scope.widget.settings.items)
        $scope.widget.settings = {"items":[]};
    VoteWidgetService.addDefaultFields($scope.widget.settings, $scope.mandatory_settings_fields);
    console.log("$scope.widget.settings:");
    console.log($scope.widget.settings);

    //$scope.discussion_uri = $scope.widget.discussion;
    //$scope.criteria_url = $scope.widget.criteria_url;
    //$scope.criteria_endpoint = AssemblToolsService.resourceToUrl($scope.criteria_url);
    $scope.criteria = $scope.widget.criteria;
    console.log("$scope.criteria:");
    console.log($scope.criteria);

    $scope.current_step = 2;
  };

  $scope.applyWidgetSettings = function(){
    console.log("applyWidgetSettings()");

    var endpoint = $scope.widget_endpoint + "/settings";
    var post_data = $scope.widget.settings;
    var result_holder = $("#step_criteria_groups_and_appearance_result");
    VoteWidgetService.putJson(endpoint, post_data, result_holder);
  };

}]);