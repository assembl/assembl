define(['backbone', 'underscore', 'jquery', 'app', 'models/segment'],
function(Backbone, _, $, app, Segment){
    'use strict';

    var SegmentList = Backbone.View.extend({
        /**
         * @init
         */
        initialize: function(){
            this.segments.on('add', this.render, this);
        },

        /**
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('segmentList'),

        /**
         * The collection
         * @type {SegmentCollection}
         */
        segments: new Segment.Collection(),

        /**
         * The render
         * @return {LateralMenu}
         */
        render: function(){
            var data = {segments:this.segments};
            this.$el.html(this.template(data));

            return this;
        },

        /**
         * Add a segment to the bucket
         * @param {string} The extract
         * @param {Email} The source
         */
        addSegment: function(text, email){
            var segment = new Segment.Model();
            segment.set('text', text);

            this.segments.add(segment);
        },


        /**
         * The events
         * @type {Object}
         */
        events: {
            'dragstart .box': "onDragStart",
            'dragend .box': "onDragEnd"
        },

        /**
         * @event
         */
        onDragStart: function(ev){
            ev.currentTarget.style.opacity = 0.4;

            ev.dataTransfer.effectAllowed = 'move';
            ev.dataTransfer.setData('text/html', this.innerHTML);

            //app.bucketDraggedSegment = this;
        },

        /**
         * @event
         */
        onDragEnd: function(ev){
            ev.currentTarget.style.opacity = '';

            //app.bucketDraggedSegment = null;
        }

    });

    return SegmentList;
});
