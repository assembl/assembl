define(['backbone', 'underscore', 'jquery', 'app', 'models/synthesis', 'views/synthesisIdea', 'i18n', 'views/editableField', 'views/ckeditorField'],
function(Backbone, _, $, app, Synthesis, SynthesisIdeaView, i18n, EditableField, CKEditorField){
    'use strict';

    var SynthesisPanel = Backbone.View.extend({

        /**
         * @init
         */
        initialize: function(obj){
            if( obj ){

                if( obj.button ){
                    this.button = $(obj.button).on('click', app.togglePanel.bind(window, 'synthesisPanel'));
                }

                if( obj.ideas ){
                    this.ideas = obj.ideas;
                } else {
                    this.ideas = new Idea.Collection();
                }
            }

            this.ideas.on('reset', this.render, this);
            this.ideas.on('change', this.render, this);

            this.model.on('reset', this.render, this);
            this.model.on('change', this.render, this);
        },

        /**
         * The model
         * @type {Synthesis}
         */
        model: new Synthesis.Model(),

        /**
         * Flag
         * @type {Boolean}
         */
        collapsed: false,

        /**
         * CKeditor instance for this view
         * @type {CKeditor}
         */
        ckeditor: null,

        /**
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('synthesisPanel'),

        /**
         * The render
         * @return {SynthesisPanel}
         */
        render: function(){
            app.trigger('render');

            // Cleaning all previous listeners
            app.off('synthesisPanel:close');

            // Cleaning previous ckeditor instance
            if( this.ckeditor ){
                this.ckeditor.destroy();
                this.ckeditor = null;
            }

            var list = document.createDocumentFragment(),
                data = this.model.toJSON(),
                ideas = this.ideas.getInNextSynthesisIdeas();

            data.collapsed = this.collapsed;
            data.ideas = ideas;

            // Getting the scroll position
            var body = this.$('.panel-body'),
                y = body.get(0) ? body.get(0).scrollTop : 0;

            this.$el.html( this.template(data) );

            this.$('.panel-body').get(0).scrollTop = y;

            var titleField = new EditableField({
                model: this.model,
                modelProp: 'subject'
            });
            titleField.renderTo('#synthesisPanel-title');

            var introductionField = new EditableField({
                model: this.model,
                modelProp: 'introduction'
            });
            introductionField.renderTo('#synthesisPanel-introduction');

            var conclusionField = new EditableField({
                model: this.model,
                modelProp: 'conclusion'
            });
            conclusionField.renderTo('#synthesisPanel-conclusion');

            this.renderCKEditor();

            return this;
        },


        /**
         * renders the ckEditor if there is one editable field
         */
        renderCKEditor: function(){
            var editingIdea = this.ideas.getEditingIdeaInSynthesisPanel();
            if( !editingIdea ){
                return;
            }

            this.ckeditor = new CKEditorField({
                'model': editingIdea,
                'modelProp': 'longTitle',
                'placeholder': i18n.gettext('Add the description')
            });

            this.ckeditor.on('save cancel', function(idea){
                idea.set('synthesisPanel-editing', false);
            });

            var area = this.$('#synthesisPanel-longtitle');
            this.ckeditor.renderTo( area );
            this.ckeditor.changeToEditMode();
        },

        /**
         * @events
         */
        events: {
            'click #synthesisPanel-closeButton': 'closePanel',
            'click #synthesisPanel-publishButton': 'publish',
            'click #synthesisPanel-fullscreenButton': 'setFullscreen',

            'click [data-idea-id]': 'onEditableAreaClick'
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
         * Sets the panel as full screen
         */
        setFullscreen: function(){
            app.setFullscreen(this);
        },

        /**
         * @event
         */
        onEditableAreaClick: function(ev){
            var id = ev.currentTarget.getAttribute('data-idea-id'),
                idea = app.ideaList.ideas.get(id);

            app.trigger('synthesisPanel:edit');

            if( idea ){
                idea.set('synthesisPanel-editing', true);
                this.currentId = id;
            }
        },

        /**
         * Closes the panel
         */
        closePanel: function(){
            if(this.button){
                this.button.trigger('click');
            }

            app.trigger('synthesisPanel:close');
        },

        /**
         * Publish the synthesis
         */
        publish: function(){
            var ok = confirm( i18n.gettext("Do you want to publish the synthesis?") );
            if( ok ){
                this._publish();
            }
        },

        /**
         * Publishes the synthesis
         */
        _publish: function(){
            var json = this.model.toJSON(),
                publishes_synthesis_id = this.model.id,
                url = app.getApiUrl('posts'),
                template = app.loadTemplate('synthesisEmail'),
                ideas = this.ideas.getInNextSynthesisIdeas(),
                that = this;

            var onSuccess = function(resp){
                var data = {
                    publishes_synthesis_id: publishes_synthesis_id,
                    subject: app.format(i18n.gettext('[synthesis] {0}'), json.subject),
                    message: template({
                        email: resp[0].most_common_recipient_address,
                        subject: json.subject,
                        introduction: json.introduction,
                        conclusion: json.conclusion,
                        ideas: ideas
                    })
                };

                // Sending the synthesis
                $.ajax({
                    type: "post",
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: url,
                    success: function(){
                        alert( i18n.gettext("Synthesis published!") );
                        that.unblockPanel();
                    }
                });
            };

            // getting the most_common_recipient_address
            $.ajax({
                type: 'get',
                url: app.getApiUrl('sources/'),
                contentType: 'application/json',
                success: onSuccess
            });

            that.blockPanel();
        }
    });


    return SynthesisPanel;

});
