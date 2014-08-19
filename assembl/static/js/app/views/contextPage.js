define(function(require){

    var        Marionette = require('marionette'),
                      Ctx = require('modules/context'),
        CollectionManager = require('modules/collectionManager')
                        $ = require('jquery'),
                        _ = require('underscore'),
                       d3 = require('d3'),
                     i18n = require('utils/i18n'),
                   Moment = require('moment'),
              Permissions = require('utils/permissions'),
            CKEditorField = require('views/ckeditorField');

    var contextPage = Marionette.LayoutView.extend({
        template:'#tmpl-contextPage',
        panelType: 'homePanel',
        className: 'homePanel',
        gridSize: 2,
        hideHeader: true,
        getTitle: function() {
            return i18n.gettext('Home'); // unused
        },

        lineChartIsCumulative: true,
        lineChartShowPoints: false,

        /*
        events: {
            'click .lang': 'setLocale'
        },
        */

        initialize: function(options){
            //console.log("contextPage::initialize()");
            // add editable "objectives" field
            var that = this,
                currentUser = Ctx.getCurrentUser(),
                canEdit = currentUser.can(Permissions.ADMIN_DISCUSSION) || false;

            $.when( Ctx.getDiscussionPromise() ).then( function(discussion){
                // we implement here get() and save() methods (needed by CKEditor), so we mock a model instance
                // TODO: find a better solution, for example create and use a real Discussion model instead?
                discussion.get = function(field){
                    return this[field];
                };
                discussion.save = function(field, value){
                    this[field] = value;

                    // PUT changed data to the discussion endpoint
                    var endpoint_url = Ctx.getApiV2DiscussionUrl();
                    var post_data = {};
                    post_data[field] = value;
                    $.ajax({
                        method: 'PUT',
                        url: endpoint_url,
                        data: $.param(post_data),
                        headers: {'Content-Type': 'application/x-www-form-urlencoded'}
                    }).success(function(data){
                        //console.log("discussion PUT success:", data);
                    });

                    return true;
                };

                that.objectivesField = new CKEditorField({
                    'model': discussion,
                    'modelProp': 'objectives',
                    'placeholder': 'Objectives',
                    'canEdit': canEdit
                });
                // add editable "instigator" field
                that.instigatorField = new CKEditorField({
                    'model': discussion,
                    'modelProp': 'instigator',
                    'placeholder': 'Instigator',
                    'canEdit': canEdit
                });
                // add editable "introduction" and "introductionDetails" fields
                that.introductionField = new CKEditorField({
                    'model': discussion,
                    'modelProp': 'introduction',
                    'placeholder': 'Introduction',
                    'canEdit': canEdit
                });
                that.introductionDetailsField = new CKEditorField({
                    'model': discussion,
                    'modelProp': 'introductionDetails',
                    'placeholder': 'Introduction details',
                    'canEdit': canEdit
                });
            });

            this.computeStatistics();
        },

        onRender: function(){
            //console.log("contextPage::onRender()");
            var that = this,
                currentUser = Ctx.getCurrentUser(),
                canEdit = currentUser.can(Permissions.ADMIN_DISCUSSION) || false;

            $.when( Ctx.getDiscussionPromise() ).then( function(discussion){
                //console.log("discussion successfully loaded: ", discussion);

                // show discussion title
                that.$(".discussion-title").html(discussion.topic);

                that.objectivesField.renderTo( that.$('.objectives'));
                that.instigatorField.renderTo( that.$('.instigator'));
                that.introductionField.renderTo( that.$('.introduction'));
                if ( discussion["introductionDetails"] && discussion.introductionDetails.length > 0 )
                {
                    that.$('#introduction-button-see-more').show();
                    that.introductionDetailsField.renderTo( that.$('.introduction-details'));
                }
                else if ( canEdit )
                {
                    that.introductionDetailsField.renderTo( that.$('.introduction-details-empty'));
                }
                if (canEdit) {
                    // Not clear why this is necessary.
                    that.objectivesField.delegateEvents();
                    that.instigatorField.delegateEvents();
                    that.introductionField.delegateEvents();
                    that.introductionDetailsField.delegateEvents();
                }
            });

            this.draw();
        },

        /*
        * @param messages: [{'day': '2012-01-01', 'value': 1},...] sorted by date ascending
        * @param threshold: Number
        * @returns a period object {'period_type': 'last 2 weeks', 'date_min': Date, 'date_max': Date }
        */
        deduceGoodPeriod: function(messages, threshold){
            var count = 0;
            var sz = messages.length;
            var date_threshold_min = messages[0].date;
            var date_threshold_max = messages[sz-1].date; // or we could want it to be today
            var threshold_passed = false;
            for ( var i = sz-1; i >= 0; --i)
            {
                count += messages[i]['value'];
                if ( count >= threshold )
                {
                    threshold_passed = true;
                    date_threshold_min = messages[i]['date'];
                    //console.log("count:");
                    //console.log(count);
                    break;
                }
            }

            //console.log("threshold_passed:");
            //console.log(threshold_passed);
            //console.log("date_threshold_max:");
            //console.log(date_threshold_max);
            //console.log("date_threshold_min:");
            //console.log(date_threshold_min);

            // deduce the period to apply from the date_threshold_min and date_threshold_max values
            var date_min = new Date(date_threshold_min);
            var threshold_date = date_min;
            var date_max = new Date(date_threshold_max);
            var date_min_moment = Moment(date_threshold_min);
            var date_max_moment = Moment(date_threshold_max);
            var number_of_days = date_max_moment.diff(date_min_moment, 'days');
            var period_type = 'last week';
            if ( number_of_days <= 7 )
            {
                period_type = 'last week';
                date_min_moment = date_max_moment.subtract('days', 7);
                date_min = date_min_moment.toDate();
            }
            if ( number_of_days <= 14 )
            {
                period_type = 'last 2 weeks';
                date_min_moment = date_max_moment.subtract('days', 14);
                date_min = date_min_moment.toDate();
            }
            else if ( number_of_days <= 31 )
            {
                period_type = 'last month';
                date_min_moment = date_max_moment.subtract('months', 1);
                date_min = date_min_moment.toDate();
            }
            else if ( number_of_days <= (31+30+30) )
            {
                period_type = 'last 3 months';
                date_min_moment = date_max_moment.subtract('months', 3);
                date_min = date_min_moment.toDate();
            }
            else if ( number_of_days <= (31+30)*3 )
            {
                period_type = 'last 6 months';
                date_min_moment = date_max_moment.subtract('months', 6);
                date_min = date_min_moment.toDate();
            }
            else
            {
                period_type = 'last year';
                date_min_moment = date_max_moment.subtract('years', 1);
                date_min = date_min_moment.toDate();
            }
            // console.log("period_type:");
            // console.log(period_type);
            // console.log("date_min:");
            // console.log(date_min);
            // console.log("date_max:");
            // console.log(date_max);
            return {
                "period_type": period_type,
                "date_min": date_min,
                "date_max": date_max,
                "threshold_passed": threshold_passed,
                "threshold_date": threshold_date,
                "threshold_value": count
            };
        },

        computeStatistics: function(){
            var that = this;
            var collectionManager = new CollectionManager();
            //var users = collectionManager.getAllUsersCollectionPromise();

            $.when( collectionManager.getAllUsersCollectionPromise(),
                collectionManager.getAllMessageStructureCollectionPromise()
            ).then( function( allUsersCollection, allMessagesCollection ){
                // console.log("collections allUsersCollection, allMessagesCollection are loaded");
                // console.log(allMessagesCollection);

                var messages_sorted_by_date = new Backbone.Collection(allMessagesCollection.toJSON()); // clone
                messages_sorted_by_date.sortBy(function(msg){
                    return msg.date;
                });
                //console.log("messages_sorted_by_date1:");
                //console.log(messages_sorted_by_date);

                messages_sorted_by_date = messages_sorted_by_date.toJSON();

                //console.log("messages_sorted_by_date2:");
                //console.log(messages_sorted_by_date);

                var messages_total = messages_sorted_by_date.length;
                // console.log("messages_total: " + messages_total);

                // pick only day, because date field looks like "2012-06-19T15:14:56"
                var convertDateTimeToDate = function (datetime){
                    return datetime.substr(0, datetime.indexOf('T'));
                };
                
                var first_message_date = convertDateTimeToDate(messages_sorted_by_date[0].date);
                // console.log("first_message_date: " + first_message_date);
                var last_message_date = convertDateTimeToDate(messages_sorted_by_date[messages_total-1].date);
                // console.log("last_message_date: " + last_message_date);


                // find which period is best to show the stats: the first period among week, month, debate which gathers at least X% of the contributions

                var messages_threshold = messages_total * 0.15;
                //console.log("messages_threshold:");
                //console.log(messages_threshold);

                var messages_per_day = _.groupBy(messages_sorted_by_date, function(msg){
                    return convertDateTimeToDate(msg.date);
                });
                var messages_per_day_totals = {};
                var messages_per_day_totals_array = [];
                for ( k in messages_per_day )
                {
                    var sz = messages_per_day[k].length;
                    messages_per_day_totals[k] = sz;
                    messages_per_day_totals_array.push({ 'date': k, 'value': sz });
                    //messages_per_day_totals_array.push({ 'date': new Date(k), 'value': sz });
                }
                messages_per_day_totals_array = _.sortBy(messages_per_day_totals_array, function(msg){return msg['date'];});
                //console.log("messages_per_day_totals_array:");
                //console.log(messages_per_day_totals_array);

                var period = that.deduceGoodPeriod(messages_per_day_totals_array, messages_threshold);
                
                var statsPeriodName = i18n.gettext(period.period_type);
                // this switch is here just so that the i18n strings are correcly parsed and put into the .pot file
                switch ( period.period_type ){
                    case 'last week':
                        statsPeriodName = i18n.gettext('last week');
                    break;
                    case 'last 2 weeks':
                        statsPeriodName = i18n.gettext('last 2 weeks');
                    break;
                    case 'last month':
                        statsPeriodName = i18n.gettext('last month');
                    break;
                    case 'last 3 months':
                        statsPeriodName = i18n.gettext('last 3 months');
                    break;
                    case 'last 6 months':
                        statsPeriodName = i18n.gettext('last 6 months');
                    break;
                    case 'last year':
                        statsPeriodName = i18n.gettext('last year');
                    break;
                }

                var date_min = period.date_min;
                var date_max = period.date_max;



                // fill missing days

                /*
                * data: { "2012-01-01" : 42 }
                * first_date: Date object // was "2012-01-01"
                * last_date: Date object // was "2012-01-01"
                */
                function fillMissingDays(data, first_date, last_date)
                {
                    //var first_date = new Date(first_day);
                    //var last_date = new Date(last_day);
                    // use new Date(first_date.getTime()) to clone the Date object
                    for ( var d = new Date(first_date.getTime()); d <= last_date; d.setDate(d.getDate() + 1) )
                    {
                        var key = convertDateTimeToDate(d.toISOString());
                        if (!( key in data))
                        {
                            data[key] = 0;
                        }
                    }
                    return data;
                }
                //var messages_per_day_totals_filled = fillMissingDays(messages_per_day_totals, date_min, date_max);
                var messages_per_day_totals_filled = fillMissingDays(messages_per_day_totals, new Date(first_message_date), new Date(last_message_date));
                //console.log("messages_per_day_totals_filled:");
                //console.log(messages_per_day_totals_filled);


                // convert object to array

                var messages_per_day_totals_filled_array = [];
                for ( v in messages_per_day_totals_filled )
                {
                    messages_per_day_totals_filled_array.push({ 'date': new Date(v), 'value': messages_per_day_totals_filled[v] });
                }
                //console.log("messages_per_day_totals_filled_array:");
                //console.log(messages_per_day_totals_filled_array);

                messages_per_day_totals_filled_array = _.sortBy(messages_per_day_totals_filled_array, function(msg){return msg['date'];});



                
                var messages_in_period = _.filter(messages_per_day_totals_filled_array, function(msg){
                    return (msg.date >= date_min && msg.date <= date_max);
                });

                //console.log("messages_in_period:");
                //console.log(messages_in_period);


                messages_in_period = _.sortBy(messages_in_period, function(msg){
                    return msg.date;
                });

                
                // accumulate messages. maybe we should not start at 0 but at the accumulated value on start date (accumulated from the beginning of the debate)
                var messages_in_period_total = 0;
                _.each(messages_in_period, function(msg){
                    messages_in_period_total += msg.value;
                    //msg.value = messages_in_period_total;
                });

                if ( that.lineChartIsCumulative )
                {
                    var i = 0;
                    var messages_per_day_totals_filled_array_cumulative = $.extend(true, [], messages_per_day_totals_filled_array);
                    _.each(messages_per_day_totals_filled_array_cumulative, function(msg){
                        i += msg.value;
                        msg.value = i;
                    });
                    that.messages_per_day_for_line_graph = messages_per_day_totals_filled_array_cumulative;
                }
                else
                {
                    that.messages_per_day_for_line_graph = messages_per_day_totals_filled_array;
                }



                // -----
                // compute messages authors for 2 periods: current period and since the beginning of the debate
                // -----

                var extractMessageAuthor = function(msg){
                    return msg.idCreator;
                };

                var authors = _.map(messages_sorted_by_date, extractMessageAuthor);
                //console.log("authors:");
                //console.log(authors);
                authors = _.uniq(authors);
                //console.log("authors:");
                //console.log(authors);
                var authors_total = authors.length;

                var messages_in_period_full = _.filter(messages_sorted_by_date, function(msg){
                    var d = new Date(msg.date);
                    return d >= date_min && d <= date_max;
                });
                messages_in_period_total = messages_in_period_full.length;

                var messages_not_in_period_full = _.filter(messages_sorted_by_date, function(msg){
                    var d = new Date(msg.date);
                    return d < date_min || d > date_max;
                });

                var authors_in_period = _.map(messages_in_period_full, extractMessageAuthor);
                //console.log("authors_in_period:");
                //console.log(authors_in_period);
                authors_in_period = _.uniq(authors_in_period);
                //console.log("authors_in_period:");
                //console.log(authors_in_period);
                var authors_in_period_total = authors_in_period.length;

                var authors_not_in_period = _.map(messages_not_in_period_full, extractMessageAuthor);
                authors_not_in_period = _.uniq(authors_not_in_period);
                var authors_not_in_period_total = authors_not_in_period.length;

                //console.log("authors_not_in_period:",authors_not_in_period);
                //console.log("authors_in_period:",authors_in_period);
                var new_authors_in_period = _.difference(authors_in_period, authors_not_in_period);
                //console.log("new_authors_in_period:",new_authors_in_period);
                var new_authors_in_period_total = new_authors_in_period.length;

                var messages_in_period_by_new_authors = _.filter(messages_in_period_full, function(msg){
                    return _.contains(new_authors_in_period, msg.idCreator);
                });
                var messages_in_period_by_new_authors_total = messages_in_period_by_new_authors.length;

                // -----
                // show results
                // -----

                that.stats = {
                    "statsPeriodName": statsPeriodName,
                    "messages_in_period_total": messages_in_period_total,
                    "messages_total": messages_total
                }
                
                var pie_chart_data = [
                    "the title of the first element is purposely not used, only its data is used", //"posted since the beginning of the debate",
                    messages_total,
                    authors_total,
                    {
                        "messages_posted_during_current_period": [
                            i18n.gettext('authors since') + " " + statsPeriodName,
                            messages_in_period_total,
                            authors_in_period_total,
                            {
                                "messages_from_new_authors": [
                                    i18n.gettext("new authors since") + " " + statsPeriodName,
                                    messages_in_period_by_new_authors_total,
                                    new_authors_in_period_total,
                                    {}
                                ],
                                "messages_from_old_authors": [
                                    i18n.gettext("already contributing authors since") + " " + statsPeriodName,
                                    messages_in_period_total - messages_in_period_by_new_authors_total,
                                    authors_in_period_total - new_authors_in_period_total,
                                    {}
                                ]
                            }
                        ],
                        "messages_posted_before_current_period": [
                            i18n.gettext("authors before") + " " + statsPeriodName,
                            messages_total - messages_in_period_total,
                            authors_not_in_period_total,
                            {}
                        ]
                    }
                ];

                var pie_chart_default_legend_data = [
                    null,
                    null,
                    i18n.gettext("authors since the beginning of the debate"),
                    null,
                    messages_total,
                    authors_total
                ];

                that.pie_chart_data = pie_chart_data;
                that.pie_chart_default_legend_data = pie_chart_default_legend_data;
                that.render();
            });
        },

        draw: function() {
            // -----
            // show results
            // -----
            if (this.pie_chart_data === undefined)
                return;
            var stats = this.stats;
            var t = this.lineChartIsCumulative ? i18n.gettext("Evolution of the total number of messages") : i18n.gettext("Evolution of the number of messages posted");
            this.$(".statistics").html("<h2>" + i18n.gettext("Statistics") + "</h2><p class='stats_messages'>" + t + "</p>");
            this.drawLineGraph(this.messages_per_day_for_line_graph);
            this.drawPieChart(this.pie_chart_data, this.pie_chart_default_legend_data);
        },

        drawLineGraph: function(data){
            var w = 450,
                h = 250,
                that = this;

            var maxDataPointsForDots = 100,
                transitionDuration = 1000;

            var svg = null,
                yAxisGroup = null,
                xAxisGroup = null,
                dataCirclesGroup = null,
                dataLinesGroup = null;

            function draw() {
                //var data = generateData();
                var margin = 30;
                var max = d3.max(data, function(d) { return d.value });
                var min = 0;
                var pointRadius = 3;
                var x = d3.time.scale().range([0, w - margin * 2]).domain([data[0].date, data[data.length - 1].date]);
                var y = d3.scale.linear().range([h - margin * 2, 0]).domain([min, max]);

                //var xAxis = d3.svg.axis().scale(x).tickSize(h - margin * 2).tickPadding(10).ticks(7).tickFormat(d3.time.format("%x"));
                //var xAxis = d3.svg.axis().scale(x).tickSize(h - margin * 2).tickPadding(10).ticks(d3.time.week, 2).tickFormat(d3.time.format("%x"));
                var xAxis = d3.svg.axis().scale(x).tickSize(h - margin * 2).tickPadding(10).ticks(5).tickFormat(d3.time.format("%Y-%m-%d"));
                var yAxis = d3.svg.axis().scale(y).orient('left').tickSize(-w + margin * 2).tickPadding(10).tickFormat(d3.format("d"));
                var t = null;
                var chart_div = that.$('.chart');

                if (chart_div.empty()) {
                    svg = d3.select(chart_div[0])
                        .append('svg:svg')
                            .attr('width', w)
                            .attr('height', h)
                            .attr('class', 'viz')
                        .append('svg:g')
                            .attr('transform', 'translate(' + margin + ',' + margin + ')');
                } else {
                    svg = d3.select(chart_div).select('svg').select('g');
                }

                t = svg.transition().duration(transitionDuration);

                // y ticks and labels
                if (!yAxisGroup) {
                    yAxisGroup = svg.append('svg:g')
                        .attr('class', 'yTick')
                        .call(yAxis);
                }
                else {
                    t.select('.yTick').call(yAxis);
                }

                // x ticks and labels
                if (!xAxisGroup) {
                    xAxisGroup = svg.append('svg:g')
                        .attr('class', 'xTick')
                        .call(xAxis);
                }
                else {
                    t.select('.xTick').call(xAxis);
                }

                // Draw the lines
                if (!dataLinesGroup) {
                    dataLinesGroup = svg.append('svg:g');
                }

                var dataLines = dataLinesGroup.selectAll('.data-line')
                        .data([data]);

                var line = d3.svg.line()
                    // assign the X function to plot our line as we wish
                    .x(function(d,i) { 
                        // verbose logging to show what's actually being done
                        //console.log('Plotting X value for date: ' + d.date + ' using index: ' + i + ' to be at: ' + x(d.date) + ' using our xScale.');
                        // return the X coordinate where we want to plot this datapoint
                        return x(d.date); 
                    })
                    .y(function(d) { 
                        // verbose logging to show what's actually being done
                        //console.log('Plotting Y value for data value: ' + d.value + ' to be at: ' + y(d.value) + " using our yScale.");
                        // return the Y coordinate where we want to plot this datapoint
                        return y(d.value); 
                    })
                    .interpolate("linear");


                var garea = d3.svg.area()
                    .interpolate("linear")
                    .x(function(d) { 
                        // verbose logging to show what's actually being done
                        return x(d.date); 
                    })
                            .y0(h - margin * 2)
                    .y1(function(d) { 
                        // verbose logging to show what's actually being done
                        return y(d.value); 
                    });

                dataLines
                    .enter()
                    .append('svg:path')
                            .attr("class", "area")
                            .attr("d", garea(data));

                dataLines.enter().append('path')
                     .attr('class', 'data-line')
                     .style('opacity', 0.3)
                     .attr("d", line(data));

                // BUG: d in the inner function is the whole array, not elements.
                // dataLines.transition()
                //     .attr("d", line)
                //     .duration(transitionDuration)
                //         .style('opacity', 1)
                //                     .attr("transform", function(d) {
                //                         return "translate(" + x(d.date) + "," + y(d.value) + ")"; });

                dataLines.exit()
                    .transition()
                    .attr("d", line)
                    .duration(transitionDuration)
                                    .attr("transform", function(d) {
                                        return "translate(" + x(d.date) + "," + y(0) + ")"; })
                        .style('opacity', 1e-6)
                        .remove();

                d3.selectAll(".area").transition()
                    .duration(transitionDuration)
                    .attr("d", garea(data));

                // Draw the points
                if (!dataCirclesGroup) {
                    dataCirclesGroup = svg.append('svg:g');
                }

                var previousValue = null;
                var circles = dataCirclesGroup.selectAll('.data-point')
                    .data(
                        data.filter(
                            that.lineChartShowPoints
                            ? (
                                that.lineChartIsCumulative
                                ?
                                function(d){
                                    var ret = (previousValue != d.value);
                                    previousValue = d.value;
                                    return ret;
                                }
                                :
                                function(d){
                                    return d.value != 0;
                                }
                            )
                            :
                            function(d){
                                return false; 
                            }
                        )
                    );

                var circleRadius = function(d){
                    if ( d.value == 0 )
                        return 0;
                    return (data.length <= maxDataPointsForDots) ? pointRadius : 1;
                };

                circles
                    .enter()
                        .append('svg:circle')
                            .attr('class', 'data-point')
                            .attr('title', function() {
                              var d = this.__data__;
                              return d.date.toDateString() + '\n' + d.value; // could be i18n
                            })
                            .style('opacity', 1e-6)
                            .attr('cx', function(d) { return x(d.date) })
                            .attr('cy', function() { return y(0) })
                            .attr('r', circleRadius)
                        .transition()
                        .duration(transitionDuration)
                            .style('opacity', 1)
                            .attr('cx', function(d) { return x(d.date) })
                            .attr('cy', function(d) { return y(d.value) });

                circles
                    .transition()
                    .duration(transitionDuration)
                        .attr('cx', function(d) { return x(d.date) })
                        .attr('cy', function(d) { return y(d.value) })
                        .attr('r', circleRadius)
                        .style('opacity', 1);

                circles
                    .exit()
                        .transition()
                        .duration(transitionDuration)
                            // Leave the cx transition off. Allowing the points to fall where they lie is best.
                            //.attr('cx', function(d, i) { return xScale(i) })
                            .attr('cy', function() { return y(0) })
                            .style("opacity", 1e-6)
                            .remove();
                /*
                $('svg circle').tipsy({ 
                    gravity: 'w', 
                    html: true, 
                    title: function() {
                        var d = this.__data__;
                        var pDate = d.date;
                        return 'Date: ' + pDate + '<br>Value: ' + d.value; // could be i18n
                    }
                });
                */
            }

            draw();

        },

        drawPieChart: function(pie_chart_data, default_legend_data){
            /*
            taken from:
            http://bl.ocks.org/adewes/4710330/94a7c0aeb6f09d681dbfdd0e5150578e4935c6ae
            http://www.andreas-dewes.de/code_is_beautiful/
            */
            var that = this;
            function init_pie_chart_plot(element_name, data)
            {
                var plot = that.$('.'+element_name)[0];
                while (plot.hasChildNodes())
                {
                    plot.removeChild(plot.firstChild);
                }

                var width = Math.max(Math.min(plot.offsetWidth,plot.offsetHeight), 250);
                //console.log("plot width: ", width);
                var height = width;
                // var x_margin = 40; // not used
                // var y_margin = 40; // not used
                // var name_index = 0; // not used
                var count_index = 1;
                var children_index = 3;
                
                // var max_depth=3; // not used
                
                var data_slices = [];
                // var max_level = 4;
                var max_level = 2;
                var color = d3.scale.category20c();

                var svg = d3.select(plot).append("svg")
                    .attr("width", width)
                    .attr("height", height)
                    .append("g")
                    .attr("transform", "translate(" + width / 2 + "," + height * .52 + ")");
                      
                function process_data(data,level,start_deg,stop_deg)
                {
                    var name = data[0];
                    var total = data[1];
                    var children = data[3];
                    var current_deg = start_deg;
                    if (level > max_level)
                    {
                        return;
                    }
                    if (start_deg == stop_deg)
                    {
                        return;
                    }
                    data_slices.push([start_deg,stop_deg,name,level,data[1],data[2]]);
                    for (var key in children)
                    {
                        child = children[key];
                        var inc_deg = (stop_deg-start_deg)/total*child[count_index];
                        var child_start_deg = current_deg;
                        current_deg+=inc_deg;
                        var child_stop_deg = current_deg;
                        var span_deg = child_stop_deg-child_start_deg;
                        process_data(child,level+1,child_start_deg,child_stop_deg);
                    }
                }
                
                process_data(data,0,0,360./180.0*Math.PI);

                var ref = data_slices[0];
                var next_ref = ref;
                var last_refs = [];

                // Quentin: remove first element, and make the next one display as a disc (instead of having a hole)
                data_slices.splice(0,1);
                _.each (data_slices, function(el){
                    el[3] -= 1; // decrease the "level"
                });

                //var thickness = width/2.0/(max_level+2)*1.1;
                var thickness = width/2.0/(max_level+1)*1.1;
                    
                var arc = d3.svg.arc()
                .startAngle(function(d) { if(d[3]==0){return d[0];}return d[0]+0.01; })
                .endAngle(function(d) { if(d[3]==0){return d[1];}return d[1]-0.01; })
                .innerRadius(function(d) { return 1.1*d[3]*thickness; })
                .outerRadius(function(d) { return (1.1*d[3]+1)*thickness; });    

                var slices = svg.selectAll(".form")
                    .data(function(d) { return data_slices; })
                    .enter()
                    .append("g");
                    slices.append("path")
                    .attr("d", arc)
                    .attr("id",function(d,i){return element_name+i;})
                    .style("fill", function(d) { return color(d[2]);})
                    .on("click",animate)
                    .on("mouseover",update_legend)
                    .on("mouseout",remove_legend)
                    .attr("class","form")
                    .append("svg:title")
                    .text(get_slice_title);

                var legend_div = that.$('.'+element_name+'_legend')[0];
                var legend = d3.select(legend_div);

                remove_legend(null);
                    
                function update_legend(d)
                {
                    //legend.html("<h2>"+d[2]+"</h2><p>"+d[4]+" " + i18n.gettext("messages, by") + " "+d[5]+" " + i18n.gettext("authors") + "</p>");
                    legend.html("<p>" + d[4] + " " + i18n.gettext("messages, posted by") + " " + d[5] + " " + d[2] + "</p>");
                    legend.transition().duration(200).style("opacity","1");
                }

                function get_slice_title(d)
                {
                    return d[4] + " " + i18n.gettext("messages, posted by") + " " + d[5] + " " + d[2];
                }
                
                function remove_legend(d)
                {
                    //legend.transition().duration(1000).style("opacity","0");
                    //legend.html("<h2>&nbsp;</h2>")
                    update_legend(default_legend_data);
                }
                
                function get_start_angle(d,ref)
                {
                    if (ref)
                    {
                        var ref_span = ref[1]-ref[0];
                        return (d[0]-ref[0])/ref_span*Math.PI*2.0
                    }
                    else
                    {
                        return d[0];
                    }
                }
                
                function get_stop_angle(d,ref)
                {
                    if (ref)
                    {
                        var ref_span = ref[1]-ref[0];
                        return (d[1]-ref[0])/ref_span*Math.PI*2.0
                    }
                    else
                    {
                        return d[0];
                    }
                }
                
                function get_level(d,ref)
                {
                    if (ref)
                    {
                        return d[3]-ref[3];
                    }
                    else
                    {
                        return d[3];
                    }
                }
                
                function rebaseTween(new_ref)
                {
                    return function(d)
                    {
                        var level = d3.interpolate(get_level(d,ref),get_level(d,new_ref));
                        var start_deg = d3.interpolate(get_start_angle(d,ref),get_start_angle(d,new_ref));
                        var stop_deg = d3.interpolate(get_stop_angle(d,ref),get_stop_angle(d,new_ref));
                        var opacity = d3.interpolate(100,0);
                        return function(t)
                        {
                            return arc([start_deg(t),stop_deg(t),d[2],level(t)]);
                        }
                    }
                }
                
                var animating = false;
                
                function animate(d) {
                    if (animating)
                    {
                        return;
                    }
                    animating = true;
                    var revert = false;
                    var new_ref;
                    if (d == ref && last_refs.length > 0)
                    {
                        revert = true;
                        last_ref = last_refs.pop();
                    }
                    if (revert)
                    {
                        d = last_ref;
                        new_ref = ref;
                        svg.selectAll(".form")
                        .filter(
                            function (b)
                            {
                                if (b[0] >= last_ref[0] && b[1] <= last_ref[1]  && b[3] >= last_ref[3])
                                {
                                    return true;
                                }
                                return false;
                            }
                        )
                        .transition().duration(1000).style("opacity","1").attr("pointer-events","all");
                    }
                    else
                    {
                        new_ref = d;
                        svg.selectAll(".form")
                        .filter(
                            function (b)
                            {
                                if (b[0] < d[0] || b[1] > d[1] || b[3] < d[3])
                                {
                                    return true;
                                }
                                return false;
                            }
                        )
                        .transition().duration(1000).style("opacity","0").attr("pointer-events","none");
                    }
                    svg.selectAll(".form")
                    .filter(
                        function (b)
                        {
                            if (b[0] >= new_ref[0] && b[1] <= new_ref[1] && b[3] >= new_ref[3])
                            {
                                return true;
                            }
                            return false;
                        }
                    )
                    .transition().duration(1000).attrTween("d",rebaseTween(d));
                    setTimeout(function(){
                        animating = false;
                        if (! revert)
                        {
                            last_refs.push(ref);
                            ref = d;
                        }
                        else
                        {
                            ref = d;
                        }
                    },1000);
                };

            }

            function init_plots()
            {
                init_pie_chart_plot("pie_chart",pie_chart_data);
            }

            //window.onload = init_plots;
            //window.onresize = init_plots;
            init_plots();
        }

    });

    return contextPage;

});