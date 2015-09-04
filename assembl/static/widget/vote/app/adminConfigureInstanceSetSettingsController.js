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
        console.log("fct_get_type() => ", object_type, property, property_type);
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

  /*
  This method iterates over vote_specifications and for each element, looks for an id.
  If no id, POST the VoteSpec, get its new id, and set it in the id json field.
  If there is an id, PUT the already existing VoteSpec to replace it
  */
  $scope.updateVoteSpecifications = function() {
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

      el = _.find(VoteWidgetService.mandatory_criterion_fields, function(el) {
        return "key" in el && el.key == property_name;
      });
      if (el && "type" in el)
        return el.type;

      if (criterion_type in VoteWidgetService.mandatory_typed_criterion_fields) {
        el = _.find(VoteWidgetService.mandatory_typed_criterion_fields[criterion_type], function(el) {
          return "key" in el && el.key == property_name;
        });
        if (el && "type" in el)
          return el.type;
      }

      el = _.find(VoteWidgetService.optional_criterion_fields, function(el) {
        return "key" in el && el.key == property_name;
      });
      if (el && "type" in el)
        return el.type;

      if (criterion_type in VoteWidgetService.optional_typed_criterion_fields) {
        el = _.find(VoteWidgetService.optional_typed_criterion_fields[criterion_type], function(el) {
          return "key" in el && el.key == property_name;
        });
        if (el && "type" in el)
          return el.type;
      }

      return null;
    };

    var updateSettingsAfterPostVoteSpec = _.debounce($scope.applyWidgetSettings, 300);
    
    if ("items" in $scope.widget.settings) {
      $scope.widget.settings.items.forEach(function(item, item_index, item_ar) {
        if ("vote_specifications" in item) {
          item.vote_specifications.forEach(function(el, el_index, el_ar) {
            var known_properties = ["@type", "minimum", "maximum", "criterion_idea", "widget", "question_id", "num_choices", "settings"]; // TODO: the content of this array should depend on the value of VoteSpec["@type"]
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
              _.delay(putJson, item_index * 500, endpoint, post_data, result_holder);
              
            }
            else { // if it does not exist in the backend yet, we create it using POST
              var el2 = _.clone(el);
              el2 = $scope.ensurePropertiesTypes(el2, getCriterionPropertyType);
              post_data = $scope.moveUnknownProperties(el2, known_properties, "settings");
              post_data["question_id"] = item_index;

              endpoint = collection_endpoint;
              var postNewVoteSpecPromiseGenerator = function(){
                return VoteWidgetService.postJson(endpoint, post_data, result_holder);
              };
              var promise = AssemblToolsService.afterDelayPromiseGenerator(item_index * 500, postNewVoteSpecPromiseGenerator);

              promise.then(function(res) { // /!\ this is not function(data, status, headers), but the single parameter is an object which contains a data field
                var data = "data" in res ? res.data : null;
                // set @id in current json
                console.log("updateVoteSpecifications success:", res);
                if ("@id" in data) {
                  console.log("there is a '@id' field in data: ", data["@id"]);
                  //el["@id"] = data["@id"];
                  $scope.widget.settings.items[item_index].vote_specifications[el_index]["@id"] = data["@id"];
                }
                else {
                  alert("error: There is no '@id' field in received data of the newly created vote specification");
                }

                console.log("settings after:", $scope.widget.settings);
                updateSettingsAfterPostVoteSpec();
              });
            }
          });
        }
      });
    }
  };

    $scope.saveWidgetSettings = function() {
    // ugly!
    $scope.applyWidgetSettings();
    $scope.updateVoteSpecifications();
  };

    $scope.applyWidgetSettings = function() {
    console.log("applyWidgetSettings()");

    var endpoint = $scope.widget_endpoint + "/settings";
    var post_data = $scope.widget.settings;
    var result_holder = $("#step_criteria_groups_and_appearance_result");
    VoteWidgetService.putJson(endpoint, post_data, result_holder);
  };

  }]);
