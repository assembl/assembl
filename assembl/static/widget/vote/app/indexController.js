"use strict";

voteApp.controller('indexCtl',
  ['$scope', '$http', '$routeParams', '$log', '$location', '$translate', 'globalConfig', 'configTestingService', 'configService', 'Discussion', 'AssemblToolsService', 'VoteWidgetService',
  function($scope, $http, $routeParams, $log, $location, $translate, globalConfig, configTestingService, configService, Discussion, AssemblToolsService, VoteWidgetService){

    // intialization code (constructor)

    $scope.init = function(){
      console.log("indexCtl::init()");

      console.log("configService:");
      console.log(configService);
      $scope.settings = configService.settings;
      console.log("settings 0:");
      console.log($scope.settings);

      VoteWidgetService.addDefaultFields($scope.settings, VoteWidgetService.mandatory_settings_fields);
      VoteWidgetService.addDefaultFields($scope.settings, VoteWidgetService.optional_settings_fields);

      console.log("settings 1:");
      console.log($scope.settings);

      if ( $scope.settings.items && $scope.settings.items.length )
      {
        _.each($scope.settings.items, function(el){
          VoteWidgetService.addDefaultFields(el, VoteWidgetService.mandatory_item_fields);
          VoteWidgetService.addDefaultFields(el, VoteWidgetService.optional_item_fields);
          if ( el.criteria && el.criteria.length ){
            _.each(el.criteria, function(el2){
              VoteWidgetService.addDefaultFields(el2, VoteWidgetService.mandatory_criterion_fields);
              
              if ( "type" in el2 && el2.type in VoteWidgetService.mandatory_typed_criterion_fields ){
                VoteWidgetService.addDefaultFields(el2, VoteWidgetService.mandatory_typed_criterion_fields[el2.type]);
              }

              VoteWidgetService.addDefaultFields(el2, VoteWidgetService.optional_criterion_fields);

              if ( "type" in el2 && el2.type in VoteWidgetService.optional_typed_criterion_fields ){
                VoteWidgetService.addDefaultFields(el2, VoteWidgetService.optional_typed_criterion_fields[el2.type]);
              }
            });
          }
        });
      }

      console.log("settings 2:");
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


      // try to get previous vote of the user

      if ( !configService.user_votes_url )
      {
        $scope.drawUI();
      }
      else
      {
        var my_votes_endpoint_url = AssemblToolsService.resourceToUrl(configService.user_votes_url);
        $http({
          method: 'GET',
          url: my_votes_endpoint_url,
        }).success(function(data, status, headers){
          console.log(data);
          var my_votes = data;
          // override default value of given criteria
          _.each($scope.settings.items, function(item, item_index){
            _.each(item.criteria, function(criterion, criterion_index){
              var entity_id = criterion.entity_id;
              var my_vote_for_this_criterion = _.findWhere(my_votes, {"criterion": entity_id});
              if ( my_vote_for_this_criterion )
              {
                console.log("value found: " + my_vote_for_this_criterion.value);
                var new_value = my_vote_for_this_criterion.value;
                // interpret vote value differently depending on criterion type
                if ( criterion.type == "BinaryIdeaVote" )
                {
                  if ( my_vote_for_this_criterion.value === true || my_vote_for_this_criterion.value == "true" || my_vote_for_this_criterion.value === 1 || my_vote_for_this_criterion.value == "1" )
                  {
                    new_value = 1;
                  }
                  else if ( my_vote_for_this_criterion.value === false || my_vote_for_this_criterion.value == "false" || my_vote_for_this_criterion.value === 0 || my_vote_for_this_criterion.value == "0" )
                  {
                    new_value = 0;
                  }
                } else // if ( criterion.type == "LickertIdeaVote" )
                {
                  var valueMin = parseFloat(criterion.valueMin);
                  var valueMax = parseFloat(criterion.valueMax);
                  new_value = valueMin + my_vote_for_this_criterion.value * (valueMax - valueMin);
                }
                
                $scope.settings.items[item_index].criteria[criterion_index].valueDefault = new_value;
                console.log("value set: " + new_value);
              }
            });
          });
          console.log("settings after my votes:");
          console.log($scope.settings);
          $scope.drawUI();
        }).error(function(status, headers){
          console.log("error");
          $scope.drawUI();
        });
      }

      
    };

    $scope.drawUI = function(){
      // set a background color

      if ( $scope.settings.background )
      {
        $("body").css("background", $scope.settings.background);
      }

      // set min width and min height
      
      if ( $scope.settings.minWidth )
      {
        $("body").css("min-width", $scope.settings.minWidth + "px");
      }
      if ( $scope.settings.minHeight )
      {
        $("body").css("min-height", $scope.settings.minHeight + "px");
      }

      // display the UI in a table of classic way depending on the settings

      if ( $scope.settings.displayStyle && $scope.settings.displayStyle == "table" )
      {
        $scope.drawUIWithTable();
      }
      else
      {
        $scope.drawUIWithoutTable();
      }
      $scope.resizeIframe();
    };

    $scope.resizeIframe = function(){
      if ( window.parent && window.parent.resizeIframe )
        window.parent.resizeIframe();
    };

    $scope.computeMyVotes = function(){
      // do not use .data("criterion-value") because jQuery does not seem to read the value set by d3

      $scope.myVotes = {};
      // once serialized by $.param(), this will give "rentabilite=10&risque=0&investissement=22222&difficulte_mise_en_oeuvre=50"
      $("#d3_container g.criterion").each(function(index) {
        //console.log("current criterion:", $(this).attr("data-criterion-id"));
        var valueMin = parseFloat($(this).attr("data-criterion-value-min"));
        var valueMax = parseFloat($(this).attr("data-criterion-value-max"));
        var value = parseFloat($(this).attr("data-criterion-value"));
        var valueToPost = (value - valueMin) / (valueMax - valueMin); // the posted value has to be a float in [0;1]
        $scope.myVotes[$(this).attr("data-criterion-id")] = valueToPost;
      });

      $("#d3_container > div.criterion").each(function(index) {
        var criterion_id = $(this).attr("data-criterion-id");
        var value = parseInt($(this).attr("data-criterion-value"));
        console.log("criterion " + criterion_id + " has value " + value);
        if ( isNaN(value) )
        {
          alert("Error: no value for criterion " + criterion_id);
          return;
        }
        var valueToPost = value; // or maybe !!value
        $scope.myVotes[criterion_id] = valueToPost;
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
      var counter = 0;
      for ( var k in $scope.myVotes )
      {
        if ( $scope.myVotes.hasOwnProperty(k) )
        {

          // determine vote type

          var vote_type = "LickertIdeaVote";

          var found = false;
          if ( "items" in $scope.settings )
          {
            for ( var i = 0; !found && i < $scope.settings.items.length; ++i )
            {
              if ( "criteria" in $scope.settings.items[i] )
              {
                for ( var j = 0; !found && j < $scope.settings.items[i].criteria.length; ++j )
                {
                  if ( "entity_id" in $scope.settings.items[i].criteria[j] && $scope.settings.items[i].criteria[j].entity_id == k )
                  {
                    if ( "type" in $scope.settings.items[i].criteria[j] )
                    {
                      found = true;
                      vote_type = $scope.settings.items[i].criteria[j].type;
                    }
                  }
                }
              }
            }
          }

          // validate vote value

          var value = null; // must be float, and contained in the range defined in the criterion
          if ( vote_type == "BinaryIdeaVote" )
          {
            console.log("$scope.myVotes[k]: ", $scope.myVotes[k]);
            console.log("typeof $scope.myVotes[k]: ", typeof $scope.myVotes[k]);
            if ( typeof $scope.myVotes[k] == 'string' )
              value = !!parseInt($scope.myVotes[k]);
            else if ( typeof $scope.myVotes[k] == 'number' )
            {
              value = !!$scope.myVotes[k];
            }
            else
              value = $scope.myVotes[k];
            console.log("new value:", value);
          }
          else // if ( vote_type == "LickertIdeaVote" )
          {
            if ( typeof $scope.myVotes[k] == 'string' )
              value = parseFloat($scope.myVotes[k]);
            else
              value = $scope.myVotes[k];
          }



          if ( voting_urls[k] )
          {
            var url = AssemblToolsService.resourceToUrl(voting_urls[k]);
            var data_to_post = {
              "type": vote_type,
              "value": value
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
                if ( !criterion_tag.length )
                  criterion_tag = $("div.criterion[data-criterion-id=\"" + vk + "\"]");
                var svg = criterion_tag.parent("svg");
                var criterion_name = criterion_tag.attr("data-criterion-name");

                /*
                //svg.css("background","#00ff00").fadeOut();
                svg.css("background","#00ff00");//.delay(1000).css("background","none");
                setTimeout(function(){svg.css("background","none");}, 1000);
                */

                $translate('voteSubmitSuccessForCriterion', {'criterion': criterion_name}).then(function (translation) {
                  vote_result_holder.append($("<p class='success'>" + translation + "</p>"));
                  // $scope.resizeIframe(); // our resize function is not good enough yet
                });
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
                if ( !criterion_tag.length )
                  criterion_tag = $("div.criterion[data-criterion-id=\"" + vk + "\"]");
                var svg = criterion_tag.parent("svg");
                var criterion_name = criterion_tag.attr("data-criterion-name");

                svg.css("background","#ff0000");
                setTimeout(function(){svg.css("background","none");}, 1000);

                $translate('voteSubmitFailureForCriterion', {'criterion': criterion_name}).then(function (translation) {
                  vote_result_holder.append($("<p class='failure'>" + translation + "</p>"));
                  // $scope.resizeIframe(); // our resize function is not good enough yet
                });
              }
            };

            // we will send votes for each criterion separated with a small delay, so that we avoid server saturation
            // TODO: instead we could chain calls (send a call once the response of the previous one has been received)

            var sendVote = function(url, data_to_post, k, delay){
              setTimeout(function(){
                // POST to this URL
                $http({
                  method: "POST",
                  url: url,
                  data: $.param(data_to_post),
                  //data: data_to_post,
                  headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                  //headers: {'Content-Type': 'application/json'}
                }).success(successForK(k)).error(errorForK(k));
              }, delay);
            };
              
            sendVote(url, data_to_post, k, (counter++)*300);
            
          }
          else
          {
            var error = "Error: No voting_urls endpoint associated to criterion " + k;
            console.error(error);
            alert(error);
            // what else should we do?
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
      console.log("item_data:");
      console.log(item_data);
      var config = $scope.settings;
      var criterion = item_data.criteria[0];
      var criterionValue = (("valueDefault" in criterion) && (criterion.valueDefault || criterion.valueDefault === 0.0)) ? criterion.valueDefault : (("valueMin" in criterion) ? criterion.valueMin : 0);
      console.log("criterionValue: ", criterionValue);
      xPosCenter = xPosCenter ? xPosCenter : item_data.width / 2;

      // create the graph, as a SVG in the d3 container div
      var svg = destination
        .append("svg")
        .attr("width", item_data.width)    
        .attr("height", item_data.height);


      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name", criterion.name)
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
        .attr("class", "axis-label")
        .text(criterion.name);

      // make the axis label interactive (mouse hover) to show the description text of the criterion
      // possibility of improvement: maybe instead of an HTML "title" attribute, we could use tipsy, as on http://bl.ocks.org/ilyabo/1373263
      if ( !config.showCriterionDescription || config.showCriterionDescription == "tooltip" )
      {
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
      }
      else if ( config.showCriterionDescription && config.showCriterionDescription == "text" )
      {
        if ( criterion.description && criterion.description.length > 0 )
        {
          // There is no automatic word wrapping in SVG
          // So we create an HTML element
          var elParent = $("#d3_container");
          var elOrigin = $(svg[0]);
          console.log("svg: ", svg);
          var text = document.createTextNode(criterion.description);
          var node = document.createElement("span");
          node.appendChild(text);
          var descriptionWidth = item_data.width;

          $(node).css("position", "absolute");
          $(node).css("width", descriptionWidth + "px");
          $(node).css("top", elOrigin.offset().top + (item_data.height - config.padding*0.25) + "px");
          $(node).css("left", (elOrigin.offset().left + xPosCenter - descriptionWidth/2) + "px");
          $(node).css("text-align", "center");


          elParent.append(node);
        }
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
        .attr("data-criterion-name", criteria[0].name)
        .attr("data-criterion-id", criteria[0]["entity_id"]) // contains something like "local:Idea/3"
        .attr("data-criterion-value", criterionXValue)
        .attr("data-criterion-value-min", criteria[0].valueMin)
        .attr("data-criterion-value-max", criteria[0].valueMax)
        .attr("data-criterion-type", "x")
      ;

      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-name", criteria[1].name)
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
        .origin(function(){
          var point = d3.mouse(this);
          var p = {x: point[0], y: point[1] };
          // show cursor on the "pressed" position, without waiting for "release" event
          setCirclePositionFromOutputRange(p.x, p.y);
          return p;
        })
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
      var xAxisLabel = g.append("text")
        //.attr("transform", "translate(" + (width / 2) + " ," + (height + margin.bottom) + ")")
        .attr("y", (item_data.height - config.padding * 0.45) )
        .attr("x", (item_data.width / 2) )
        .attr("dy", "1em")
        .attr("class", "axis-label")
        .text(criteria[0].name);

      // show Y axis label
      var yAxisLabel = g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", (0) )
        .attr("x", (0 - item_data.height/2) )
        .attr("dy", config.padding/3 + "px")
        .attr("class", "axis-label")
        .text(criteria[1].name);


      // make the axis labels interactive (mouse hover) to show the description text of the criterion
      if ( !config.showCriterionDescription || config.showCriterionDescription == "tooltip" )
      {
        var onClickDoNothing = function(){
          // prevent the other click() function to get called
          d3.event.stopPropagation();
          
          // do nothing, so that we just block the other click function in case the user clicks on the axis label because they think it would give more info (info appears on hover after a bit of time, because for now it is handled by the "title" property, so the browser decides how/when it appears)
        };
        if ( criteria[0].description && criteria[0].description.length > 0 )
        {
          xAxisLabel
            .style("cursor","help")
            .attr("title", criteria[0].description)
            .on("click", onClickDoNothing)
          ;
        }
        if ( criteria[1].description && criteria[1].description.length > 0 )
        {
          yAxisLabel
            .style("cursor","help")
            .attr("title", criteria[1].description)
            .on("click", onClickDoNothing)
          ;
        }
      }
      else if ( config.showCriterionDescription && config.showCriterionDescription == "text" )
      {
        for ( var i = 0; i < 2; ++i )
        {
          if ( criteria[i].description && criteria[i].description.length > 0 )
          {
            // There is no automatic word wrapping in SVG
            // So we create an HTML element
            var elParent = $("#d3_container");
            var elOrigin = $(svg[0]);
            console.log("svg: ", svg);
            var text = document.createTextNode(criteria[i].description);
            var node = document.createElement("span");
            node.appendChild(text);
            var descriptionWidth = item_data.width;
            if ( i == 1 )
              descriptionWidth = item_data.height;

            $(node).css("position", "absolute");
            $(node).css("width", descriptionWidth + "px");
            $(node).css("top", (elOrigin.offset().top + (item_data.height - config.padding*0.25)) + "px");
            $(node).css("left", (elOrigin.offset().left + xPosCenter - descriptionWidth/2) + "px");
            $(node).css("text-align", "center");

            if ( i == 1 )
            {
              $(node).css("top", (elOrigin.offset().top + (item_data.height/2)) + "px");
              $(node).css("left", (elOrigin.offset().left - descriptionWidth/2) + "px");
              $(node).css("transform", "rotate(-90deg)");
            }

            elParent.append(node);
          }
        }
      }

      

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

    // @param destination
    // The DOM element which will be used as container (div)
    // @param item_data
    // One of the elements of the "items" array, from the configuration JSON
    $scope.drawRadioVote = function(destination, item_data){
      console.log("drawRadioVote()");
      console.log("item_data:");
      console.log(item_data);
      var config = $scope.settings;
      var criterion = item_data.criteria[0];
      var criterionValue = (criterion.valueDefault || criterion.valueDefault === 0) ? criterion.valueDefault : null;

      var div = $('<div>');
      div.attr({
        'class': 'criterion',
        'data-criterion-id': criterion.entity_id,
        'data-criterion-name': criterion.name,
        'data-criterion-value': null
      });
      console.log("div: ", div);

      // adapt data format from BinaryIdeaVote which has labelYes and labelNo, to PluralityIdeaVote which has possibleValues
      // criterion.possibleValues is like so: [ { label: 'Choice 1', value: 0 }, { label: 'Choice 2', value: 1} ]
      if ( 'type' in criterion && criterion.type == 'BinaryIdeaVote' )
      {
        var labelYes = ( 'labelYes' in criterion ) ? criterion.labelYes : 'Yes';
        var labelNo = ( 'labelNo' in criterion ) ? criterion.labelNo : 'No';
        criterion.possibleValues = [
          {
            "label": labelNo,
            "value": 0 // or false?
          },
          {
            "label": labelYes,
            "value": 1 // or true?
          }
        ];
      }

      var updateSelectedValue = function(){
        console.log("updateSelectedValue()");
        var el = div.find('input:checked');
        if ( el )
        {
          div.attr('data-criterion-value', el.val());
        }
        else {
          div.attr('data-criterion-value', null);
        }
      };

      if ( 'possibleValues' in criterion )
      {
        if ( 'name' in criterion )
        {
          var name = $('<strong>');
          name.text(criterion.name);
          div.append(name);
        }
        if ( 'description' in criterion )
        {
          var description = $('<p>');
          description.text(criterion.description);
          div.append(description);
        }
        
        $.each ( criterion.possibleValues, function(index, item){
          if ( 'value' in item && 'label' in item )
          {
            var option = $('<div>');
            var input = $('<input>');
            var radio_id = 'radio_'+criterion.entity_id+'_'+item.value;
            input.attr({
              type: 'radio',
              name: criterion.entity_id, // criterion.name,
              value: item.value,
              id: radio_id
            });
            if ( criterionValue === item.value )
              input.prop("checked", true);
            input.on('change', updateSelectedValue);
            var label = $('<label>');
            label.attr('for', radio_id);
            label.text(item.label);
            option.append(input);
            option.append(label);
            console.log("option: ", option);
            div.append(option);
          }
        });
      }
      
      destination.append(div);

      updateSelectedValue();
    };



    $scope.drawUIWithTable = function(){
      console.log("drawUIWithTable()");
      var config = $scope.settings;
      var holder_svg = null; //d3.select("#d3_container");
      var holder_jquery = null; //$("#d3_container");

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
        holder_svg = d3.select("#table_vote_item_"+i);
        holder_jquery = $("#table_vote_item_"+i);

        
        //console.log("item.type:");
        //console.log(item.type);
        if ( item.type == "vertical_gauge" )
        {
          $scope.drawVerticalGauge(holder_svg, item);
        }
        else if ( item.type == "2_axes" )
        {
          $scope.draw2AxesVote(holder_svg, item);
        }
        else if ( item.type == "radio" )
        {
          $scope.drawRadioVote(holder_jquery, item);
        }
      }

      console.log("drawUIWithTable() completed");
    };


    $scope.drawUIWithoutTable = function(){
      console.log("drawUIWithoutTable()");
      var config = $scope.settings;
      var holder_svg = d3.select("#d3_container");
      var holder_jquery = $("#d3_container");

      if ( "items" in config ){
      for ( var i = 0; i < config.items.length; ++i )
      {
        var item = config.items[i];
        //console.log("item.type:");
        //console.log(item.type);
        if ( item.type == "vertical_gauge" )
        {
          $scope.drawVerticalGauge(holder_svg, item);

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
              //holder_jquery.append("<a href='#' ng-click=\"submitSingleVote('"+criterion_endpoint+"', 'LickertIdeaVote', '"+criterion_id+"')\">Vote</a>").click(function(){
              var link = $("<button>Vote</button>");
              link.click(function(){ // TODO: does not work, all buttons call with the same parameter value
                console.log("coucou");
                $scope.submitSingleVote(criterion_endpoint, 'LickertIdeaVote', item.criteria[0]["id"]);
              });
              holder_jquery.append(link);
            }
          }
          */


        }
        else if ( item.type == "2_axes" )
        {
          $scope.draw2AxesVote(holder_svg, item);
        }
        else if ( item.type == "radio" )
        {
          $scope.drawRadioVote(holder_jquery, item);
        }
      }
      }

      console.log("drawUIWithoutTable() completed");
    };

}]);
