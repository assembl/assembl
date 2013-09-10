define(['backbone', 'underscore', 'models/idea', 'app', 'ckeditor-sharedspace', 'i18n'],
function(Backbone, _, Idea, app, ckeditor, i18n){
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
            app.trigger('render');

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
         * Blocks the panel
         */
        blockPanel: function(){
            this.$('.panel').addClass('is-loading');
        },

        /**
         * Unblocks the panel
         */
        unblockPanel: function(){
            this.$('.panel').removeClass('is-loading');
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
         * Delete the current idea
         */
        deleteCurrentIdea: function(){
            // to be deleted, an idea cannot have any children nor segments
            var children = this.idea.getChildren(),
                segments = this.idea.getSegments(),
                that = this;

            if( children.length > 0 ){
                return alert( i18n.gettext('ideaPanel-cantDeleteByChildren') );
            }

            // Nor has any segments
            if( segments.length > 0 ){
                return alert( i18n.gettext('ideaPanel-cantDeleteBySegments') );
            }

            // That's a bingo
            this.blockPanel();
            this.idea.destroy({ success: function(){
                that.unblockPanel();
                app.closePanel( app.ideaPanel );
            }});
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
            'click #ideaPanel-closebutton': 'onTopCloseButtonClick',
            'click #ideaPanel-deleteButton': 'onDeleteButtonClick'
        },

        /**
         * @event
         */
        onShortTitleBlur: function(ev){
            var data = $.trim(ev.currentTarget.textContent);
            if( data === '' ){
                data = i18n.gettext('New Idea');
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

            $('#ideaPanel-toptoolbar').show();
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
            $('#ideaPanel-toptoolbar').show();
        },

        /**
         * @event
         */
        onLongTitleBlur: function(ev){
            this.$('.panel-editablebox').removeClass('is-editing');

            $('#ideaPanel-toptoolbar').hide();
            this.$('.ideaPanel-longtitle-closebtn').hide();

            var data = ckeditor.instances[LONG_TITLE_ID].getData();
            data = $.trim( data );
            if( data === '' ){
                data = i18n.gettext('Add the description');
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
            var ok = confirm( i18n.gettext('ideaPanel-clearConfirmationMessage') );
            if( ok ){
                this.idea.get('segments').reset();
            }
        },

        /**
         * @event
         */
        onTopCloseButtonClick: function(){
            app.setCurrentIdea(null);
        },

        /**
         * @event
         */
        onDeleteButtonClick: function(){
            var ok = confirm( i18n.gettext('ideaPanel-deleteIdeaConfirmMessage') );

            if(ok){
                this.deleteCurrentIdea();
            }
        }

    });

    return IdeaPanel;
});
