define(['backbone', 'underscore', 'models/idea', 'app', 'ckeditor-sharedspace', 'i18n'],
function(Backbone, _, Idea, app, ckeditor, i18n){
    'use strict';

    var LONG_TITLE_ID = 'ideaPanel-longtitle',

        CKEDITOR_CONFIG = _.extend({}, app.CKEDITOR_CONFIG, {
            sharedSpaces: { top: 'ideaPanel-toptoolbar', bottom: 'ideaPanel-bottomtoolbar' }
        });

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
         * CKeditor instance for this view
         * @type {CKeditor}
         */
        ckInstance: null,

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
                that.cancelEdition();
            });
        },

        /**
         * The render
         */
        render: function(){
            app.trigger('render');

            var segments = this.idea.getSegments(),
                editing = this.idea.get('ideaPanel-editing') || false;

            this.$el.html( this.template( {idea:this.idea, segments:segments, editing:editing} ) );

            this.panel = this.$('.panel');

            if( this.ckInstance ){
                this.ckInstance.destroy();
            }
            
            if( editing ){
                var editingArea = this.$('#'+LONG_TITLE_ID).get(0),
                    that = this;

                this.ckInstance = ckeditor.inline( editingArea, CKEDITOR_CONFIG );
                editingArea.focus();
                this.ckInstance.element.on('blur', function(){

                    // Firefox triggers the blur event if we paste (ctrl+v)
                    // in the ckeditor, so instead of calling the function direct
                    // we wait to see if the focus is still in the ckeditor
                    setTimeout(function(){
                        if( !that.ckInstance.element ){
                            return;
                        }

                        var hasFocus = document.hasFocus(that.ckInstance.element.$);
                        if( !hasFocus ){
                            that.saveEdition();
                        }
                    }, 100);

                });
            }

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
            delete segment.attributes.highlights;

            var id = this.idea.get('id');
            segment.set('idIdea', id);
        },

        /**
         * Shows the given segment with an small fx
         * @param {Segment} segment
         */
        showSegment: function(segment){
            var selector = app.format('.box[data-segmentid={0}]', segment.cid),
                idIdea = segment.get('idIdea'),
                idea = app.ideaList.ideas.get(idIdea),
                box;

            if( !idea ){
                return;
            }

            this.setCurrentIdea(idea);
            box = this.$(selector);

            if( box.length ){
                app.ideaPanel.$('.panel-body').animate({'scrollTop': box.position().top});
                box.highlight();
            }
        },

        /**
         * Set the given idea as the current one
         * @param  {Idea} [idea=null]
         */
        setCurrentIdea: function(idea){
            if( idea !== null ){
                if( this.idea ) {
                    if( this.idea.id == idea.id ){
                        // already the current one
                        return;
                    }
                    else {
                    app.ideaPanel.idea.set('isSelected', false);
                    }
                }
                this.idea = idea;
                this.idea.set('isSelected', true);
                app.openPanel(app.ideaPanel);
            } else {
                this.idea = new Idea.Model();
                app.closePanel(app.ideaPanel);
            }

            this.idea.on('change', this.render, this);
            app.trigger('idea:select', [idea]);

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
                app.trigger('idea:delete');
            }});
        },

        /**
         * Events
         */
        events: {
            'blur #ideaPanel-shorttitle': 'onShortTitleBlur',
            'keydown #ideaPanel-shorttitle': 'onShortTitleKeyDown',

            'click #ideaPanel-longtitle': 'changeToEditMode',
            'click .ideaPanel-savebtn': 'saveEdition',
            'click .ideaPanel-cancelbtn': 'cancelEdition',

            'dragstart .box': 'onDragStart',
            'dragend .box': "onDragEnd",
            'dragover .panel': 'onDragOver',
            'dragleave .panel': 'onDragLeave',
            'drop .panel': 'onDrop',

            'click .closebutton': 'onCloseButtonClick',
            'click #ideaPanel-clearbutton': 'onClearAllClick',
            'click #ideaPanel-closebutton': 'onTopCloseButtonClick',
            'click #ideaPanel-deleteButton': 'onDeleteButtonClick',

            'click .segment-link': "onSegmentLinkClick"
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
        onLongTitleKeyDown: function(ev){
            if( ev.which === 27 ){
                ev.prenvetDefault();
                this.cancelEdition();
            }
        },

        /**
         * @event
         */
        onDragStart: function(ev){
            if( app.segmentList && app.segmentList.segments ){
                ev.currentTarget.style.opacity = 0.4;

                var cid = ev.currentTarget.getAttribute('data-segmentid'),
                    segment = app.segmentList.segments.get(cid);

                app.showDragbox(ev, segment.get('quote'));
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
        },

        /**
         * @event
         */
        changeToEditMode: function(ev){
            if( ev ) {
                ev.stopPropagation();
            }

            this.idea.set('ideaPanel-editing', true);
        },

        /**
         * @event
         */
        cancelEdition: function(ev){
            if( ev ){
                ev.stopPropagation();
            }

            if( this.ckInstance ){
                var longTitle = this.idea.get('longTitle');
                this.ckInstance.setData(longTitle);
                this.ckInstance.destroy();
            }

            this.idea.set('ideaPanel-editing', false);
        },

        /**
         * @event
         */
        saveEdition: function(ev){
            if( ev ){
                ev.stopPropagation();
            }

            var text = this.ckInstance.getData();
            text = $.trim(text);
            
            this.idea.set({ 'longTitle': text, 'ideaPanel-editing': false });
            this.ckInstance.destroy();
        },

        /**
         * @event
         */
        onSegmentLinkClick: function(ev){
            var cid = ev.currentTarget.getAttribute('data-segmentid'),
                segment = app.segmentList.segments.get(cid);

            app.showTargetBySegment(segment);
        }

    });

    return IdeaPanel;
});
