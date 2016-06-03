"use strict";

voteApp.controller('adminConfigureInstanceSetSettingsCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'AssemblToolsService', 'VoteWidgetService', 
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, AssemblToolsService, VoteWidgetService) {

    $scope.current_step = 1;
    $scope.current_substep = 1;

    $scope.widget_uri = null; // "local:Widget/24"
    $scope.widget_endpoint = null; // "/data/Widget/24"
    $scope.widget = null;
    $scope.discussion_uri = null; // "local:Discussion/1"
    //$scope.criteria_url = null; // "local:Discussion/1/widgets/66/criteria"
    //$scope.criteria_endpoint = null; // "/data/Discussion/1/widgets/66/criteria"
    $scope.criteria = null; // array of ideas (their full structure)
    $scope.vote_specifications = null; // array of vote specs (descriptions of items)
    $scope.ideas = null; // array of ideas

    $scope.mandatory_settings_fields = VoteWidgetService.mandatory_settings_fields;
    $scope.optional_settings_fields = VoteWidgetService.optional_settings_fields;
    $scope.mandatory_item_fields = VoteWidgetService.mandatory_item_fields;
    $scope.optional_item_fields = VoteWidgetService.optional_item_fields;
    $scope.mandatory_criterion_fields = VoteWidgetService.mandatory_criterion_fields;
    $scope.optional_criterion_fields = VoteWidgetService.optional_criterion_fields;
    $scope.item_types = VoteWidgetService.item_types;
    $scope.mandatory_typed_criterion_fields = VoteWidgetService.mandatory_typed_criterion_fields;
    $scope.mandatory_category_fields = VoteWidgetService.mandatory_category_fields;

    //$scope.optional_typed_criterion_fields = VoteWidgetService.optional_typed_criterion_fields;

    // build an object of array, which will be used by Angular to build a <select> DOM element where <option>s will be grouped into <optgroup> by criterion type
    $scope.aggregated_optional_criterion_fields_by_type = {}; // will be like { "LickertIdeaVote": [ {"key": "description", "type": "all", ..}, {"key": "descriptionMin", "type": "LickertIdeaVote", ..}, .. ], .. }
    for (var j = 0; j < VoteWidgetService.criterion_types.length; ++j) {
      var type_key = VoteWidgetService.criterion_types[j].key;
      $scope.aggregated_optional_criterion_fields_by_type[type_key] = [];

      // general fields
      for (var i = 0; i < VoteWidgetService.optional_criterion_fields.length; ++i) {
        var el = VoteWidgetService.optional_criterion_fields[i];
        el.criterion_type = 'all';
        $scope.aggregated_optional_criterion_fields_by_type[type_key].push(el);
      }

      // type-specific fields
      if (type_key in VoteWidgetService.optional_typed_criterion_fields) { 
        var val = VoteWidgetService.optional_typed_criterion_fields[type_key];
        for (var i = 0; i < val.length; ++i) {
          val[i].criterion_type = type_key;
          $scope.aggregated_optional_criterion_fields_by_type[type_key].push(val[i]);
        }
      }
    }

    // build an object of array
    $scope.aggregated_mandatory_criterion_fields_by_type = {}; // will be like { "LickertIdeaVote": [ {"key": "description", "type": "all", ..}, {"key": "descriptionMin", "type": "LickertIdeaVote", ..}, .. ], .. }
    for (var j = 0; j < VoteWidgetService.criterion_types.length; ++j) {
      var type_key = VoteWidgetService.criterion_types[j].key;
      $scope.aggregated_mandatory_criterion_fields_by_type[type_key] = [];

      // general fields
      for (var i = 0; i < VoteWidgetService.mandatory_criterion_fields.length; ++i) {
        var el = VoteWidgetService.mandatory_criterion_fields[i];
        el.criterion_type = 'all';
        $scope.aggregated_mandatory_criterion_fields_by_type[type_key].push(el);
      }

      // type-specific fields
      if (type_key in VoteWidgetService.mandatory_typed_criterion_fields) { 
        var val = VoteWidgetService.mandatory_typed_criterion_fields[type_key];
        for (var i = 0; i < val.length; ++i) {
          val[i].criterion_type = type_key;
          $scope.aggregated_mandatory_criterion_fields_by_type[type_key].push(val[i]);
        }
      }
    }

    $scope.criterion_current_selected_field = null;
    $scope.settings_current_selected_field = null;
    $scope.item_current_selected_field = null;

    $scope.init = function() {
    console.log("adminConfigureFromIdeaCtl::init()");
    $scope.widget_uri = $routeParams.widget_uri;
    console.log($scope.widget_uri);

    // get widget information from its endpoint

    $scope.widget_endpoint = AssemblToolsService.resourceToUrl($scope.widget_uri);

    $http({
      method: 'GET',
      url: $scope.widget_endpoint
    }).success(function(data, status, headers) {
      console.log(data);
      $scope.widget = data;
      $scope.updateOnceWidgetIsReceived();
    });

  };

    $scope.getOptionalFieldCategoryName = function(key) {
    if (key == 'all')
      return "General";
    if (key == 'LickertIdeaVote')
      return "Optional fields for type Lickert";
    if (key == 'BinaryIdeaVote')
      return "Optional fields for type Binary";
    return "Unknown";
  };

    $scope.addItem = function() {
    var item = {
      'criteria': [],
      'vote_specifications': []
    };
    VoteWidgetService.addDefaultFields(item, $scope.mandatory_item_fields);
    $scope.widget.settings.items.push(item);
  };

    $scope.addCriterion = function(item_index) {
    var criterion = {};
    VoteWidgetService.addDefaultFields(criterion, $scope.mandatory_criterion_fields);

    //$scope.widget.settings.items[item_index].criteria.push(criterion);
    $scope.widget.settings.items[item_index].vote_specifications.push(criterion);
  };

    $scope.resetCriterionFromType = function(item_index, criterion_index) {
    console.log("resetCriterionFromType()");

    //var criterion = $scope.widget.settings.items[item_index].criteria[criterion_index];
    var criterion = $scope.widget.settings.items[item_index].vote_specifications[criterion_index];
    console.log("criterion before reset: ", criterion);
    VoteWidgetService.resetCriterionFromType(criterion);
  };

    $scope.addCriterionField = function(item_index, criterion_index, field_name) {
    //console.log("addCriterionField(): ", item_index, criterion_index, field_name);
    if (field_name) {
      //$scope.widget.settings.items[item_index].criteria[criterion_index][field_name] = VoteWidgetService.getFieldDefaultValue($scope.optional_criterion_fields, field_name, true);
      //var current_criterion = $scope.widget.settings.items[item_index].criteria[criterion_index];
      var current_criterion = $scope.widget.settings.items[item_index].vote_specifications[criterion_index];
      var defaultValue = null;
      defaultValue = VoteWidgetService.getFieldDefaultValue($scope.aggregated_optional_criterion_fields_by_type[current_criterion["@type"]], field_name, true);

      //console.log("defaultValue: ", defaultValue);
      //$scope.widget.settings.items[item_index].criteria[criterion_index][field_name] = defaultValue;
      $scope.widget.settings.items[item_index].vote_specifications[criterion_index][field_name] = defaultValue;

      //console.log("settings items after: ", $scope.widget.settings.items);
    }
  };

  $scope.addTokenCategoryInCriterion = function(item_index, criterion_index) {
    console.log("addTokenCategoryInCriterion()");
    /*
    var data = {
      token_vote_specification: $scope.widget.settings.items[item_index].vote_specifications[criterion_index]["@id"]
    };
    $scope.widget.settings.items[item_index].vote_specifications[criterion_index].token_categories.push(data);
    */
    if ( !(criterion_index in $scope.widget.vote_specifications) || !("@id" in $scope.widget.vote_specifications[criterion_index]) ){
      alert("The vote specification you are trying to add a token category to has not been saved yet. Please save before adding a token category.");
      return;
    }
    var data = {
      token_vote_specification: $scope.widget.vote_specifications[criterion_index]["@id"]
    };
    VoteWidgetService.addDefaultFields(data, $scope.mandatory_category_fields);
    if ( !("token_categories" in $scope.widget.vote_specifications[criterion_index]) ){
      $scope.widget.vote_specifications[criterion_index].token_categories = [];
    }
    $scope.widget.vote_specifications[criterion_index].token_categories.push(data);
  };

    $scope.addItemField = function(item_index, field_name) {
    $scope.widget.settings.items[item_index][field_name] = VoteWidgetService.getFieldDefaultValue($scope.optional_item_fields, field_name, true);
  };

    $scope.addSettingsField = function(field_name) {
    $scope.widget.settings[field_name] = VoteWidgetService.getFieldDefaultValue($scope.optional_settings_fields, field_name, true);
  };

    $scope.addCriterionFieldElement = function(item_index, criterion_index, field_name) {
    if (!(field_name in $scope.widget.settings.items[item_index].vote_specifications[criterion_index])) {
      $scope.widget.settings.items[item_index].vote_specifications[criterion_index][field_name] = [];
    }

    $scope.widget.settings.items[item_index].vote_specifications[criterion_index][field_name].push('');
    console.log("value of array after push: ", $scope.widget.settings.items[item_index].vote_specifications[criterion_index][field_name]);
  };

    $scope.deleteCriterionField = function(item_index, criterion_index, field_name) {
    //delete $scope.widget.settings.items[item_index].criteria[criterion_index][field_name];
    delete $scope.widget.settings.items[item_index].vote_specifications[criterion_index][field_name];
  };

    $scope.deleteCriterionFieldElement = function(item_index, criterion_index, field_name, element_index) {
    console.log("value of array before delete: ", $scope.widget.settings.items[item_index].vote_specifications[criterion_index][field_name]);
    $scope.widget.settings.items[item_index].vote_specifications[criterion_index][field_name].splice(element_index, 1);
    console.log("value of array after delete: ", $scope.widget.settings.items[item_index].vote_specifications[criterion_index][field_name]);
  };

    $scope.deleteItemField = function(item_index, field_name) {
    delete $scope.widget.settings.items[item_index][field_name];
  };

    $scope.deleteSettingsField = function(field_name) {
    delete $scope.widget.settings[field_name];
  };

  $scope.deleteTokenCategory = function(item_index, criterion_index, category_index){
    var id_field = "@id";
    if ( id_field in $scope.widget.vote_specifications[criterion_index].token_categories[category_index] ){
      // DELETE the category with an API call
      $http({
        method: 'DELETE',
        url: AssemblToolsService.resourceToUrl($scope.widget.vote_specifications[criterion_index].token_categories[category_index][id_field]),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).success(function(data, status, headers) {
        console.log("DELETE success");
      }).error(function(status, headers) {
        console.log("DELETE error");
      });
    }

    // delete $scope.widget.settings.items[item_index].vote_specifications[criterion_index].token_categories[category_index];
    $scope.widget.vote_specifications[criterion_index].token_categories.splice(category_index, 1);
  };

    $scope.updateOnceWidgetIsReceived = function() {
    if (!$scope.widget.settings || !$scope.widget.settings.items)
        $scope.widget.settings = {"items":[]};
    VoteWidgetService.addDefaultFields($scope.widget.settings, $scope.mandatory_settings_fields);
    console.log("$scope.widget.settings:");
    console.log($scope.widget.settings);

    $scope.discussion_uri = "discussion" in $scope.widget ? $scope.widget.discussion : null;

    //$scope.criteria_url = $scope.widget.criteria_url;
    //$scope.criteria_endpoint = AssemblToolsService.resourceToUrl($scope.criteria_url);
    if ("criteria" in $scope.widget) {
      $scope.criteria = $scope.widget.criteria;

      //console.log("$scope.criteria:");
      //console.log($scope.criteria);
    }
    else {
      console.log("we did not receive any widget.criteria");
    }

    if ("vote_specifications" in $scope.widget) {
      $scope.vote_specifications = $scope.widget.vote_specifications;
      console.log("$scope.vote_specifications:");
      console.log($scope.vote_specifications);
    }
    else {
      console.log("we did not receive any widget.vote_specifications");
    }

    // get the list of ideas in this discussion
    if ($scope.discussion_uri) {
      var ideas_endpoint_url = AssemblToolsService.resourceToUrl($scope.discussion_uri) + '/ideas?view=default';
      $http({
        method: 'GET',
        url: ideas_endpoint_url
      }).success(function(data, status, headers) {
        //console.log("ideas received: ", data);
        $scope.ideas = data;
      });
    }

    // simplify LangStrings to strings
    if ( "vote_specifications" in $scope.widget && _.isArray($scope.widget.vote_specifications) ){
      $scope.widget.vote_specifications.forEach(function(vote_spec) {
        if ( "token_categories" in vote_spec && _.isArray(vote_spec.token_categories) ){
          vote_spec.token_categories.forEach(function(category){
            if ( "name" in category && "@type" in category.name && category.name["@type"] == "LangString" ){
              category.name = $scope.LangStringToString(category.name);
            }
          });
        }
      });
    }

    $scope.current_step = 2;
  };

    $scope.removeItem = function(index) {
    if (confirm("Are you sure you want to delete this item?")) {
      
      // remove associated VoteSpecs
      var item = $scope.widget.settings.items[index];
      if ("vote_specifications" in item) {
        item.vote_specifications.forEach(function(vote_spec) {
          if ("@id" in vote_spec) {
            $http({
              method: 'DELETE',
              url: AssemblToolsService.resourceToUrl(vote_spec["@id"]),

              //data: $.param(post_data),
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
            }).success(function(data, status, headers) {
              console.log("DELETE success");
            }).error(function(status, headers) {
              console.log("DELETE error");
            });
          }
        });
      }

      // now remove the item
      $scope.widget.settings.items.splice(index, 1);
    }
  };
  
  $scope.moveUnknownProperties = function(object, known_properties, target_property) {
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        if (known_properties.indexOf(property) == -1) {
          if (!(target_property in object)) {
            object[target_property] = {};
          }

          object[target_property][property] = object[property];
          delete object[property];
        }
      }
    }

    return object;
  };

  $scope.ensurePropertiesTypes = function(object, fct_get_type) {
    for (var property in object) {
      if (object.hasOwnProperty(property)) {
        var object_type = "@type" in object ? object["@type"] : null;
        var property_type = fct_get_type(object_type, property);
        // console.log("fct_get_type() => ", object_type, property, property_type);
        if (property_type != null) {
          if (property_type == "integer") {
            var to_integer = parseInt(object[property], 10);
            if ((typeof object[property] != "number") || object[property] !== to_integer) {
              object[property] = to_integer;
            }
          }
        }
      }
    }

    return object;
  };

  $scope.stringToLangString = function(str){
    return {
      "entries": [
        {
          "value": str,
          "@type": "LangStringEntry",
          "@language": "und",
          "error_count": 0
        }
      ],
      "@type": "LangString"
    };
  };

  $scope.LangStringToString = function(langString){
    if ( "entries" in langString && _.isArray(langString.entries) && langString.entries.length > 0 && "value" in langString.entries[0] ){
      return langString.entries[0].value;
    }
    return null;
  };

  /*
  This method iterates over vote_specifications and for each element, looks for an id.
  If no id, POST the VoteSpec, get its new id, and set it in the id json field.
  If there is an id, PUT the already existing VoteSpec to replace it
  */
  $scope.saveVoteSpecificationsAndSettingsField = function() {
    var id_field = "@id";
    var collection = $scope.widget.settings.vote_specifications;
    if (!("votespecs_url" in $scope.widget)) {
      console.log("error: no votespecs_url field in widget, so we can't POST/PUT to any endpoint");
      return;
    }

    var collection_endpoint = AssemblToolsService.resourceToUrl($scope.widget.votespecs_url);
    var post_data = null;
    var endpoint = null;
    var result_holder = $("#step_criteria_groups_and_appearance_result");

    var getCriterionPropertyType = function(criterion_type, property_name) {
      var el = null;

      el = _.findWhere(VoteWidgetService.mandatory_criterion_fields, { "key": property_name });
      if (el && "type" in el)
        return el.type;

      if (criterion_type in VoteWidgetService.mandatory_typed_criterion_fields) {
        el = _.findWhere(VoteWidgetService.mandatory_typed_criterion_fields[criterion_type], { "key": property_name });
        if (el && "type" in el)
          return el.type;
      }

      el = _.findWhere(VoteWidgetService.optional_criterion_fields, { "key": property_name });
      if (el && "type" in el)
        return el.type;

      if (criterion_type in VoteWidgetService.optional_typed_criterion_fields) {
        el = _.findWhere(VoteWidgetService.optional_typed_criterion_fields[criterion_type], { "key": property_name });
        if (el && "type" in el)
          return el.type;
      }

      return null;
    };

    var debouncedSaveWidgetSettingsField = _.debounce($scope.saveWidgetSettingsField, 700);
    var saveWidgetSettingsFieldAfterPostVoteSpec = function(){
      result_holder.text("Saving...");
      debouncedSaveWidgetSettingsField();
    };
    
    var ajaxRequestsSent = 0;
    
    if ("items" in $scope.widget.settings) {
      $scope.widget.settings.items.forEach(function(item, item_index, item_ar) {
        if ("vote_specifications" in item) {
          item.vote_specifications.forEach(function(el, el_index, el_ar) {
            var known_properties = ["@type", "minimum", "maximum", "criterion_idea", "widget", "question_id", "num_choices", "settings", "exclusive_categories"]; // TODO: the content of this array should depend on the value of VoteSpec["@type"]
            if (id_field in el) { // if it already exist in the backend, we update it using PUT
              var el2 = _.clone(el);
              el2 = $scope.ensurePropertiesTypes(el2, getCriterionPropertyType);
              post_data = $scope.moveUnknownProperties(el2, known_properties, "settings");
              post_data["question_id"] = item_index;

              endpoint = AssemblToolsService.resourceToUrl(el[id_field]);

              // Instead of using:
              // VoteWidgetService.putJson(endpoint, post_data, result_holder);
              // we delay each API call a bit more than the previous one, so that the server does not get overwhelmed.
              // (by the use of the same question_id parameter for 2 criteria)
              var putJson = _.bind(VoteWidgetService.putJson, VoteWidgetService);
              _.delay(putJson, (ajaxRequestsSent++) * 500, endpoint, post_data, result_holder, "show_only_error");
              
            }
            else { // if it does not exist in the backend yet, we create it using POST
              var el2 = _.clone(el);
              el2 = $scope.ensurePropertiesTypes(el2, getCriterionPropertyType);
              post_data = $scope.moveUnknownProperties(el2, known_properties, "settings");
              post_data["question_id"] = item_index;

              endpoint = collection_endpoint;
              var postNewVoteSpecPromiseGenerator = function(endpoint, post_data, result_holder, display_filter){
                return function(){
                    return VoteWidgetService.postJson(endpoint, post_data, result_holder, display_filter);
                }
              };
              var promise = AssemblToolsService.afterDelayPromiseGenerator((ajaxRequestsSent++) * 500, postNewVoteSpecPromiseGenerator(endpoint, post_data, result_holder, "show_only_error"));

              promise.then(function(res) { // /!\ this is not function(data, status, headers), but the single parameter is an object which contains a data field
                var data = "data" in res ? res.data : null;
                // set @id in current json
                console.log("saveVoteSpecificationsAndSettingsField success:", res);
                if ("@id" in data) {
                  console.log("there is a '@id' field in data: ", data["@id"]);
                  //el["@id"] = data["@id"];
                  $scope.widget.settings.items[item_index].vote_specifications[el_index]["@id"] = data["@id"];
                  if ( !_.findWhere($scope.widget.vote_specifications, {"@id": data["@id"]}) ){
                    console.log("the vote spec which has just been created was not found in widget.vote_specifications, adding it");
                    $scope.widget.vote_specifications.push($scope.widget.settings.items[item_index].vote_specifications[el_index]);
                  }
                }
                else {
                  alert("error: There is no '@id' field in received data of the newly created vote specification");
                }

                console.log("settings after:", $scope.widget.settings);
                saveWidgetSettingsFieldAfterPostVoteSpec();
              });
            }


            var getTokenCategoryFieldType = function(container_type, field_key){
              console.log("getTokenCategoryFieldType ", container_type, field_key);
              var field = _.findWhere(VoteWidgetService.mandatory_category_fields, { "key": field_key });
              if (field){
                if ( "type" in field ){
                  console.log("field['type']: ", field["type"]);
                  return field["type"];
                }
              }
              return null;
            };

            // update (create via POST or update via PUT) the token categories
            if ( el_index in $scope.widget.vote_specifications && "token_categories" in $scope.widget.vote_specifications[el_index] ){
              $scope.widget.vote_specifications[el_index].token_categories.forEach(function(category, category_index, category_ar) {
                if (id_field in category) { // if it already exist in the backend, we update it using PUT
                  post_data = _.clone(category);
                  post_data = $scope.ensurePropertiesTypes(post_data, getTokenCategoryFieldType);
                  post_data["token_vote_specification"] = el[id_field];
                  post_data["name"] = $scope.stringToLangString(post_data["name"]);

                  endpoint = AssemblToolsService.resourceToUrl(category[id_field]);

                  // Instead of using:
                  // VoteWidgetService.putJson(endpoint, post_data, result_holder);
                  // we delay each API call a bit more than the previous one, so that the server does not get overwhelmed.
                  // (by the use of the same question_id parameter for 2 criteria)
                  var putJson = _.bind(VoteWidgetService.putJson, VoteWidgetService);
                  _.delay(putJson, (ajaxRequestsSent++) * 500, endpoint, post_data, result_holder, "show_only_error");
                } else { // if it does not exist in the backend yet, we create it using POST
                  post_data = _.clone(category);
                  post_data = $scope.ensurePropertiesTypes(post_data, getTokenCategoryFieldType);
                  delete post_data["token_vote_specification"];
                  post_data["name"] = $scope.stringToLangString(post_data["name"]);

                  endpoint = AssemblToolsService.resourceToUrl(el[id_field]) + "/token_categories";
                  var postNewCategoryPromiseGenerator = function(endpoint, post_data, result_holder, display_filter){
                    return function(){
                        return VoteWidgetService.postJson(endpoint, post_data, result_holder, display_filter);
                    }
                  };
                  var promise = AssemblToolsService.afterDelayPromiseGenerator((ajaxRequestsSent++) * 500, postNewCategoryPromiseGenerator(endpoint, post_data, result_holder, "show_only_error"));

                  promise.then(function(res) { // /!\ this is not function(data, status, headers), but the single parameter is an object which contains a data field
                    var data = "data" in res ? res.data : null;
                    // set @id in current json
                    console.log("saveCategory success:", res);
                    if ("@id" in data) {
                      console.log("there is a '@id' field in data: ", data["@id"]);
                      $scope.widget.vote_specifications[el_index].token_categories[category_index]["@id"] = data["@id"];
                    }
                    else {
                      alert("error: There is no '@id' field in received data of the newly created token category");
                    }

                    console.log("settings after:", $scope.widget.settings);
                    saveWidgetSettingsFieldAfterPostVoteSpec();
                  });
                }
              });
            }




          });
        }
      });
    }

    saveWidgetSettingsFieldAfterPostVoteSpec();
  };

  $scope.saveWidget = function() {
    $scope.removeDanglingVoteSpecifications();
    $scope.saveVoteSpecificationsAndSettingsField();
  };

  $scope.saveWidgetSettingsField = function() {
    console.log("saveWidgetSettingsField()");

    var endpoint = $scope.widget_endpoint + "/settings";
    var post_data = $scope.widget.settings;
    var result_holder = $("#step_criteria_groups_and_appearance_result");
    VoteWidgetService.putJson(endpoint, post_data, result_holder);
  };

  $scope.removeDanglingVoteSpecifications = function(){
    var settings = $scope.widget.settings;
    var vote_specifications = $scope.widget.vote_specifications;

    var vote_specifications_really_used = null;
    if ( "items" in settings ){
        vote_specifications_really_used = _.pluck(settings.items, "vote_specifications");
        // now vote_specifications_really_used is an array of arrays of vote specifications
        vote_specifications_really_used = _.flatten(vote_specifications_really_used);
        // now vote_specifications_really_used is an array of vote specifications
        vote_specifications_really_used = _.pluck(vote_specifications_really_used, "@id");
        // now vote_specifications_really_used is an array of vote specification ids
    }

    if ( vote_specifications && vote_specifications.length ){
        vote_specifications.forEach(function(vote_spec, vote_spec_index){
            var vote_spec_id = "@id" in vote_spec ? vote_spec["@id"] : null;
            if ( vote_spec_id && !_.contains(vote_specifications_really_used, vote_spec_id) ){
                // this vote spec has an @id but is not used by any item, so we have to DELETE it
                console.log("because it is associated to the widget but not used by any item, we are going to DELETE vote spec " + vote_spec_id + " : ", vote_spec);
                $http({
                  method: 'DELETE',
                  url: AssemblToolsService.resourceToUrl(vote_spec["@id"]),
                  headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                }).success(function(data, status, headers) {
                  console.log("DELETE success");
                }).error(function(status, headers) {
                  console.log("DELETE error");
                });
            }
        });
    }
  };

  }]);
