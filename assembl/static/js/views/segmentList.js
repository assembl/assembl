define(['backbone', 'underscore', 'zepto', 'app', 'models/segment', 'i18n'],
function(Backbone, _, $, app, Segment, i18n){
    'use strict';

    var SegmentList = Backbone.View.extend({
        /**
         * @init
         */
        initialize: function(obj){
            if( obj && obj.button ){
                this.button = $(obj.button).on('click', app.togglePanel.bind(window, 'segmentList'));
            }

            this.segments.on('add remove change reset', this.render, this);
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
            app.trigger('render');
            var segments = this.segments.where({idIdea: null}),
                data = {segments:segments};

            this.$el.html(this.template(data));

            this.panel = this.$('.panel');

            return this;
        },

        /**
         * Add a segment to the bucket
         * @param {Segment} segment
         */
        addSegment: function(segment){
            segment.set('idIdea', null);
            this.segments.add(segment);
        },

        /**
         * Creates a segment with the given text and adds it to the segmentList
         * @param  {string} text
         * @param  {string} [idPost=null] The id of the origin post
         * @return {Segment}
         */
        addTextAsSegment: function(text, idPost){
            var data = {
                text: text,
                creator: app.getCurrentUser(),
                idPost: idPost || null
            };

            return app.segmentList.segments.create(data);
        },

        /**
         * Removes a segment by its cid
         * @param  {String} cid
         */
        removeSegmentByCid: function(cid){
            var model = this.segments.get(cid);

            if(model){
                model.destroy();
            }
        },

        /**
         * Remove the given segment
         * @param {Segment} segment
         */
        removeSegment: function(segment){
            this.segments.remove(segment);
        },

        /**
         * Closes the panel
         */
        closePanel: function(){
            if( this.button ){
                this.button.trigger('click');
            }
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'dragstart .box': "onDragStart",
            'dragend .box': "onDragEnd",
            'dragover .panel': 'onDragOver',
            'dragleave .panel': 'onDragLeave',
            'drop .panel': 'onDrop',

            'click .closebutton': "onCloseButtonClick",
            'click #segmentList-clear': "onClearButtonClick",
            'click #segmentList-closeButton': "closePanel"
        },

        /**
         * @event
         */
        onDragStart: function(ev){
            ev.currentTarget.style.opacity = 0.4;

            var cid = ev.currentTarget.getAttribute('data-segmentid'),
                segment = this.segments.get(cid);

            app.showDragbox(ev, segment.get('text'));
            app.draggedSegment = segment;
        },

        /**
         * @event
         */
        onDragEnd: function(ev){
            ev.currentTarget.style.opacity = '';
            app.draggedSegment = null;
        },

        /**
         * @event
         */
        onDragOver: function(ev){
            ev.preventDefault();

            var isText = false;
            if( ev.dataTransfer.types && ev.dataTransfer.types.indexOf('text/plain') > -1 ){
                isText = app.draggedIdea ? false : true;
            }

            if( app.draggedSegment !== null || isText ){
                this.panel.addClass("is-dragover");
            }
        },

        /**
         * @event
         */
        onDragLeave: function(){
            this.panel.removeClass('is-dragover');
        },

        /**
         * @event
         */
        onDrop: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.panel.trigger('dragleave');

            var idea = app.getDraggedIdea();
            if( idea ){
                return; // Do nothing
            }

            var segment = app.getDraggedSegment();
            if( segment ){
                this.addSegment(segment);
                return;
            }

            var text = ev.dataTransfer.getData("Text");
            if( text ){
                this.addTextAsSegment(text);
                return;
            }
        },

        /**
         * @event
         */
        onCloseButtonClick: function(ev){
            var cid = ev.currentTarget.getAttribute('data-segmentid');
            this.removeSegmentByCid(cid);
        },

        /**
         * @event
         */
        onClearButtonClick: function(ev){
            var ok = confirm( i18n.gettext('segmentList-clearConfirmationMessage') );
            if( ok ){
                this.segments.reset();
            }
        }

    });

    return SegmentList;
});
