"use strict";

var creativityServices = angular.module('creativityServices', ['ngResource']);

creativityServices.service('AssemblToolsService', ['$window', '$rootScope', '$log', function($window, $rootScope, $log) {
  this.resourceToUrl = function(str)
  {
    var start = "local:";
    if (str.indexOf(start) == 0)
    {
      str = "/data/" + str.slice(start.length);
    }

    return str;
  };
}]);

creativityServices.service('VoteWidgetService', ['$window', '$rootScope', '$log', '$http', function($window, $rootScope, $log, $http) {

  this.mandatory_settings_fields = [];

  this.optional_settings_fields = [
    {
      "key": "padding",
      "type": "integer",
      "label": "Padding in item",
      "default": 60,
      "description": "Empty space (in pixels) between the border of the votable item and its axis"
    },
    {
      "key": "minWidth",
      "type": "integer",
      "label": "Minimum width",
      "defaultAdmin": 600,
      "description": "Minimum width of the total voting area, in pixels (CSS property)"
    },
    {
      "key": "minHeight",
      "type": "integer",
      "label": "Minimum height",
      "defaultAdmin": 600,
      "description": "Minimum height of the total voting area, in pixels (CSS property)"
    },
    {
      "key": "displayStyle",
      "type": "select",
      "label": "Display style",
      "default": "classic",
      "description": "How voting items will be displayed ('classic' or 'table')",
      "options": {
        "classic": "classic",
        "table": "table"
      }
    },
    {
      "key": "background",
      "type": "text",
      "description": "Color or effect (CSS style) for the background of the page",
      "defaultAdmin":"#F2ECF8"
    },
    {
      "key": "showVoter",
      "label": "Show voter",
      "type": "select",
      "description": "Display 'You will be voting as \"name\".', and place it at the top or at the bottom of the screen",
      "default":"false",
      "options": {
        "false": "false",
        "top": "top",
        "bottom": "bottom"
      }
    },
    {
      "key": "showCriterionDescription",
      "label": "Show criterion description",
      "type": "select",
      "description": "Different ways of displaying the description associated to each criterion",
      "default":"tooltip",
      "options": {
        "false": "false",
        "tooltip": "tooltip",
        "text": "text"
      }
    }
  ];

  this.item_types = [
    {
      "key": "vertical_gauge",
      "label": "Vertical gauge (aka lickert): needs 1 criterion (of type Lickert)",
      "number_of_criteria": 1,
      "allowed_criteria_types": ["LickertVoteSpecification"]
    },
    {
      "key": "radio",
      "label": "Radio buttons: needs 1 criterion (of type Binary or MultipleChoice)",
      "number_of_criteria": 1,
      "allowed_criteria_types": ["BinaryVoteSpecification", "MultipleChoiceVoteSpecification"]
    },
    {
      "key": "2_axes",
      "label": "Two axes graph: needs 2 criteria (of type Lickert)",
      "number_of_criteria": 2,
      "allowed_criteria_types": ["LickertVoteSpecification"]
    }
  ];

  /*
  var item_types_options = {};
  for ( var i = 0; i < this.item_types.length; ++i ){
    if ( 'key' in this.item_types[i] )
    {
      if ( 'label' in this.item_types[i] )
        item_types_options[this.item_types[i].key] = this.item_types[i].label;
      else
        item_types_options[this.item_types[i].key] = this.item_types[i].key;
    }
  }
  */

  this.mandatory_item_fields = [
    {
      "key": "type",
      "type": "select",
      "label": "Item type",

      //"description": "",
      //"default": "vertical_gauge", // we do not set default, because we use the change event to populate criterion list
      //"options": item_types_options
      "options": this.item_types // format needed by "options" is: [ { "key": "bla", "label": "blabla" }, { "key": "bli", "label": "blibli" }]
    }
  ];

  this.optional_item_fields = [
    {
      "key": "width",
      "type": "integer",
      "label": "Width",
      "default": 300
    },
    {
      "key": "height",
      "type": "integer",
      "label": "Height",
      "default": 300
    },
    {
      "key": "question_id",
      "type": "integer",
      "label": "Order of appearance of the question",
      "default": 0
    }
  ];

  this.criterion_types = [
    {
      "key": "LickertVoteSpecification",

      // "description": "",
      "label": "Lickert"
    },
    {
      "key": "BinaryVoteSpecification",

      // "description": "",
      "label": "Binary"
    },
    {
      "key": "MultipleChoiceVoteSpecification",

      // "description": "",
      "label": "Multiple choice"
    }
  ];

  this.mandatory_criterion_fields = [
    /*{
      "key": "entity_id",
      "type": "criterion",
      "label": "Criterion entity id"
    },*/
    {
      "key": "name",
      "type": "text",
      "label": "Name",
      "storage": "settings"
    },
    {
      "key": "@type",
      "type": "select",
      "label": "Criterion type",

      // "description": "",
      // "default": "LickertIdeaVote", // we will probably use the change event to display the right fields
      "options": this.criterion_types
    }
  ];
  /*
  var possibleValues = {
    "key": "possibleValues",
    "type": "array",
    "description": "All candidates, represented by their key (an integer) and label.",
    "default": [ { "key": "Yes", "value": 1 }, { "key": "No", "value": 0 } ]
  };
  */
  this.mandatory_typed_criterion_fields = {
    "LickertVoteSpecification": [
      {
        "key": "minimum",
        "type": "integer",
        "default": 0,
        "description": "The minimum value which can be voted",
        "storage": "attribute"
      },
      {
        "key": "maximum",
        "type": "integer",
        "default": 100,
        "description": "The maximum value which can be voted",
        "storage": "attribute"
      }
    ],
    "BinaryVoteSpecification": [

      //possibleValues
      {
        "key": "labelNo",
        "type": "text",
        "description": "Label for the 'no' option. This text will be shown next to its corresponding radio button.",
        "default": "No",
        "storage": "settings"
      },
      {
        "key": "labelYes",
        "type": "text",
        "description": "Label for the 'yes' option. This text will be shown next to its corresponding radio button.",
        "default": "Yes",
        "storage": "settings"
      }
    ],
    "MultipleChoiceVoteSpecification": [// http://en.wikipedia.org/wiki/Plurality_voting_system
      {
        "key": "candidates",
        "label": "Candidates",
        "type": "array",
        "description": "The ordered list of candidates a voter can vote for.",
        "default": [
          "Candidate 1",
          "Candidate 2",
          "Candidate 3"
        ],
        "storage": "settings"
      },
      {
        "key": "num_choices",
        "label": "Number of candidates",
        "type": "integer",
        "description": "The number of candidates available.",
        "default": 3,
        "storage": "attribute"
      }
    ]
  };

  this.optional_criterion_fields = [
    {
      "key": "description",
      "type": "text",
      "description": "Text which will be shown around the votable item",
      "storage": "settings"
    },
    {
      "key": "criterion_idea",//"criterion_idea_id",
      "type": "idea_id",
      "label": "Criterion entity idea",
      "default": null,
      "storage": "attribute"
    }
  ];

  this.optional_typed_criterion_fields = {
    "LickertVoteSpecification": [
      {
        "key": "valueDefault",
        "type": "integer",
        "label": "default value",
        "description": "Value on which the votable item will be initially set",
        "storage": "settings"
      },
      {
        "key": "descriptionMin",
        "type": "text",
        "description": "Text which will be shown around the minimum value of the axis",
        "storage": "settings"
      },
      {
        "key": "descriptionMax",
        "type": "text",
        "description": "Text which will be shown around the maximum value of the axis",
        "storage": "settings"
      },
      {
        "key": "ticks",
        "label": "number of ticks",
        "type": "integer",
        "default": 5,
        "description": "Indicative number of ticks to be shown on the axis",
        "storage": "settings"
      },
      {
        "key": "colorMin",
        "type": "text",
        "description": "Color of the minimum value",
        "defaultAdmin":"#ff0000",
        "storage": "settings"
      },
      {
        "key": "colorMax",
        "type": "text",
        "description": "Color of the maximum value",
        "defaultAdmin":"#00ff00",
        "storage": "settings"
      },
      {
        "key": "colorAverage",
        "type": "text",
        "description": "Color of the average value",
        "defaultAdmin":"#ffff00",
        "storage": "settings"
      },
      {
        "key": "colorCursor",
        "type": "text",
        "description": "Color of the draggable cursor",
        "defaultAdmin":"#000000",
        "storage": "settings"
      }
    ]
  };

  this.addDefaultFields = function(obj, default_fields) {
    var sz = default_fields.length;
    for (var i = 0; i < sz; ++i)
    {
      var field = default_fields[i];
      if (!obj.hasOwnProperty(field.key)
        && field.hasOwnProperty("default"))
      {
        obj[field.key] = field.default;
      }
    }

    return obj;
  };

  this.resetCriterionFromType = function(criterion) {
    console.log("VoteWidgetService::resetCriterionFromType()");
    var criterion_type = criterion["@type"];

    //var criterion_reset = {};

    // keep original mandatory fields (entity_id, name, type)
    /*
    for ( var i = 0; i < this.mandatory_criterion_fields.length; ++i ){
      var key = this.mandatory_criterion_fields[i].key;
      if (key in criterion) 
        criterion_reset[key] = criterion[key];
    }
    */

    // add or reset mandatory typed criterion fields
    if (criterion_type in this.mandatory_typed_criterion_fields) {
      console.log("this.mandatory_typed_criterion_fields[", criterion_type, this.mandatory_typed_criterion_fields[criterion_type]);
      var fields = this.mandatory_typed_criterion_fields[criterion_type];
      for (var i = 0; i < fields.length; ++i) {
        if ("default" in fields[i]) {
          //criterion_reset[fields[i].key] = fields[i].default;
          criterion[fields[i].key] = fields[i].default;
        }
      }
    }

    // remove non-mandatory (typed and non-typed) criterion fields
    if (criterion_type in this.mandatory_typed_criterion_fields) {
      for (var field in criterion) {
        if (criterion.hasOwnProperty(field)) {
          if (!(
            _.findWhere(this.mandatory_criterion_fields, { "key": field })
            || _.findWhere(this.mandatory_typed_criterion_fields[criterion_type], { "key": field })
          )) {
            delete criterion[field];
          }
        }
      }
    }

    console.log("criterion built: ", criterion);

    //console.log("criterion built: ", criterion_reset);
    //criterion = criterion_reset;
  };

  this.getFieldDefaultValue = function(default_fields, field_name, for_admin) {
    //console.log("getFieldDefaultValue(): ", default_fields, field_name, for_admin);
    // var default_value = ''; // /!\ setting it to an empty string does not create the property!
    var default_value = "something";
    try {
      if (!(default_fields instanceof Array))
        return default_value;

      var optional_field = default_fields.find(function(e) {
        return (e.key == field_name);
      });
      if (optional_field != undefined) {
        if (for_admin == true && optional_field.hasOwnProperty("defaultAdmin"))
          default_value = optional_field.defaultAdmin;
        else if (optional_field.hasOwnProperty("default"))
          default_value = optional_field.default;
        else if (optional_field.hasOwnProperty("type"))
        {
          if (optional_field.type == "integer")
            default_value = 0;
        }
      }
    }
    finally {
      return default_value;
    }
  };

  this.sendJson = function(method, endpoint, post_data, result_holder) {
    console.log("sendJson()");

    return $http({
      method: method,
      url: endpoint,
      data: post_data,

      //data: $.param(post_data),
      headers: {'Content-Type': 'application/json'}

      //headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers) {
      console.log("success");
      if (result_holder)
        result_holder.text("Success!");
      /*console.log("data:");
      console.log(data);
      console.log("status:");
      console.log(status);
      console.log("headers:");
      console.log(headers);*/
    }).error(function(data, status, headers, config) {
      console.log("error");
      if (result_holder)
        result_holder.text("Error");
      console.log("data:");
      console.log(data);
      console.log("status:");
      console.log(status);
      console.log("headers:");
      console.log(headers);
    });
  };

  this.putJson = function(endpoint, post_data, result_holder) {
    return this.sendJson('PUT', endpoint, post_data, result_holder);
  };

  this.postJson = function(endpoint, post_data, result_holder) {
    return this.sendJson('POST', endpoint, post_data, result_holder);
  };

}]);

creativityServices.factory('globalConfig', function($http) {

  var api_rest = 'test/config_test.json';

  return {
    fetch: function() {
      return $http.get(api_rest);
    }
  }

});

//CONFIG
creativityServices.factory('configTestingService', [function() {
  return {
    init: function() {
      
    },
    testCall: function() {
      $.ajax({
        url:'http://localhost:6543/data/Discussion/1/widgets',
        type:'POST',
        data: {
          type:'MultiCriterionVotingWidget',
          settings: JSON.stringify({"idea":"local:Idea/2"})
        },
        success: function(data, textStatus, jqXHR) {

          getConfig(jqXHR.getResponseHeader('location'));
        },
        error: function(jqXHR, textStatus, errorThrown) {

          console.log(jqXHR);

        }
      });

      function getConfig(value) {
        var widget = value.split(':');
        console.log('http://localhost:6543/data/' + widget[1]);
      }
    },
    getConfiguration: function(url, fnSuccess, fnError) {
      fnSuccess = fnSuccess || function(data) {
        console.log("data:");console.log(data);
      };
      fnError = fnError || function(jqXHR, textStatus, errorThrown) {};
      $.ajax({
        url:url,
        type:'GET',
        data: {},
        success: fnSuccess,
        error: fnError
      });
    }
  }

}]);

//CARD inspire me: send an idea to assembl
creativityServices.factory('sendIdeaService', ['$resource', function($resource) {
  return $resource('http://localhost:6543/api/v1/discussion/:discussionId/posts')
}]);

// WIP: use Angular's REST and Custom Services as our Model for Messages
creativityServices.factory('Discussion', ['$resource', function($resource) {
  return $resource('http://localhost:6543/data/Discussion/:discussionId', {}, {
    query: {method:'GET', params:{discussionId:'1'}, isArray:false}
  });
}]);

