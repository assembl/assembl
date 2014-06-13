"use strict";

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
      if ( configService.user_votes_uri && configService.user_votes_uri != "null" )
      {
        $scope.postVoteUrl = AssemblToolsService.resourceToUrl(configService.user_votes_uri);
        console.log("postVoteUrl:");
        console.log($scope.postVoteUrl);
      }
      else
      {
        // TODO: better error
        // temporary disabled
        //alert("Error: The configuration JSON does not contain a \"user_votes_uri\" property.");
        //return;
        $scope.postVoteUrl = '';
      }
      

      $scope.drawUI();
      $scope.computeMyVotes();
    };

    $scope.computeMyVotes = function(){
      // do not use .data("criterion-value") because jQuery does not seem to read the value set by d3

      /*
      $scope.myVotes = [];
      // /!\ once serialized by $.param(), this would give "undefined=10&undefined=0&undefined=22222&undefined=50"
      $("#d3_container g.criterion").each(function(index) {
        $scope.myVotes.push({
          'id': $(this).attr("data-criterion-id"),
          'value': $(this).attr("data-criterion-value")
        });
      });
      */

      /**/
      $scope.myVotes = {};
      // once serialized by $.param(), this will give "rentabilite=10&risque=0&investissement=22222&difficulte_mise_en_oeuvre=50"
      $("#d3_container g.criterion").each(function(index) {
        $scope.myVotes[$(this).attr("data-criterion-id")] = $(this).attr("data-criterion-value");
      });
      /**/
      

      return $scope.myVotes;
    };

    $scope.submitVote = function(){
      console.log("submitVote()");
      $scope.computeMyVotes();
      console.log("myVotes:");
      console.log($scope.myVotes);
      console.log("$.param($scope.myVotes):");
      console.log($.param($scope.myVotes));


      // POST to postVoteUrl
      $http({
        method: "POST",
        url: $scope.postVoteUrl,
        data: $.param($scope.myVotes),
        //data: $scope.myVotes // and to post pure JSON, we comment the next line
        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
      }).success(function(data, status, headers){
        alert("success");
        console.log("data:");
        console.log(data);
        console.log("status:");
        console.log(status);
        console.log("headers:");
        console.log(headers);
        $location.path( "/voted" );
      }).error(function(status, headers){
        alert("error");
        console.log("status:");
        console.log(status);
        console.log("headers:");
        console.log(headers);
        //$location.path( "/voted" );
      });
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
        .attr("data-criterion-id", criterion.id)
        .attr("data-criterion-value", criterionValue);


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
        .attr("data-criterion-id", criteria[0].id)
        .attr("data-criterion-value", criterionXValue)
        .attr("data-criterion-type", "x");

      svg.append("g")
        .attr("class", "criterion")
        .attr("data-criterion-id", criteria[1].id)
        .attr("data-criterion-value", criterionYValue)
        .attr("data-criterion-type", "y");


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



    $scope.drawUI = function(){
      console.log("drawUI()");
      var config = $scope.settings;
      var holder = d3.select("#d3_container");

      for ( var i = 0; i < config.items.length; ++i )
      {
        var item = config.items[i];
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
      console.log("drawUI() completed");
    };

}]);
