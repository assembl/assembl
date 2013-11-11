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
         * The panel element
         * @type {jQuery}
         */
        panel: null,

        /**
         * The render
         * @return {LateralMenu}
         */
        render: function(){
            app.trigger('render');

            var segments = this.segments.getClipboard(),
                data = {segments:segments},
                top = 0;

            if( this.panel ){
                top = this.panel.find('.panel-body')[0].scrollTop;
            }

            this.$el.html(this.template(data));

            this.panel = this.$('.panel');

            if( top > 0 ){
                this.panel.find('.panel-body')[0].scrollTop = top;
            }

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
         * Add annotation as segment. 
         * @param {annotation} annotation
         * @param {Number} [idIdea=null] 
         * @return {Segment}
         */
        addAnnotationAsSegment: function(annotation, idIdea){
            var post = app.getPostFromAnnotation(annotation),
                idPost = post.id,
                sourceCreator = post.get('creator');

            var segment = new Segment.Model({
                target: { "@id": idPost, "@type": "email" },
                text: annotation.text,
                quote: annotation.quote,
                creator: app.getCurrentUser(),
                source_creator: sourceCreator,
                ranges: annotation.ranges,
                idIdea: idIdea
            });

            if( segment.isValid() ){
                delete segment.attributes.highlights;

                this.segments.add(segment);
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
            var idPost = null;

            if( post ){
                idPost = post.id;
            }

            var segment = new Segment.Model({
                text: text,
                quote: text,
                creator: app.getCurrentUser(),
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
            'click #segmentList-closeButton': "closePanel",

            'click .segment-link': "onSegmentLinkClick"
        },

        /**
         * @event
         */
        onDragStart: function(ev){
            ev.currentTarget.style.opacity = 0.4;

            var cid = ev.currentTarget.getAttribute('data-segmentid'),
                segment = this.segments.get(cid);

            app.showDragbox(ev, segment.get('quote'));
            app.draggedSegment = segment;
        },

        /**
         * @event
         */
        onDragEnd: function(ev){
            if( ev ){
                ev.preventDefault();
                ev.stopPropagation();
            }

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

            if( app.draggedAnnotation !== null ){
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

            var annotation = app.getDraggedAnnotation();
            if( annotation ){
                app.saveCurrentAnnotator();
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
        },

        /**
         * @event
         */
        onSegmentLinkClick: function(ev){
            var cid = ev.currentTarget.getAttribute('data-segmentid'),
                segment = this.segments.get(cid);

            app.showTargetBySegment(segment);
        }

    });

    return SegmentList;
});
