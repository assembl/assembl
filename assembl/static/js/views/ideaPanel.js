define(['backbone', 'underscore', 'models/idea', 'models/message', 'app', 'i18n', 'types', 'views/editableField', 'views/ckeditorField'],
function(Backbone, _, Idea, Message, app, i18n, Types, EditableField, CKEditorField){
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

            var segments = this.idea.getSegments(),
                editing = this.idea.get('ideaPanel-editing') || false;

            this.$el.html( this.template( {idea:this.idea, segments:segments, editing:editing} ) );
            this.panel = this.$('.panel');

            var shortTitleField = new EditableField({
                'model': this.idea,
                'modelProp': 'shortTitle',
                'class': 'panel-editablearea text-bold',
                'data-tooltip': i18n.gettext('Short expression (only a few words) of the idea in the table of ideas.'),
                'placeholder': i18n.gettext('New idea')
            });
            shortTitleField.renderTo(this.$('#ideaPanel-shorttitle'));

            app.initClipboard();

            this.longTitleField = new CKEditorField({
                'model': this.idea,
                'modelProp': 'longTitle',
                'placeholder': this.idea.getLongTitleDisplayText()
            });
            this.longTitleField.renderTo( this.$('#ideaPanel-longtitle') );
            
            this.definitionField = new CKEditorField({
                'model': this.idea,
                'modelProp': 'definition',
                'placeholder': this.idea.getDefinitionDisplayText()
            });
            this.definitionField.renderTo( this.$('#ideaPanel-definition') );
            
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

            var id = this.idea.getId();
            segment.save('idIdea', id);
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
                var panelBody = this.$('.panel-body');
                var panelOffset = panelBody.offset().top;
                var offset = box.offset().top;
                // Scrolling to the element
                var target = offset - panelOffset + panelBody.scrollTop();
                panelBody.animate({ scrollTop: target });
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
                    if( this.idea.getId() === idea.getId() ){
                        return; // already the current one
                    } else {
                        this.idea.set('isSelected', false);
                        this.idea.off('change', this.render);
                    }
                }
                this.idea = idea;
                this.idea.set('isSelected', true);

                if( this.idea.get('@type') === Types.IDEA ){
                    app.openPanel(app.ideaPanel);
                } else {
                    app.closePanel(app.ideaPanel);
                }
            } else {
                if( this.idea ){
                    this.idea.set('isSelected', false);
                }

                this.idea = new Idea.Model();
                app.closePanel(app.ideaPanel);
            }

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
                app.trigger('idea:delete');
            }});
        },

        /**
         * Events
         */
        events: {
            'click .message-sendbtn': 'onSendMessageButtonClick',

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
        onDragStart: function(ev){
            if( app.segmentList && app.segmentList.segments ){
                ev.currentTarget.style.opacity = 0.4;

                var cid = ev.currentTarget.getAttribute('data-segmentid'),
                    segment = app.segmentList.segments.getByCid(cid);
                console.log( cid );
                app.showDragbox(ev, segment.getQuote());
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
                    segment.save('idIdea', null);
                }
            }
        },

        /**
         * @event
         * Sends the message to the server
         */
        onSendMessageButtonClick: function(ev){
            var btn = $(ev.currentTarget),
            url = app.getApiUrl('posts'),
            data = {},
            that = this,
            btn_original_text=btn.text(),
            message_body_field = this.$('.message-textarea'),
            message_body = message_body_field.val(),
            reply_idea_id = this.idea.getId(),
            success_callback = null;
            
            if(!message_body) {
                alert(i18n.gettext('You need to type a comment first...'));
                return;
            }
            btn.text( i18n.gettext('Sending comment...') );
            success_callback = function(){
                message_body_field.val('');
                btn.text( i18n.gettext('Comment posted!') );
                setTimeout(function(){
                    that.$('.message-textarea').val('');
                    btn.text(btn_original_text);
                    }, 5000);
            }
            app.sendPostToServer(message_body, null, null, reply_idea_id, success_callback);

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
        onSegmentLinkClick: function(ev){
            var cid = ev.currentTarget.getAttribute('data-segmentid'),
                segment = app.segmentList.segments.get(cid);

            app.showTargetBySegment(segment);
        }

    });

    return IdeaPanel;
});
