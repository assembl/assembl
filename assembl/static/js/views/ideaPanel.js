define(['backbone', 'underscore', 'models/idea', 'app', 'ckeditor-sharedspace'],
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

            if( obj.button ){
                this.button = $(obj.button).on('click', app.togglePanel.bind(window, 'ideaPanel'));
            }

            if( ! obj.idea ){
                this.idea = new Idea.Model();
            }

            this.idea.on('change', this.render, this);

            var that = this;
            app.on('idea:select', function(idea){
                that.setCurrentIdea(idea);
            });
        },

        /**
         * The render
         */
        render: function(){
            var segments = this.idea.getSegments();
            this.$el.html( this.template( {idea:this.idea, segments:segments} ) );


            this.panel = this.$('.panel');

            var ckeditorConfig = {
                toolbar: [  ['Bold', 'Italic', 'Outdent', 'Indent', 'NumberedList', 'BulletedList'] ],
                extraPlugins: 'sharedspace',
                removePlugins: 'floatingspace,resize',
                sharedSpaces: {
                    top: 'ideaPanel-toptoolbar',
                    bottom: 'ideaPanel-bottomtoolbar'
                }
            };

            ckeditor
                .inline( this.$('#'+LONG_TITLE_ID).get(0), ckeditorConfig )
                .on( 'blur', this.onLongTitleBlur.bind(this) );

            ckeditor
                .on( 'currentInstance', this.onLontTitleFocus.bind(this) );

            return this;
        },

        /**
         * Add a segment
         * @param  {Segment} segment
         */
        addSegment: function(segment){
            var id = this.idea.get('id');
            segment.set('idIdea', id);
        },

        /**
         * Set the given idea as the current one
         * @param  {Idea} [idea=null]
         */
        setCurrentIdea: function(idea){
            this.idea = idea || new Idea.Model();

            this.idea.on('change', this.render, this);

            this.render();
        },

        /**
         * Events
         */
        events: {
            'blur #ideaPanel-shorttitle': 'onShortTitleBlur',
            'keydown #ideaPanel-shorttitle': 'onShortTitleKeyDown',

            'focus #ideaPanel-longtitle': 'onLongTitleFocus',
            'keydown #ideaPanel-longtitle': 'onLongTitleKeyDown',
            //'blur #ideaPanel-longtitle': 'onLongTitleBlur',

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
        onLongTitleFocus: function(ev){
            this.$('.panel-editablebox').addClass('is-editing');

            $('#ideaPanel-toptoolbar').removeClass('invisible');
            this.$('.ideaPanel-longtitle-closebtn').show();
        },

        /**
         * @event
         */
        onLongTitleKeyDown: function(ev){
            if( ev.which === 27 ){
                ev.prenvetDefault();
                $(ev.currentTarget).trigger('blur');
            }
        },

        /**
         * @event
         */
        onLontTitleFocus: function(){
            $('#ideaPanel-toptoolbar').removeClass('invisible');
        },

        /**
         * @event
         */
        onLongTitleBlur: function(ev){
            this.$('.panel-editablebox').removeClass('is-editing');

            $('#ideaPanel-toptoolbar').addClass('invisible');
            this.$('.ideaPanel-longtitle-closebtn').hide();

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
            if( app.segmentList && app.segmentList.segments ){
                ev.currentTarget.style.opacity = 0.4;

                var cid = ev.currentTarget.getAttribute('data-segmentid'),
                    segment = app.segmentList.segments.get(cid);

                app.showDragbox(ev, segment.get('text'));
                app.draggedSegment = segment;
            }
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
            var cid = ev.currentTarget.getAttribute('data-segmentid');

            if( app.segmentList && app.segmentList.segments ){
                var segment = app.segmentList.segments.get(cid);

                if( segment ){
                    segment.set('idIdea', null);
                }
            }
        },

        /**
         * @event
         */
        onClearAllClick: function(ev){
            var ok = confirm( this.$('#ideaPanel-clearConfirmationMessage').text() );
            if( ok ){
                this.idea.get('segments').reset();
            }
        },

        /**
         * @event
         */
        onTopCloseButtonClick: function(){
            app.setCurrentIdea(null);
        }

    });

    return IdeaPanel;
});
