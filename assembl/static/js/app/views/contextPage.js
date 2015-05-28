'use strict';

var Marionette = require('../shims/marionette.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    CollectionManager = require('../common/collectionManager.js'),
    $ = require('../shims/jquery.js'),
    _ = require('../shims/underscore.js'),
    d3 = require('d3'),
    i18n = require('../utils/i18n.js'),
    Moment = require('moment'),
    Permissions = require('../utils/permissions.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js'),
    CKEditorField = require('./ckeditorField.js'),
    Types = require('../utils/types.js'),
    Promise = require('bluebird');

var Partner = Marionette.ItemView.extend({
    template: '#tmpl-partnerItem',
    className: 'gu gu-2of7 partnersItem mrl',
    serializeData: function () {
        return {
            organization: this.model
        }
    },
    templateHelpers: function () {
        return {
            htmlEntities: function(str){
                return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            }
        };
    }

});

var PartnerList = Marionette.CompositeView.extend({
    template: '#tmpl-partnerList',
    childView: Partner,
    className:'gr mvxl',
    childViewContainer: '.partnersList',
    initialize: function(options){
        this.nbOrganisations = options.nbOrganisations;

        this.collection.models = _.reject(this.collection.models, function(model){
            return model.get('is_initiator');
        });

    },
    serializeData: function(){
        return {
            userCanEditDiscussion: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION),
            nbOrganisations: this.nbOrganisations,
            urlEdit: '/'+ Ctx.getDiscussionSlug() +'/partners'
        }
    }

});

var Synthesis = Marionette.ItemView.extend({
    template: '#tmpl-synthesisContext',
    initialize: function (options) {
      var that = this;

      this.model = new Backbone.Model();

      var synthesisMessage = options.allMessageStructureCollection.getLastSynthesisPost();
      if (synthesisMessage) {
        var synthesis = options.allSynthesisCollection.get(synthesisMessage.get('publishes_synthesis'));
        this.model.set({
          creation_date: synthesisMessage.get('date'),
          introduction: synthesis.get('introduction')
          });
      }
      else {
        this.model.set({
          empty: i18n.gettext("No synthesis of the discussion has been published yet")
        });
      }
    },

    events: {
        'click .js_readSynthesis': 'readSynthesis'
    },

    modelEvents: {
        'change': 'render'
    },

    serializeData: function () {
        return {
            synthesis: this.model,
            ctx: Ctx
        }
    },

    readSynthesis: function () {
        Assembl.vent.trigger("navigation:selected", "synthesis");
    }

});

var Statistics = Marionette.ItemView.extend({
    template: '#tmpl-statistics',
    initialize: function () {
        this.listenTo(Assembl.vent, 'contextPage:render', this.render);
        this.computeStatistics();
    },
    ui: {
        statistics: '.statistics',
        chart: '.chart'
    },

    lineChartIsCumulative: true,
    lineChartShowPoints: false,
    pieChartShowMessages: false,

    onRender: function () {
        this.draw();
    },

    draw: function () {
        // -----
        // show results
        // -----
        if (this.pie_chart_data === undefined) {
            return;
        }
        var stats = this.stats;
        var t = this.lineChartIsCumulative ? i18n.gettext("Evolution of the total number of messages") : i18n.gettext("Evolution of the number of messages posted");
        this.ui.statistics.html("<h2>" + i18n.gettext("Statistics") + "</h2><p class='stats_messages'>" + t + "</p>");
        this.drawLineGraph(this.messages_per_day_for_line_graph);
        this.drawPieChart(this.pie_chart_data, this.pie_chart_default_legend_data, this.legend_squares_data);
    },

    drawLineGraph: function (data) {
        var w = 450,
            h = 250,
            that = this;

        var maxDataPointsForDots = 100,
            transitionDuration = 1000;

        var svg = null,
            svg_orig = null,
            yAxisGroup = null,
            xAxisGroup = null,
            dataCirclesGroup = null,
            dataLinesGroup = null;

        function draw() {
            //var data = generateData();
            var margin = 30;
            var max = d3.max(data, function (d) {
                return d.value
            });
            var min = 0;
            var pointRadius = 3;
            var x = d3.time.scale().range([0, w - margin * 2]).domain([data[0].date, data[data.length - 1].date]);
            var y = d3.scale.linear().range([h - margin * 2, 0]).domain([min, max]);


            var xAxis = d3.svg.axis().scale(x).tickSize(h - margin * 2).tickPadding(10).tickFormat(function (d) {
                return Ctx.getNiceDate(d);
            });

            // set number of ticks
            var time_span = data[data.length - 1].date - data[0].date; // in ms
            var time_span_in_days = time_span / (1000 * 60 * 60 * 24);
            if (time_span_in_days <= 30)
                xAxis.ticks(d3.time.day, 5);
            else if (time_span_in_days > 30 && time_span_in_days <= 3 * 30)
                xAxis.ticks(d3.time.week, 2);
            else if (time_span_in_days > 3 * 30 && time_span_in_days <= 6 * 30)
                xAxis.ticks(d3.time.month, 1);
            else
                xAxis.ticks(4);


            var yAxis = d3.svg.axis().scale(y).orient('left').tickSize(-w + margin * 2).tickPadding(10).tickFormat(d3.format("d"));
            var t = null;
            var chart_div = that.$('.chart');


            if (chart_div.empty()) {
                svg_orig = d3.select(chart_div[0]).append('svg:svg')
                    .attr('width', w)
                    .attr('height', h)
                    .attr('class', 'viz');
                svg = svg_orig.append('svg:g')
                    .attr('transform', 'translate(' + margin + ',' + margin + ')')
                ;
            } else {
                svg_orig = d3.select(chart_div).select('svg');
                svg = svg_orig.select('g');
            }

            var bisectDate = d3.bisector(function (d) {
                return d.date;
            }).left;

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
                .x(function (d, i) {
                    // verbose logging to show what's actually being done
                    //console.log('Plotting X value for date: ' + d.date + ' using index: ' + i + ' to be at: ' + x(d.date) + ' using our xScale.');
                    // return the X coordinate where we want to plot this datapoint
                    return x(d.date);
                })
                .y(function (d) {
                    // verbose logging to show what's actually being done
                    //console.log('Plotting Y value for data value: ' + d.value + ' to be at: ' + y(d.value) + " using our yScale.");
                    // return the Y coordinate where we want to plot this datapoint
                    return y(d.value);
                })
                .interpolate("linear");


            var garea = d3.svg.area()
                .interpolate("linear")
                .x(function (d) {
                    // verbose logging to show what's actually being done
                    return x(d.date);
                })
                .y0(h - margin * 2)
                .y1(function (d) {
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
                .attr("transform", function (d) {
                    return "translate(" + x(d.date) + "," + y(0) + ")";
                })
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
                            function (d) {
                                var ret = (previousValue != d.value);
                                previousValue = d.value;
                                return ret;
                            }
                            :
                            function (d) {
                                return d.value != 0;
                            }
                        )
                        :
                        function (d) {
                            return false;
                        }
                )
            );

            var circleRadius = function (d) {
                if (d.value == 0)
                    return 0;
                return (data.length <= maxDataPointsForDots) ? pointRadius : 1;
            };

            circles
                .enter()
                .append('svg:circle')
                .attr('class', 'data-point')
                .attr('title', function () {
                    var d = this.__data__;
                    return d.date.toDateString() + '\n' + d.value; // could be i18n
                })
                .style('opacity', 1e-6)
                .attr('cx', function (d) {
                    return x(d.date)
                })
                .attr('cy', function () {
                    return y(0)
                })
                .attr('r', circleRadius)
                .transition()
                .duration(transitionDuration)
                .style('opacity', 1)
                .attr('cx', function (d) {
                    return x(d.date)
                })
                .attr('cy', function (d) {
                    return y(d.value)
                });

            circles
                .transition()
                .duration(transitionDuration)
                .attr('cx', function (d) {
                    return x(d.date)
                })
                .attr('cy', function (d) {
                    return y(d.value)
                })
                .attr('r', circleRadius)
                .style('opacity', 1);

            circles
                .exit()
                .transition()
                .duration(transitionDuration)
                // Leave the cx transition off. Allowing the points to fall where they lie is best.
                //.attr('cx', function(d, i) { return xScale(i) })
                .attr('cy', function () {
                    return y(0)
                })
                .style("opacity", 1e-6)
                .remove();

            // define a gradient in the SVG (using a "linearGradient" tag inside the "defs" tag). 0% = top; 100% = bottom
            var defs = svg_orig.append("defs");
            var lg = defs.append("linearGradient")
                .attr("id", "lineChartLegendGradient")
                .attr("x1", "0%")
                .attr("y1", "0%")
                .attr("x2", "0%")
                .attr("y2", "100%");
            lg.append("stop")
                .attr("class", "stop1")
                .attr("offset", "0%");
            lg.append("stop")
                .attr("class", "stop2")
                .attr("offset", "50%");
            lg.append("stop")
                .attr("class", "stop3")
                .attr("offset", "100%");


            var focus = svg.append("g")
                .attr("class", "focus")
                .style("display", "none");

            focus.append("circle")
                .attr("r", 4.5);

            focus.append("svg:rect")
                .attr("width", 1)
                .attr("height", 1);

            focus.append("text")
                //.attr("x", 9)
                .attr("width", 200)
                .attr("dy", ".35em");


            svg.append("rect")
                .attr("class", "overlay")
                .attr("width", w - margin * 2)
                .attr("height", h - margin * 2)
                .on("mouseover", function () {
                    focus.style("display", null);
                })
                .on("mouseout", function () {
                    focus.style("display", "none");
                })
                .on("mousemove", mouse_move);

            var i18n_messages = i18n.gettext("messages");
            var data_length = data.length;

            function mouse_move() {
                var mouse_position = d3.mouse(this);
                var x_position = mouse_position[0];
                var xInDomain = x.invert(x_position);
                var i = Math.min(data_length - 1, bisectDate(data, xInDomain, 1)),
                    d = data[i];
                if (i > 0 && i < data.length) {
                    var d0 = data[i - 1];
                    if (xInDomain - d0.date < d.date - xInDomain)
                        d = d0;
                }
                focus.attr("transform", "translate(" + x(d.date) + "," + y(d.value) + ")");
                var t = focus.select("text");
                //t.text(d.value + " (" + Ctx.getNiceDate(d.date) + ")");
                //t.text(i18n.sprintf(i18n.gettext("%d messages (%s)"), d.value, Ctx.getNiceDate(d.date))); // may be too slow
                t.text(d.value + " " + i18n_messages + " (" + Ctx.getNiceDate(d.date) + ")"); // probably faster
                var bbox = t.node().getBBox();
                //if ( x(d.date) > (w-margin*2)-100 )
                if (x(d.date) > bbox.width + 4) {
                    focus.select("rect")
                        .attr("transform", "translate(-9,0)");
                    t.attr("transform", "translate(-9,0)");
                    t.style("text-anchor", "end");

                }
                else {
                    focus.select("rect")
                        .attr("transform", "translate(9,0)");
                    t.attr("transform", "translate(9,0)");
                    t.style("text-anchor", "start");
                }

                bbox = t.node().getBBox(); // get new bbox
                focus.select("rect")
                    .attr("x", bbox.x)
                    .attr("y", bbox.y)
                    .attr("width", bbox.width)
                    .attr("height", bbox.height);
            }
        }

        draw();

    },

    drawPieChart: function (pie_chart_data, default_legend_data, legend_squares_data) {
        /*
         taken from:
         http://bl.ocks.org/adewes/4710330/94a7c0aeb6f09d681dbfdd0e5150578e4935c6ae
         http://www.andreas-dewes.de/code_is_beautiful/
         */
        var that = this;

        function init_pie_chart_plot(element_name, data) {
            var plot = that.$('.' + element_name)[0];

            if (!plot) {
                return;
            }

            while (plot.hasChildNodes()) {
                plot.removeChild(plot.firstChild);
            }

            var width = Math.max(Math.min(plot.offsetWidth, plot.offsetHeight), 250);
            var height = width;
            var inner_width = width - Object.keys(pie_chart_data[4]).length * 20; // retain color legend height
            var count_index = 1;
            var children_index = 3;

            var data_slices = [];
            // var max_level = 4;
            var max_level = 2;
            var color = d3.scale.category10();

            var svg_orig = d3.select(plot).append("svg")
                .attr("width", width)
                .attr("height", height);
            var svg = svg_orig.append("g")
                .attr("transform", "translate(" + inner_width / 2 + "," + inner_width / 2 + ")");

            function process_data(data, level, start_deg, stop_deg, relative_ratio) {
                var name = data[0];
                var total = data[1];
                var children = data[4];
                var current_deg = start_deg;
                if (level > max_level) {
                    return;
                }
                if (start_deg == stop_deg) {
                    return;
                }
                data_slices.push([start_deg, stop_deg, name, level, data[1], data[2], data[3], relative_ratio]);
                for (var key in children) {
                    var child = children[key];
                    var child_relative_ratio = child[count_index] / total;
                    var inc_deg = (stop_deg - start_deg) / total * child[count_index];
                    var child_start_deg = current_deg;
                    current_deg += inc_deg;
                    var child_stop_deg = current_deg;
                    var span_deg = child_stop_deg - child_start_deg;
                    process_data(child, level + 1, child_start_deg, child_stop_deg, child_relative_ratio);
                }
            }

            process_data(data, 0, 0, 360. / 180.0 * Math.PI);

            var ref = data_slices[0];
            var next_ref = ref;
            var last_refs = [];

            // Quentin: remove first element, and make the next one display as a disc (instead of having a hole)
            data_slices.splice(0, 1);
            _.each(data_slices, function (el) {
                el[3] -= 1; // decrease the "level"
            });

            //var thickness = width/2.0/(max_level+2)*1.1;
            var thickness = inner_width / 2.0 / (max_level + 1) * 1.1;

            var arc = d3.svg.arc()
                .startAngle(function (d) {
                    if (d[3] == 0) {
                        return d[0];
                    }
                    return d[0] + 0.01;
                })
                .endAngle(function (d) {
                    if (d[3] == 0) {
                        return d[1];
                    }
                    return d[1] - 0.01;
                })
                .innerRadius(function (d) {
                    return 1.1 * d[3] * thickness;
                })
                .outerRadius(function (d) {
                    return (1.1 * d[3] + 1) * thickness;
                });

            var slices = svg.selectAll(".form")
                .data(function (d) {
                    return data_slices;
                })
                .enter()
                .append("g")
                .attr("class", "formg");
            slices.append("path")
                .attr("d", arc)
                .attr("id", function (d, i) {
                    return element_name + i;
                })
                .style("fill", function (d, i) {
                    //return color(d[2]);
                    return d[6];
                })
                //.on("click", animate)
                .on("mouseover", update_legend)
                .on("mouseout", remove_legend)
                .attr("class", "form")
                .append("svg:title")
                .text(get_slice_title)
            ;


            function addPercentText(customArc) {
                svg.selectAll(".formg")
                    .append("text")
                    .attr("transform", function (d) {
                        return "translate(" + arc.centroid(d) + ")";
                    })
                    .attr("dy", ".01em")
                    .attr("text-anchor", "middle")
                    .attr("class", "percent")
                    .attr("pointer-events", "none") // so that the text field does not interfere with the hover on the path element (for legend)
                    .text(function (d) {
                        return (d[7] * 100).toFixed(0) + " %";
                    })
                ;
            }

            function removePercentText() {
                svg.selectAll(".formg").selectAll(".percent").remove();
            }

            addPercentText();

            var legend_div = that.$('.' + element_name + '_legend')[0];
            var legend = d3.select(legend_div);

            remove_legend(null);

            // add fixed legend for color squares
            function drawSquaresLegend() {
                var x_offset = 0;
                var square_side = 16;
                var y_margin = 6;
                var y_offset = height - legend_squares_data.length * (square_side + y_margin) + y_margin;
                for (var i = 0; i < legend_squares_data.length; ++i) {
                    var item = legend_squares_data[i];
                    svg_orig.append("rect")
                        .attr("fill", item["color"])
                        .attr("x", x_offset)
                        .attr("y", y_offset)
                        .attr("width", square_side)
                        .attr("height", square_side)
                    ;
                    svg_orig.append("text")
                        .attr("x", x_offset + square_side + 5)
                        .attr("y", y_offset + square_side * 0.7)
                        .attr("width", 200)
                        .attr("height", 25)
                        .text(item["title"])
                    ;
                    y_offset += (square_side + y_margin);
                }
            }

            drawSquaresLegend();


            function update_legend(d) {
                fake_hover_first_level_elements(false);
                if (that.pieChartShowMessages === true) {
                    //legend.html("<p>" + d[5] + " " + i18n.gettext("messages, posted by") + " " + d[4] + " " + d[2] + "</p>");
                    legend.html("<p>" + d[5] + " " + i18n.gettext("messages, posted by") + " " + d[2] + "</p>");
                }
                else {
                    //legend.html("<p>" + d[4] + " " + d[2] + "</p>");
                    legend.html("<p>" + d[2] + "</p>");
                }
                legend.transition().duration(200).style("opacity", "1");
            }

            function get_slice_title(d) {
                if (that.pieChartShowMessages === true) {
                    //return d[5] + " " + i18n.gettext("messages, posted by") + " " + d[4] + " " + d[2];
                    return d[5] + " " + i18n.gettext("messages, posted by") + d[2];
                }
                else {
                    //return d[4] + " " + d[2];
                    return d[2];
                }
            }

            function remove_legend(d) {
                //legend.transition().duration(1000).style("opacity","0");
                //legend.html("<h2>&nbsp;</h2>")
                update_legend(default_legend_data);
                fake_hover_first_level_elements(true);
            }

            // toggle: bool
            function fake_hover_first_level_elements(toggle) {
                svg.selectAll(".form")
                    .filter( // select all first-level elements
                    function (d) {
                        return ( d[3] == 0 );
                    }
                )
                    .classed("hover", toggle);
            }

            function get_start_angle(d, ref) {
                if (ref) {
                    var ref_span = ref[1] - ref[0];
                    return (d[0] - ref[0]) / ref_span * Math.PI * 2.0
                }
                else {
                    return d[0];
                }
            }

            function get_stop_angle(d, ref) {
                if (ref) {
                    var ref_span = ref[1] - ref[0];
                    return (d[1] - ref[0]) / ref_span * Math.PI * 2.0
                }
                else {
                    return d[0];
                }
            }

            function get_level(d, ref) {
                if (ref) {
                    return d[3] - ref[3];
                }
                else {
                    return d[3];
                }
            }

            function rebaseTween(new_ref) {
                return function (d) {
                    var level = d3.interpolate(get_level(d, ref), get_level(d, new_ref));
                    var start_deg = d3.interpolate(get_start_angle(d, ref), get_start_angle(d, new_ref));
                    var stop_deg = d3.interpolate(get_stop_angle(d, ref), get_stop_angle(d, new_ref));
                    var opacity = d3.interpolate(100, 0);
                    return function (t) {
                        return arc([start_deg(t), stop_deg(t), d[2], level(t)]);
                    }
                }
            }

            var animating = false;

            function animate(d) {
                if (animating) {
                    return;
                }
                animating = true;
                var revert = false;
                var new_ref,
                    last_ref;
                if (d == ref && last_refs.length > 0) {
                    revert = true;
                    last_ref = last_refs.pop();
                }
                if (revert) {
                    d = last_ref;
                    new_ref = ref;
                    svg.selectAll(".form")
                        .filter(
                        function (b) {
                            if (b[0] >= last_ref[0] && b[1] <= last_ref[1] && b[3] >= last_ref[3]) {
                                return true;
                            }
                            return false;
                        }
                    )
                        .transition().duration(1000).style("opacity", "1").attr("pointer-events", "all");
                }
                else {
                    new_ref = d;
                    svg.selectAll(".form")
                        .filter(
                        function (b) {
                            if (b[0] < d[0] || b[1] > d[1] || b[3] < d[3]) {
                                return true;
                            }
                            return false;
                        }
                    )
                        .transition().duration(1000).style("opacity", "0").attr("pointer-events", "none");
                }
                svg.selectAll(".form")
                    .filter(
                    function (b) {
                        if (b[0] >= new_ref[0] && b[1] <= new_ref[1] && b[3] >= new_ref[3]) {
                            return true;
                        }
                        return false;
                    }
                )
                    .transition().duration(1000).attrTween("d", rebaseTween(d));
                setTimeout(function () {
                    animating = false;
                    if (!revert) {
                        last_refs.push(ref);
                        ref = d;
                    }
                    else {
                        ref = d;
                    }
                }, 1000);
            };

        }

        function init_plots() {
            init_pie_chart_plot("pie_chart", pie_chart_data);
        }

        //window.onload = init_plots;
        //window.onresize = init_plots;
        init_plots();
    },

    computeStatistics: function () {
        var that = this;
        var collectionManager = new CollectionManager();
        //var users = collectionManager.getAllUsersCollectionPromise();

        Promise.join(collectionManager.getAllUsersCollectionPromise(),
                     collectionManager.getAllMessageStructureCollectionPromise(),
            function (allUsersCollection, allMessagesCollection) {
                // console.log("collections allUsersCollection, allMessagesCollection are loaded");
                // console.log(allMessagesCollection);
                if (allMessagesCollection.size() == 0) {
                    var chart_div = that.$('.chart');
                    chart_div.html(i18n.gettext("Not enough data yet."));
                    that.$(".pie").hide();
                    return;
                }

                var messages_sorted_by_date = new Backbone.Collection(allMessagesCollection.toJSON()); // clone
                messages_sorted_by_date.sortBy(function (msg) {
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
                var convertDateTimeToDate = function (datetime) {
                    return datetime.substr(0, datetime.indexOf('T'));
                };

                var first_message_date = convertDateTimeToDate(messages_sorted_by_date[0].date);
                // console.log("first_message_date: " + first_message_date);
                var last_message_date = convertDateTimeToDate(messages_sorted_by_date[messages_total - 1].date);
                // console.log("last_message_date: " + last_message_date);


                // find which period is best to show the stats: the first period among week, month, debate which gathers at least X% of the contributions

                var messages_threshold = messages_total * 0.15;
                //console.log("messages_threshold:");
                //console.log(messages_threshold);

                var messages_per_day = _.groupBy(messages_sorted_by_date, function (msg) {
                    return convertDateTimeToDate(msg.date);
                });
                var messages_per_day_totals = {};
                var messages_per_day_totals_array = [];
                for (var k in messages_per_day) {
                    var sz = messages_per_day[k].length;
                    messages_per_day_totals[k] = sz;
                    messages_per_day_totals_array.push({ 'date': k, 'value': sz });
                    //messages_per_day_totals_array.push({ 'date': new Date(k), 'value': sz });
                }
                messages_per_day_totals_array = _.sortBy(messages_per_day_totals_array, function (msg) {
                    return msg['date'];
                });
                //console.log("messages_per_day_totals_array:");
                //console.log(messages_per_day_totals_array);

                var period = that.deduceGoodPeriod(messages_per_day_totals_array, messages_threshold);

                var statsPeriodName = i18n.gettext(period.period_type);
                // this switch is here just so that the i18n strings are correcly parsed and put into the .pot file
                switch (period.period_type) {
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
                function fillMissingDays(data, first_date, last_date) {
                    //var first_date = new Date(first_day);
                    //var last_date = new Date(last_day);
                    // use new Date(first_date.getTime()) to clone the Date object
                    for (var d = new Date(first_date.getTime()); d <= last_date; d.setDate(d.getDate() + 1)) {
                        var key = convertDateTimeToDate(d.toISOString());
                        if (!( key in data)) {
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
                for (var v in messages_per_day_totals_filled) {
                    messages_per_day_totals_filled_array.push({ 'date': new Date(v), 'value': messages_per_day_totals_filled[v] });
                }
                //console.log("messages_per_day_totals_filled_array:");
                //console.log(messages_per_day_totals_filled_array);

                messages_per_day_totals_filled_array = _.sortBy(messages_per_day_totals_filled_array, function (msg) {
                    return msg['date'];
                });


                var messages_in_period = _.filter(messages_per_day_totals_filled_array, function (msg) {
                    return (msg.date >= date_min && msg.date <= date_max);
                });

                //console.log("messages_in_period:");
                //console.log(messages_in_period);


                messages_in_period = _.sortBy(messages_in_period, function (msg) {
                    return msg.date;
                });


                // accumulate messages. maybe we should not start at 0 but at the accumulated value on start date (accumulated from the beginning of the debate)
                var messages_in_period_total = 0;
                _.each(messages_in_period, function (msg) {
                    messages_in_period_total += msg.value;
                    //msg.value = messages_in_period_total;
                });

                if (that.lineChartIsCumulative) {
                    var i = 0;
                    var messages_per_day_totals_filled_array_cumulative = $.extend(true, [], messages_per_day_totals_filled_array);
                    _.each(messages_per_day_totals_filled_array_cumulative, function (msg) {
                        i += msg.value;
                        msg.value = i;
                    });
                    that.messages_per_day_for_line_graph = messages_per_day_totals_filled_array_cumulative;
                }
                else {
                    that.messages_per_day_for_line_graph = messages_per_day_totals_filled_array;
                }


                // -----
                // compute messages authors for 2 periods: current period and since the beginning of the debate
                // -----

                var extractMessageAuthor = function (msg) {
                    return msg.idCreator;
                };

                var authors = _.map(messages_sorted_by_date, extractMessageAuthor);
                //console.log("authors:");
                //console.log(authors);
                authors = _.uniq(authors);
                //console.log("authors:");
                //console.log(authors);
                var authors_total = authors.length;

                var messages_in_period_full = _.filter(messages_sorted_by_date, function (msg) {
                    var d = new Date(msg.date);
                    return d >= date_min && d <= date_max;
                });
                messages_in_period_total = messages_in_period_full.length;

                var messages_not_in_period_full = _.filter(messages_sorted_by_date, function (msg) {
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

                var authors_except_those_in_period = _.difference(authors, authors_in_period);
                var authors_except_those_in_period_total = authors_except_those_in_period.length;

                //console.log("authors_not_in_period:",authors_not_in_period);
                //console.log("authors_in_period:",authors_in_period);
                var new_authors_in_period = _.difference(authors_in_period, authors_not_in_period);
                //console.log("new_authors_in_period:",new_authors_in_period);
                var new_authors_in_period_total = new_authors_in_period.length;

                var messages_in_period_by_new_authors = _.filter(messages_in_period_full, function (msg) {
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
                    "the title of the first element is purposely not used, only its data is used", //"posted since the beginning of the discussion",
                    authors_total,
                    messages_total,
                    "",
                    {
                        "active_authors_during_current_period": [
                            i18n.sprintf(i18n.ngettext(
                                '%d participant has contributed in the %s',
                                '%d participants have contributed in the %s',
                                authors_in_period_total), authors_in_period_total, statsPeriodName),
                            authors_in_period_total,
                            messages_in_period_total,
                            "#FFA700",
                            {
                                "new_authors": [
                                    i18n.sprintf(i18n.ngettext(
                                        "%d new participant started contributing in the %s",
                                        "%d new participants started contributing in the %s",
                                        new_authors_in_period_total), new_authors_in_period_total, statsPeriodName),
                                    new_authors_in_period_total,
                                    messages_in_period_by_new_authors_total,
                                    "#FFBD40",
                                    {}
                                ],
                                "still_active_authors": [
                                    i18n.sprintf(i18n.ngettext(
                                        "%d active participant had contributed before %s",
                                        "%d active participants had contributed before %s",
                                            authors_in_period_total - new_authors_in_period_total),
                                        authors_in_period_total - new_authors_in_period_total, statsPeriodName),
                                        authors_in_period_total - new_authors_in_period_total,
                                        messages_in_period_total - messages_in_period_by_new_authors_total,
                                    "#FFD37F",
                                    {}
                                ]
                            }
                        ],
                        "inactive_authors_during_current_period": [
                            i18n.sprintf(i18n.ngettext(
                                "%d participant's last contribution was prior to %s",
                                "%d participants' last contribution was prior to %s",
                                authors_except_those_in_period_total), authors_except_those_in_period_total, statsPeriodName),
                            authors_except_those_in_period_total,
                            0, // not needed now
                            "#9A3FD5",
                            {}
                        ]
                    }
                ];

                var pie_chart_default_legend_data = [
                    null,
                    null,
                    i18n.sprintf(i18n.ngettext(
                        "%d participant has contributed since the beginning of the discussion",
                        "%d participants have contributed since the beginning of the discussion",
                        authors_total), authors_total),
                    null,
                    authors_total,
                    messages_total
                ];

                var legend_squares_data = [
                    {
                        "color": "#FFA700",
                        "title": i18n.gettext("Contributors active recently")
                    },
                    {
                        "color": "#9A3FD5",
                        "title": i18n.gettext("Contributors inactive recently")
                    }
                ];

                that.pie_chart_data = pie_chart_data;
                that.pie_chart_default_legend_data = pie_chart_default_legend_data;
                that.legend_squares_data = legend_squares_data;

                Assembl.vent.trigger('contextPage:render');

            });
    },

    /*
     * @param messages: [{'day': '2012-01-01', 'value': 1},...] sorted by date ascending
     * @param threshold: Number
     * @returns a period object {'period_type': 'last 2 weeks', 'date_min': Date, 'date_max': Date }
     */
    deduceGoodPeriod: function (messages, threshold) {
        var count = 0;
        var sz = messages.length;
        var date_threshold_min = messages[0].date;
        // date_threshold_max could be set to:
        // - messages[sz - 1].date (but hen there may be a problem with timezones which would not include lastest messages, and the period would not be "last week" but "the 7 days which end with the last contribution" => the metric becomes more difficult to understand)
        // - today (but the statistics would not be totally accurate because the x days period would in fact vary of a maximum of one day, except if we filter messages precisely using their timezone-aware time instead of using per-day totals)
        // - yesterday (but then how would we consider today's authors? => the metric becomes more difficult to understand)
        var date_threshold_max = new Date().toISOString();
        var threshold_passed = false;
        for (var i = sz - 1; i >= 0; --i) {
            count += messages[i]['value'];
            if (count >= threshold) {
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
        if (number_of_days <= 7) {
            period_type = 'last week';
            date_min_moment = date_max_moment.subtract(7, 'days');
            date_min = date_min_moment.toDate();
        }
        if (number_of_days <= 14) {
            period_type = 'last 2 weeks';
            date_min_moment = date_max_moment.subtract(14, 'days');
            date_min = date_min_moment.toDate();
        }
        else if (number_of_days <= 31) {
            period_type = 'last month';
            date_min_moment = date_max_moment.subtract(1, 'months');
            date_min = date_min_moment.toDate();
        }
        else if (number_of_days <= (31 + 30 + 30)) {
            period_type = 'last 3 months';
            date_min_moment = date_max_moment.subtract(3, 'months');
            date_min = date_min_moment.toDate();
        }
        else if (number_of_days <= (31 + 30) * 3) {
            period_type = 'last 6 months';
            date_min_moment = date_max_moment.subtract(6, 'months');
            date_min = date_min_moment.toDate();
        }
        else {
            period_type = 'last year';
            date_min_moment = date_max_moment.subtract(1, 'years');
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
    }

});

var Instigator = Marionette.ItemView.extend({
    template: '#tmpl-instigator',
    initialize: function(){
        this.editInstigator = false;
    },

    ui: {
      editDescription: '.js_editDescription'
    },

    events: {
      'click @ui.editDescription': 'editDescription'
    },

    serializeData: function () {
        return {
           instigator: this.model,
           editInstigator: this.editInstigator,
           Ctx: Ctx,
           userCanEditDiscussion: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)
        }
    },

    onRender: function(){
        if(this.editInstigator){
          this.renderCKEditorInstigator();
        }
    },

    renderCKEditorInstigator: function () {
        var that = this,
            area = this.$('.instigator-editor');

        var uri = this.model.id.split('/')[1];
        this.model.url = Ctx.getApiV2DiscussionUrl('partner_organizations/') + uri;

        var instigator = new CKEditorField({
            'model': this.model,
            'modelProp': 'description'
        });

        this.listenTo(instigator, 'save cancel', function(){
            that.editInstigator = false;
            that.render();
        });

        instigator.renderTo(area);
        instigator.changeToEditMode();
    },

    editDescription: function(){
      if (Ctx.getCurrentUser().can(Permissions.EDIT_IDEA)) {
        this.editInstigator = true;
        this.render();
      }
    },

    templateHelpers: function(){
        return {
            editInstigatorUrl: function(){
              return '/' + Ctx.getDiscussionSlug() + '/partners';
            }
        }
    }

});

var Introduction = Marionette.ItemView.extend({
    template: '#tmpl-introductions',
    initialize: function(){
        this.editingIntroduction = false;
        this.editingObjective = false;
    },

    ui: {
        introduction: '.js_editIntroduction',
        objective: '.js_editObjective',
        seeMoreIntro: '.js_introductionSeeMore',
        seeMoreObjectives: '.js_objectivesSeeMore',
        introductionEditor: '.context-introduction-editor',
        objectiveEditor: '.context-objective-editor'
    },

    events: {
        'click @ui.seeMoreIntro': 'seeMore',
        'click @ui.seeMoreObjectives': 'seeMore',
        'click @ui.introduction': 'editIntroduction',
        'click @ui.objective':'editObjective'
    },

    serializeData: function () {
        return {
            context: this.model,
            editingIntroduction: this.editingIntroduction,
            editingObjective: this.editingObjective,
            userCanEditDiscussion: Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)
        }
    },

    onRender: function(){
        var that = this;

        if (this.editingIntroduction) {
            this.renderCKEditorIntroduction();
        }

        if (this.editingObjective) {
            this.renderCKEditorObjective();
        }

        setTimeout(function(){
            that.applyEllipsisToSection('.context-introduction', that.ui.seeMoreIntro);
            that.applyEllipsisToSection('.context-objective', that.ui.seeMoreObjectives);
        },0);

    },

    seeMore: function (e) {
        e.stopPropagation();

        var collectionManager = new CollectionManager();

        collectionManager.getDiscussionModelPromise()
            .then(function (discussion) {

            if($(e.target).hasClass('js_introductionSeeMore')) {
                var model = new Backbone.Model({
                    content: discussion.get('introduction'),
                    title: i18n.gettext('Context')
                });
            }
            else if($(e.target).hasClass('js_objectivesSeeMore')) {
                var model = new Backbone.Model({
                    content: discussion.get('objectives'),
                    title: i18n.gettext('Discussion objectives')
                });
            }
            else {
                throw new Exception("Unknown event source");
            }

            var Modal = Backbone.Modal.extend({
                template: _.template($('#tmpl-homeIntroductionDetail').html()),
                className: 'group-modal popin-wrapper',
                model: model,
                cancelEl: '.close'
            });

            Assembl.slider.show(new Modal())
        });
    },

    editIntroduction: function(){
        if (Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) {
            this.editingIntroduction = true;
            this.render();
        }
    },

    editObjective: function(){
        if (Ctx.getCurrentUser().can(Permissions.ADMIN_DISCUSSION)) {
            this.editingObjective = true;
            this.render();
        }
    },

    renderCKEditorIntroduction: function () {
        var that = this,
            area = this.$('.context-introduction-editor');

        var introduction = new CKEditorField({
            'model': this.model,
            'modelProp': 'introduction'
        });

        this.listenTo(introduction, 'save cancel', function(){
            that.editingIntroduction = false;
            that.render();
        });

        introduction.renderTo(area);
        introduction.changeToEditMode();
    },

    renderCKEditorObjective: function () {
        var that = this,
            area = this.$('.context-objective-editor');

        var objective = new CKEditorField({
            'model': this.model,
            'modelProp': 'objectives'
        });

        this.listenTo(objective, 'save cancel', function(){
            that.editingObjective = false;
            that.render();
        });

        objective.renderTo(area);
        objective.changeToEditMode();
    },

    applyEllipsisToSection: function(sectionSelector, seemoreUi){
        /* We use https://github.com/MilesOkeefe/jQuery.dotdotdot to show
         * Read More links for introduction preview
         */
        $(sectionSelector).dotdotdot({
            after: seemoreUi,
            height: 170,
            callback: function (isTruncated, orgContent) {
                if (isTruncated) {
                    seemoreUi.show();
                }
                else {
                    seemoreUi.hide();
                }
            },
            watch: "window"
        });

    }

});

var ContextPage = Marionette.LayoutView.extend({
    template: '#tmpl-contextPage',
    panelType: PanelSpecTypes.DISCUSSION_CONTEXT,
    className: 'contextPanel',
    gridSize: AssemblPanel.prototype.CONTEXT_PANEL_GRID_SIZE,
    hideHeader: true,
    getTitle: function () {
        return i18n.gettext('Home'); // unused
    },

    regions: {
        organizations: '#context-partners',
        synthesis: '#context-synthesis',
        statistics: '#context-statistics',
        instigator: '#context-instigator',
        introductions: '#context-introduction'
    },

    onBeforeShow: function(){
        var that = this,
            collectionManager = new CollectionManager();

        Promise.join(collectionManager.getDiscussionModelPromise(),
            collectionManager.getAllPartnerOrganizationCollectionPromise(),
            collectionManager.getAllMessageStructureCollectionPromise(),
            collectionManager.getAllSynthesisCollectionPromise(),

            function (DiscussionModel, AllPartner, allMessageStructureCollection, allSynthesisCollection) {

            var partnerInstigator =  AllPartner.find(function (partner) {
                return partner.get('is_initiator');
            });

            var introduction = new Introduction({
                model: DiscussionModel
            });
            that.getRegion('introductions').show(introduction);

            var instigator = new Instigator({
                model: partnerInstigator
            });
            that.getRegion('instigator').show(instigator);

            that.getRegion('statistics').show(new Statistics());

            var synthesis = new Synthesis({
                allMessageStructureCollection: allMessageStructureCollection,
                allSynthesisCollection: allSynthesisCollection
            });
            that.getRegion('synthesis').show(synthesis);

            var partners = new PartnerList({
                nbOrganisations: _.size(AllPartner),
                collection: AllPartner
            });
            that.getRegion('organizations').show(partners);

        });

    }

});


module.exports = ContextPage;
