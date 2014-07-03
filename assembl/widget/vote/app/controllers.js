"use strict";

voteApp.controller('adminCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService){

  $scope.init = function(){
    console.log("adminCtl::init()");

    $scope.current_step = 1;
    $scope.widget_endpoint = null;
    $scope.widget_data = null; // the content received from the widget endpoint
    $scope.widget_settings_endpoint = null;
    $scope.widget_criteria_endpoint = null;

    $("#widget_create_without_settings").on("submit", function(){
      $scope.createWidgetInstance(
        $("#widget_create_without_settings_api_endpoint").val(),
        $("#widget_create_without_settings_type").val(),
        null,
        $("#widget_create_without_settings_result")
      );
    });

    
    $("#step_set_settings").on("submit", function(){
      $scope.setWidgetSettings(
        $("#set_settings_api_endpoint").val(),
        $("#set_settings_settings").val(),
        $("#set_settings_result")
      );
    });



    $("#widget_create").on("submit", function(){
      $scope.createWidgetInstance(
        $("#widget_create_api_endpoint").val(),
        $("#widget_create_type").val(),
        $("#widget_create_settings").val(),
        $("#widget_create_result")
      );
    });

    $("#criterion_add").on("submit", function(){
      $scope.addCriterion(
        $("#criterion_add_api_endpoint").val(),
        $("#criterion_add_id").val(),
        $("#criterion_add_result")
      );
    });

    $("#idea_children_to_criteria").on("submit", function(){
      $scope.ideaChildrenToCriteria(
        $("#idea_children_to_criteria_endpoint").val(),
        $("#idea_children_to_criteria_result")
      );
    });

    $("#criteria_set").on("submit", function(){
      $scope.setCriteria(
        $("#criteria_set_endpoint").val(),
        $("#criteria_set_criteria").val(),
        $("#criteria_set_result")
      );
    });

    $("#criterion_remove").on("submit", function(){
      $scope.removeCriterion(
        $("#criterion_remove_api_endpoint").val(),
        $("#criterion_remove_id").val(),
        $("#criterion_remove_result")
      );
    });
    
    
    
  };

  $scope.ideaChildrenToCriteria = function(endpoint, result_holder){
    $http({
      method: 'GET',
      url: endpoint,
    }).success(function(data, status, headers){
      console.log("success");
      console.log("data:");
      console.log(data);
      var criteria = data;
      var criteria_output = [];
      if ( criteria && criteria.length && criteria.length > 0 )
      {
        for ( var i = 0; i < criteria.length; ++i )
        {
          //criteria_output.push({ "@id": criteria[i], "short_title": "criterion "+i });
          criteria_output.push({ "@id": criteria[i] });
        }
        result_holder.append("Success! Transformed data follows:<br/><textarea>"+JSON.stringify(criteria_output)+"</textarea>");
      }
      else
      {
        console.log("error while parsing the result of the API call");
      }
    }).error(function(status, headers){
      console.log("error");
    });
  };

  $scope.updateOnceWidgetIsCreated = function(){
    $http({
      method: 'GET',
      url: $scope.widget_endpoint,
      //data: $.param(post_data),
      //headers: {'Content-Type': 'application/json'}
      //headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
      console.log("success");
      $scope.widget_data = data;
      if ( !data.widget_settings_url )
      {
        console.log("error: widget data does not contain a widget_settings_url property");
        return;
      }
      $scope.widget_settings_endpoint = AssemblToolsService.resourceToUrl(data.widget_settings_url);
      $("#set_settings_api_endpoint").val($scope.widget_settings_endpoint);

      $("#criterion_add_api_endpoint").val($scope.widget_criteria_endpoint);
      $scope.widget_criteria_endpoint = AssemblToolsService.resourceToUrl(data.criteria_url);

      ++$scope.current_step;
    }).error(function(status, headers){
      console.log("error");
    });
  };

  // settings can be null
  $scope.createWidgetInstance = function(endpoint, widget_type, settings, result_holder){

    var post_data = {
      "type": widget_type
    };

    if ( settings != null )
    {
      post_data["settings"] = settings;
    }

    $http({
        method: 'POST',
        url: endpoint,
        data: $.param(post_data),
        async: true,
        //headers: {'Content-Type': 'application/json'}
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
        console.log("success");
        var created_widget = headers("Location"); // "local:Widget/5"
        console.log("created_widget: " + created_widget);
        $scope.widget_endpoint = AssemblToolsService.resourceToUrl(created_widget);
        result_holder.text("Success! Location: " + created_widget);
        $scope.updateOnceWidgetIsCreated();
    }).error(function(status, headers){
        console.log("error");
        result_holder.text("Error");
    });
  };

  $scope.setWidgetSettings = function(endpoint, settings, result_holder){
    console.log("setWidgetSettings()");

    var post_data = settings;

    $http({
        method: 'PUT',
        url: endpoint,
        data: post_data,
        //data: $.param(post_data),
        headers: {'Content-Type': 'application/json'}
        //headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
        console.log("success");
        result_holder.text("Success!");
        console.log("data:");
        console.log(data);
        console.log("status:");
        console.log(status);
        console.log("headers:");
        console.log(headers);
    }).error(function(status, headers){
        console.log("error");
        result_holder.text("Error");
    });
  };

  $scope.addCriterion = function(endpoint, criterion_id, result_holder){
    var post_data = {
      "id": criterion_id
    };

    $http({
        method: 'POST',
        url: endpoint,
        data: $.param(post_data),
        async: true,
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
        console.log("success");
        result_holder.text("Success!");
    }).error(function(status, headers){
        console.log("error");
        result_holder.text("Error");
    });
  };

  $scope.removeCriterion = function(endpoint, criterion_id, result_holder){
    var criterion_id_last_part = criterion_id.substr(criterion_id.lastIndexOf("/")+1);

    $http({
        method: 'DELETE',
        url: endpoint+"/"+criterion_id_last_part,
        //data: $.param(post_data),
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
        console.log("success");
        result_holder.text("Success!");
    }).error(function(status, headers){
        console.log("error");
        result_holder.text("Error");
    });
  };

  $scope.setCriteria = function(endpoint, criteria, result_holder){
    var post_data = criteria;

    $http({
        method: 'PUT',
        url: endpoint,
        data: post_data,
        //data: $.param(post_data),
        headers: {'Content-Type': 'application/json'}
        //headers: {'Content-Type': 'application/x-www-form-urlencoded'}
    }).success(function(data, status, headers){
        console.log("success");
        result_holder.text("Success!");
    }).error(function(status, headers){
        console.log("error");
        result_holder.text("Error");
    });
  };

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

voteApp.controller('indexCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService',
  function($scope, $http, $routeParams, $log, $location, globalConfig, configTestingService, configService, Discussion, AssemblToolsService){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("indexCtl::init()");

      console.log("configService:");
      console.log(configService);
      $scope.settings = configService.settings;
      console.log("settings:");
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


      // check that an URL to POST the vote is provided in the configuration JSON
      if ( configService.user_votes_url && configService.user_votes_url != "null" )
      {
        $scope.postVoteUrl = AssemblToolsService.resourceToUrl(configService.user_votes_url);
        console.log("postVoteUrl:");
        console.log($scope.postVoteUrl);
      }
      else
      {
        console.log("postVoteUrl is not set");
        // TODO: better error
        // temporary disabled
        //alert("Error: The configuration JSON does not contain a \"user_votes_url\" property.");
        //return;
        $scope.postVoteUrl = '';
      }
      

      if ( $scope.settings.displayStyle && $scope.settings.displayStyle == "table" )
      {
        $scope.drawUIWithTable();
      }
      else
      {
        $scope.drawUI();
      }

      $scope.computeMyVotes();
    };

    $scope.computeMyVotes = function(){
      // do not use .data("criterion-value") because jQuery does not seem to read the value set by d3

      $scope.myVotes = {};
      // once serialized by $.param(), this will give "rentabilite=10&risque=0&investissement=22222&difficulte_mise_en_oeuvre=50"
      $("#d3_container g.criterion").each(function(index) {
        var valueMin = parseFloat($(this).attr("data-criterion-value-min"));
        var valueMax = parseFloat($(this).attr("data-criterion-value-max"));
        var value = parseFloat($(this).attr("data-criterion-value"));
        var valueToPost = (value - valueMin) / (valueMax - valueMin); // the posted value has to be a float in [0;1]
        $scope.myVotes[$(this).attr("data-criterion-id")] = valueToPost;
      });

      return $scope.myVotes;
    };

    $scope.submitVote = function(){
      console.log("submitVote()");
      $scope.computeMyVotes();
      console.log("myVotes:");
      console.log($scope.myVotes);

      var vote_result_holder = $("#vote_submit_result_holder");
      vote_result_holder.empty();

      var voting_urls = configService.voting_urls;
      for ( var k in $scope.myVotes )
      {
        if ( $scope.myVotes.hasOwnProperty(k) )
        {
          var vote_value = null; // must be float, and contained in the range defined in the criterion
          if ( typeof $scope.myVotes[k] === 'string' )
            vote_value = parseFloat($scope.myVotes[k]);
          else
            vote_value = $scope.myVotes[k];

          if ( voting_urls[k] )
          {
            var url = AssemblToolsService.resourceToUrl(voting_urls[k]);
            var data_to_post = {
              "type": "LickertIdeaVote",
              "value": vote_value
            };

            var successForK = function(vk){
              return function(data, status, headers){
                console.log("success");
                //alert("success");
                console.log("data:");
                console.log(data);
                console.log("status:");
                console.log(status);
                console.log("headers:");
                console.log(headers);
                //$location.path( "/voted" );

                console.log("k: " + vk);
                var criterion_tag = $("svg g[data-criterion-id=\"" + vk + "\"]");
                var svg = criterion_tag.parent("svg");

                /*
                //svg.css("background","#00ff00").fadeOut();
                svg.css("background","#00ff00");//.delay(1000).css("background","none");
                setTimeout(function(){svg.css("background","none");}, 1000);
                */

                vote_result_holder.append($("<p class='success'>Your vote on criterion '" + criterion_tag.attr("data-criterion-name-slug") + "' has been successfully submitted!</p>"));
              };          
            };

            var errorForK = function(vk){
              return function(status, headers){
                console.log("error");
                //alert("error");
                console.log("status:");
                console.log(status);
                console.log("headers:");
                console.log(headers);
                //$location.path( "/voted" );
                console.log("k: " + vk);
                var criterion_tag = $("svg g[data-criterion-id=\"" + vk + "\"]");
                var svg = criterion_tag.parent("svg");

                svg.css("background","#ff0000");
                setTimeout(function(){svg.css("background","none");}, 1000);

                vote_result_holder.append($("<p class='failure'>Your vote on criterion '" + criterion_tag.attr("data-criterion-name-slug") + "' has NOT been successfully submitted!</p>"));
              }
            };

            // POST to this URL
            $http({
              method: "POST",
              url: url,
              data: $.param(data_to_post),
              //data: data_to_post,
              headers: {'Content-Type': 'application/x-www-form-urlencoded'}
              //headers: {'Content-Type': 'application/json'}
            }).success(successForK(k)).error(errorForK(k));
          }
        }
      }

    };

    $scope.submitSingleVote = function(endpoint, type, criterion_id){
      console.log("submitSingleVote() parameters:" + endpoint + " " + type + " " + criterion_id);
      var criterion_value = $("#d3_container g.criterion[data-criterion-id=\""+criterion_id+"\"]").attr("data-criterion-value");
      console.log("criterion value:");
      console.log(criterion_value);
    };

    // @param destination
    // The d3 container (div)
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    // @param xPosCenter
    // Position on the X coordinates of the center of the gauge, in the created SVG
    $scope.drawVerticalGauge = function(destination, item_data, xPosCenter){
      console.log("drawVerticalGauge()");
      //console.log("item_data:");
      //console.log(item_data);
      var config = $scope.settings;
      var criterion = item_data.criteria[0];
      var criterionValue = (criterion.valueDefault || criterion.valueDefault === 0.0) ? criterion.valueDefault : criterion.valueMin;
      xPosCenter = xPosCenter ? xPosCenter : item_data.width / 2;

      // create the graph, as a SVG in the d3 container div
      var svg = destination
        .append("svg")
        .attr("width", item_data.width)    
        .attr("height", item_data.height);


      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name-slug", criterion.name_slug)
        .attr("data-criterion-id", criterion["entity_id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionValue)
        .attr("data-criterion-value-min", criterion.valueMin)
        .attr("data-criterion-value-max", criterion.valueMax)
      ;


      // create vertical scale
      var scale = d3.scale.linear()
        .domain([criterion.valueMin, criterion.valueMax])
        .range([item_data.height - config.padding, config.padding])
        .clamp(true);

      var ticks = 5;
      if ( criterion.ticks )
        ticks = criterion.ticks;
      var axis = d3.svg.axis()
        .scale(scale)
        .orient("left")
        .ticks(ticks);

      function setCirclePositionFromOutputRange(y)
      {
        var v = scale.invert(y);

        svg.select("g.criterion").attr("data-criterion-value", v);

        svg.select("circle").attr("cy", scale(v));
      }


      function dragmove(d) {
        //var x = d3.event.x;
        var y = d3.event.y;

        setCirclePositionFromOutputRange(y);
      }

      // define drag beavior
      var drag = d3.behavior.drag()
        .on("drag", dragmove);


      function click()
      {
        // Ignore the click event if it was suppressed
        if (d3.event.defaultPrevented) return;

        // Extract the click location
        var point = d3.mouse(this);
        var p = {x: point[0], y: point[1] };

        setCirclePositionFromOutputRange(p.y);
      }

      svg
        .on("click", click)
        .call(drag);


      // show vertical axis, its label, and its gradient
      if ( criterion.colorMin && criterion.colorMax )
      {
        // define a gradient in the SVG (using a "linearGradient" tag inside the "defs" tag). 0% = top; 100% = bottom
        var defs = svg.append("defs");
        var lg = defs.append("linearGradient")
          .attr("id","gradient_"+criterion.id)
          .attr("x1","0%")
          .attr("y1","0%")
          .attr("x2","0%")
          .attr("y2","100%");
        lg.append("stop")
          .attr("offset","0%")
          .style("stop-color",criterion.colorMax)
          .style("stop-opacity","1");
        if ( criterion.colorAverage )
        {
          lg.append("stop")
            .attr("offset","50%")
            .style("stop-color",criterion.colorAverage)
            .style("stop-opacity","1");
        }
        lg.append("stop")
          .attr("offset","100%")
          .style("stop-color",criterion.colorMin)
          .style("stop-opacity","1");
      }



      var g = svg.append("g");
      
      // show color gradient if set
      var axisBonusClasses = "";
      if ( criterion.colorMin && criterion.colorMax )
      {
        axisBonusClasses = "gradient";
        var gradientWidth = 10;
        g.append("rect")
          .attr("x", xPosCenter -gradientWidth/2 )
          .attr("y", config.padding-1 ) // this is the same as .attr("y", scale(criterion.valueMax) )
          .attr("width",gradientWidth)
          .attr("height",scale(criterion.valueMin) - config.padding +1)
          .attr("fill","url(#gradient_"+criterion.id+")");
      }

      // show vertical axis
      g.append("g")
        .attr("class", "axis "+axisBonusClasses)
        .attr("transform", "translate(" + xPosCenter + ",0)")
        .call(axis);

      // if there is a gradient, edit the axis (which we just created) to show ticks differently
      if ( criterion.colorMin && criterion.colorMax )
      {
        g.selectAll("line")
          .attr("x1","-2")
          .attr("x2","2");
      }

      // show axis label
      var axisLabel = g.append("text")
        .attr("y", item_data.height - config.padding*0.3 )
        .attr("x", xPosCenter )
        .style("text-anchor", "middle")
        .text(criterion.name);

      // make the axis label interactive (mouse hover) to show the description text of the criterion
      // possibility of improvement: maybe instead of an HTML "title" attribute, we could use tipsy, as on http://bl.ocks.org/ilyabo/1373263
      if ( criterion.description && criterion.description.length > 0 )
      {
        var f = function(){
          // prevent the other click() function to get called
          d3.event.stopPropagation();
          
          // do nothing, so that we just block the other click function in case the user clicks on the axis label because they think it would give more info (info appears on hover after a bit of time, because for now it is handled by the "title" property, so the browser decides how/when it appears)
        }
        axisLabel
          .style("cursor","help")
          .attr("title", criterion.description)
          .on("click", f)
        ;
      }

      

      // show descriptions of the minimum and maximum values
      if ( criterion.descriptionMin )
      {
        g.append("text")
          .attr("y", item_data.height - config.padding*0.7 )
          .attr("x", xPosCenter )
          .style("text-anchor", "middle")
          .text(criterion.descriptionMin);
      }
      if ( criterion.descriptionMax )
      {
        g.append("text")
          .attr("y", config.padding*0.7 )
          .attr("x", xPosCenter )
          .style("text-anchor", "middle")
          .text(criterion.descriptionMax);
      }

      // draw the cursor
      svg.append("circle")
        .attr("cx", xPosCenter)
        .attr("cy", scale(criterionValue) )
        .attr("r", 8)
        .style("fill", ( criterion.colorCursor ) ? criterion.colorCursor : "blue")
        .style("cursor", "pointer")
      ;


    };

    // @param destination
    // The d3 container (div)
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    // @param xPosCenter
    // Position on the X coordinates of the center of the gauge, in the created SVG
    $scope.draw2AxesVote = function(destination, item_data, xPosCenter){
      console.log("draw2AxesVote()");
      //console.log("item_data:");
      //console.log(item_data);
      var config = $scope.settings;
      var criteria = item_data.criteria;

      if ( criteria.length < 2 )
      {
        console.log("error: need at least 2 criteria");
        return;
      }

      var criterionXValue = (criteria[0].valueDefault || criteria[0].valueDefault === 0.0) ? criteria[0].valueDefault : criteria[0].valueMin;
      var criterionYValue = (criteria[1].valueDefault || criteria[1].valueDefault === 0.0) ? criteria[1].valueDefault : criteria[1].valueMin;
      xPosCenter = xPosCenter ? xPosCenter : item_data.width / 2;

      // create the graph, as a SVG in the d3 container div
      var svg = destination
        .append("svg")
        .attr("width", item_data.width)    
        .attr("height", item_data.height);


      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name-slug", criteria[0].name_slug)
        .attr("data-criterion-id", criteria[0]["entity_id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionXValue)
        .attr("data-criterion-value-min", criteria[0].valueMin)
        .attr("data-criterion-value-max", criteria[0].valueMax)
        .attr("data-criterion-type", "x")
      ;

      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name-slug", criteria[1].name_slug)
        .attr("data-criterion-id", criteria[1]["entity_id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionYValue)
        .attr("data-criterion-value-min", criteria[1].valueMin)
        .attr("data-criterion-value-max", criteria[1].valueMax)
        .attr("data-criterion-type", "y")
      ;


      // create X and Y scales
      var xScale = d3.scale.linear()
        .domain([criteria[0].valueMin, criteria[0].valueMax])
        .range([config.padding, item_data.width - config.padding])
        .clamp(true);

      var yScale = d3.scale.linear()
        .domain([criteria[1].valueMin, criteria[1].valueMax])
        .range([item_data.height - config.padding, config.padding])
        .clamp(true);


      // create X and Y axes using their scales
      var xTicks = 5;
      if ( criteria[0].ticks )
        xTicks = criteria[1].ticks;
      var xAxis = d3.svg.axis()
        .scale(xScale)
        .orient("bottom")
        .ticks(xTicks);

      var yTicks = 5;
      if ( criteria[1].ticks )
        yTicks = criteria[1].ticks;
      var yAxis = d3.svg.axis()
        .scale(yScale)
        .orient("left")
        .ticks(yTicks);


      function setCirclePositionFromOutputRange(x, y, setData)
      {
        var xValue = xScale.invert(x);
        var yValue = yScale.invert(y);

        if ( setData === true )
        {
          svg.select("g.criterion[data-criterion-type='x']").attr("data-criterion-value", xValue);
          svg.select("g.criterion[data-criterion-type='y']").attr("data-criterion-value", yValue);
        }

        svg.selectAll("circle").attr("cx", xScale(xValue));
        svg.selectAll("circle").attr("cy", yScale(yValue));
      }


      function dragmove(d) {
        var x = d3.event.x;
        var y = d3.event.y;

        setCirclePositionFromOutputRange(x, y);
      }

      function dragEnd(d){
        var x = svg.selectAll("circle").attr("cx");
        var y = svg.selectAll("circle").attr("cy");

        setCirclePositionFromOutputRange(x, y, true);
      }

      // define drag beavior
      var drag = d3.behavior.drag()
        .on("drag", dragmove)
        .on("dragend", dragEnd);


      function click()
      {
        // Ignore the click event if it was suppressed
        if (d3.event.defaultPrevented) return;

        // Extract the click location
        var point = d3.mouse(this);
        var p = {x: point[0], y: point[1] };

        setCirclePositionFromOutputRange(p.x, p.y);
      }

      svg
        .on("click", click)
        .call(drag);


      var g = svg.append("g");

      // show X axis
      g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(0," + (item_data.height - config.padding) + ")")
        .call(xAxis);

      // show Y axis
      g.append("g")
        .attr("class", "axis")
        .attr("transform", "translate(" + config.padding + ",0)")
        .call(yAxis);

      // show X axis label
      g.append("text")
        //.attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom) + ")")
        .attr("y", (item_data.height - config.padding * 0.45) )
        .attr("x", (item_data.width / 2) )
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(criteria[0].name);

      // show Y axis label
      g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", (0) )
        .attr("x", (0 - item_data.height/2) )
        .attr("dy", config.padding/3 + "px")
        .attr("dx", "-2em") // reposition center to integrate text length
        .style("text-anchor", "middle")
        .text(criteria[1].name);

      
        /* TODO
      // show descriptions of the minimum and maximum values
      if ( criterion.descriptionMin )
      {
        g.append("text")
          .attr("y", config.height - config.padding*0.7 )
          .attr("x", xPosCenter )
          .style("text-anchor", "middle")
          .text(criterion.descriptionMin);
      }
      if ( criterion.descriptionMax )
      {
        g.append("text")
          .attr("y", config.padding*0.7 )
          .attr("x", xPosCenter )
          .style("text-anchor", "middle")
          .text(criterion.descriptionMax);
      }
      */

      // show descriptions of the minimum and maximum values on X axis
      if ( criteria[0].descriptionMin && criteria[0].descriptionMin.length > 0 )
      {
        g.append("text")
          .attr("y", (item_data.height - config.padding*0.6) )
          .attr("x", (item_data.width * 0.2) )
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text(criteria[0].descriptionMin);
      }
      if ( criteria[0].descriptionMax && criteria[0].descriptionMax.length > 0 )
      {
        g.append("text")
          .attr("y", (item_data.height - config.padding*0.6) )
          .attr("x", (item_data.width * 0.8) )
          .attr("dy", "1em")
          .style("text-anchor", "middle")
          .text(criteria[0].descriptionMax);
      }

      // show descriptions of the minimum and maximum values on Y axis
      if ( criteria[1].descriptionMin && criteria[1].descriptionMin.length > 0 )
      {
        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", (0) )
          .attr("x", (0 - item_data.height * 0.8) )
          .attr("dy", (config.padding * 0.5) + "px")
          .style("text-anchor", "middle")
          .text(criteria[1].descriptionMin);
      }
      if ( criteria[1].descriptionMax && criteria[1].descriptionMax.length > 0 )
      {
        g.append("text")
          .attr("transform", "rotate(-90)")
          .attr("y", (0) )
          .attr("x", (0 - item_data.height * 0.2) )
          .attr("dy", (config.padding * 0.5) + "px")
          .style("text-anchor", "middle")
          .text(criteria[1].descriptionMax);
      }





      // draw the cursor (inner disc)
      svg.append("circle")
        .attr("cx", xScale(criterionXValue))
        .attr("cy", yScale(criterionYValue))
        .attr("r", 7)
        .style("fill", ( item_data.colorCursor ) ? item_data.colorCursor : "blue")
        .style("cursor", "pointer")
      ;

      // draw the cursor (outer circle)
      svg.append("circle")
        .attr("cx", xScale(criterionXValue))
        .attr("cy", yScale(criterionYValue))
        .attr("r", 10) 
        .style("fill", "none")
        .style("stroke", ( item_data.colorCursor ) ? item_data.colorCursor : "blue")
        .style("cursor", "pointer")
      ;

    
    };



    $scope.drawUIWithTable = function(){
      console.log("drawUIWithTable()");
      var config = $scope.settings;
      var holder = d3.select("#d3_container");

      var table = $("<table/>");
      table.attr("id","table_vote");
      $("#d3_container").append(table);
      var tr = $("<tr/>");
      var tr2 = $("<tr/>");
      table.append(tr);
      table.append(tr2);

      // first column: description of which idea the user will vote on
      if (config.presentationText)
      {
        var td = $("<th/>");
        td.text("Description"); // TODO: i18n
        tr.append(td);
        var td2 = $("<td/>");
        td2.text(config.presentationText);
        tr2.append(td2);
      }

      for ( var i = 0; i < config.items.length; ++i )
      {
        console.log(i);
        var item = config.items[i];


        var td = $("<th/>");
        if ( item.criteria && item.criteria.length > 0 )
        {
          if ( item.criteria.length == 1 && item.criteria[0].name )
            td.text(item.criteria[0].name);
          else
          {
            var a = [];
            for ( var j = 0; j < item.criteria.length; ++j )
            {
              if ( item.criteria[j].name )
                a.push ( item.criteria[j].name );
            }
            td.text(a.join(" / "));
          }
        }
        
        tr.append(td);

        var td2 = $("<td/>");
        td2.attr("id","table_vote_item_"+i);
        tr2.append(td2);
        var holder = d3.select("#table_vote_item_"+i);

        
        //console.log("item.type:");
        //console.log(item.type);
        if ( item.type == "vertical_gauge" )
        {
          $scope.drawVerticalGauge(holder, item);
        }
        else if ( item.type == "2_axes" )
        {
          $scope.draw2AxesVote(holder, item);
        }
      }

      console.log("drawUIWithTable() completed");
    };


    $scope.drawUI = function(){
      console.log("drawUI()");
      var config = $scope.settings;
      var holder = d3.select("#d3_container");
      var jq_holder = $("#d3_container");

      for ( var i = 0; i < config.items.length; ++i )
      {
        var item = config.items[i];
        //console.log("item.type:");
        //console.log(item.type);
        if ( item.type == "vertical_gauge" )
        {
          $scope.drawVerticalGauge(holder, item);

          /*
          // add specific vote button for this criterion
          console.log("item.criteria:");
          console.log(item.criteria);
          if ( item.criteria && item.criteria.length && item.criteria[0] && item.criteria[0]["@id"] )
          {
            var criterion_id = item.criteria[0]["@id"];
            console.log("criterion_id id:");
            console.log(criterion_id);
            console.log("configService.voting_urls:");
            console.log(configService.voting_urls);
            if ( configService.voting_urls && configService.voting_urls[criterion_id] )
            {
              console.log("configService.voting_urls[criterion_id]:");
              console.log(configService.voting_urls[criterion_id]);
              var criterion_endpoint = AssemblToolsService.resourceToUrl(configService.voting_urls[criterion_id]);
              //jq_holder.append("<a href='#' ng-click=\"submitSingleVote('"+criterion_endpoint+"', 'LickertIdeaVote', '"+criterion_id+"')\">Vote</a>").click(function(){
              var link = $("<button>Vote</button>");
              link.click(function(){ // TODO: does not work, all buttons call with the same parameter value
                console.log("coucou");
                $scope.submitSingleVote(criterion_endpoint, 'LickertIdeaVote', item.criteria[0]["id"]);
              });
              jq_holder.append(link);
            }
          }
          */


        }
        else if ( item.type == "2_axes" )
        {
          $scope.draw2AxesVote(holder, item);
        }
      }

      console.log("drawUI() completed");
    };

}]);
