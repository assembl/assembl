define(['backbone', 'underscore', 'jquery', 'app', 'models/segment', 'i18n'],
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
            var segments = this.segments.getClipboard(),
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
            delete segment.attributes.highlights;

            segment.set('idIdea', null);
            this.segments.add(segment);
        },

        /**
         * Add annotation as segment
         * @param {annotation}
         * @param {post} [post=null] The origin post
         * @return {Segment}
         */
        addAnnotationAsSegment: function(annotation, post){
            var idPost = null,
                sourceCreator = null;

            if(post){
                idPost = post.id;
                sourceCreator = post.get('creator');
            }

            var segment = new Segment.Model({
                idPost: idPost,
                text: annotation.quote,
                creator: app.getCurrentUser(),
                source_creator: sourceCreator,
                ranges: annotation.ranges
            });

            if( segment.isValid() ){
                this.addSegment(segment);
                segment.save();
            } else {
                alert( segment.validationError );
            }

            return segment;
        },

        /**
         * Creates a segment with the given text and adds it to the segmentList
         * @param  {string} text
         * @param  {string} [post=null] The origin post
         * @return {Segment}
         */
        addTextAsSegment: function(text, post){
            var idPost = null,
                source_creator = null;

            if( post ){
                idPost = post.id;
                source_creator = post.attributes.creator;
            }

            var segment = new Segment.Model({
                text: text,
                creator: app.getCurrentUser(),
                source_creator: source_creator,
                idPost: idPost
            });

            if( segment.isValid() ){
                this.addSegment(segment);
                segment.save();
            }
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
         * Shows the given segment with an small fx
         * @param {Segment} segment
         */
        showSegment: function(segment){
            app.openPanel(app.segmentList);

            var selector = app.format('.box[data-segmentid={0}]', segment.cid),
                box = this.$(selector);

            if( box.length ){
                app.segmentList.$('.panel-body').animate({'scrollTop': box.position().top});
                box.highlight();
            }
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
            if( ev.dataTransfer && ev.dataTransfer.types && ev.dataTransfer.types.indexOf('text/plain') > -1 ){
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
                var segments = this.segments.getClipboard();
                _.each(segments, function(segment){
                    segment.destroy();
                });
            }
        }

    });

    return SegmentList;
});
