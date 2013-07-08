define(['backbone', 'underscore', 'models/idea', 'app', 'ckeditor'],
function(Backbone, _, Idea, app, ckeditor){
    'use strict';

    var LONG_TITLE_ID = 'ideaPanel-longtitle';

    /**
     * @class IdeaPanel
     */
    var IdeaPanel = Backbone.View.extend({

        /**
         * The tempate
         * @type {_.template}
         */
        template: app.loadTemplate('ideaPanel'),

        /**
         * @type {Idea.Model}
         */
        idea: null,

        /**
         * @init
         */
        initialize: function(obj){
            obj = obj || {};

            if( ! obj.idea ){
                this.idea = new Idea.Model();
            }

            this.idea.on('change', this.render, this);
            this.idea.get('segments').on('add', this.render, this);
            this.idea.get('segments').on('remove', this.render, this);
            this.idea.get('segments').on('reset', this.render, this);
        },

        /**
         * The render
         */
        render: function(){
            this.$el.html( this.template( {idea:this.idea} ) );

            this.panel = this.$('.panel');

            ckeditor.inline( this.$('#'+LONG_TITLE_ID).get(0) ).on( 'blur', this.onLongTitleBlur.bind(this) );

            return this;
        },

        /**
         * Add a segment
         * @param  {Segment} segment
         */
        addSegment: function(segment){
            var segments = this.idea.get('segments');
            segments.add(segment);
        },

        /**
         * Set the given idea as the current one
         * @param  {Idea} [idea=null]
         */
        setCurrentIdea: function(idea){
            this.idea = idea || new Idea.Model();

            this.idea.on('change', this.render, this);
            this.idea.get('segments').on('add', this.render, this);
            this.idea.get('segments').on('remove', this.render, this);
            this.idea.get('segments').on('reset', this.render, this);

            this.render();
        },

        /**
         * Events
         */
        events: {
            'blur #ideaPanel-shorttitle': 'onShortTitleBlur',
            'keydown #ideaPanel-shorttitle': 'onShortTitleKeyDown',

            'dragstart .box': 'onDragStart',
            'dragend .box': "onDragEnd",
            'dragover .panel': 'onDragOver',
            'dragleave .panel': 'onDragLeave',
            'drop .panel': 'onDrop',

            'click .closebutton': 'onCloseButtonClick',
            'click #ideaPanel-clearbutton': 'onClearAllClick',
            'click #ideaPanel-closebutton': 'onTopCloseButtonClick'
        },

        /**
         * @event
         */
        onShortTitleBlur: function(ev){
            var data = $.trim(ev.currentTarget.textContent);
            if( data === '' ){
                data = 'New Idea';
            }
            this.idea.set('shortTitle', data);
        },

        /**
         * @event
         */
        onShortTitleKeyDown: function(ev){
            if( ev.which === 13 || ev.which === 27 ){
                ev.preventDefault();
                $(ev.currentTarget).trigger('blur');
                return false;
            }
        },

        /**
         * @event
         */
        onLongTitleBlur: function(){
            var data = ckeditor.instances[LONG_TITLE_ID].getData();
            data = $.trim( data );
            if( data === '' ){
                data = 'Add the description';
            }
            this.idea.set('longTitle', data);
        },

        /**
         * @event
         */
        onDragStart: function(ev){
            ev.currentTarget.style.opacity = 0.4;

            var index = $(ev.currentTarget).index(),
                segment = this.idea.get('segments').at(index);

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
            if( app.draggedSegment !== null ){
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

            var segment = app.getDraggedSegment();
            if( segment ){
                this.addSegment(segment);
            }
        },

        /**
         * @event
         */
        onCloseButtonClick: function(ev){
            var $el = $(ev.currentTarget),
                segments = this.idea.get('segments'),
                segment = segments.at($el.index());

            segments.remove(segment);
        },

        /**
         * @event
         */
        onClearAllClick: function(ev){
            this.idea.get('segments').reset();
        },

        /**
         * @event
         */
        onTopCloseButtonClick: function(){
            app.setCurrentIdea(null);
            //app.togglePanel('ideaPanel');
        }

    });

    return IdeaPanel;
});
