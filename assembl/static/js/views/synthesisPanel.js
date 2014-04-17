define(['backbone', 'underscore', 'jquery', 'app', 'models/synthesis', 'permissions', 'views/ideaInSynthesis', 'i18n', 'views/editableField', 'views/ckeditorField'],
function(Backbone, _, $, app, Synthesis, Permissions, IdeaInSynthesisView, i18n, EditableField, CKEditorField){
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
            //console.log('synthesisPanel:render() firing');
            var that = this;
            
            app.trigger('render');

            // Cleaning all previous listeners
            app.off('synthesisPanel:close');

            // Cleaning previous ckeditor instance
            if( this.ckeditor ){
                this.ckeditor.destroy();
                this.ckeditor = null;
            }

            //var list = document.createDocumentFragment(),
            var model = this.model,
                ideas = this.ideas.getInNextSynthesisRootIdeas();

            model.set('collapsed', this.collapsed);
            model.set('ideas', ideas);

            // Getting the scroll position
            var body = this.$('.panel-body'),
                y = body.get(0) ? body.get(0).scrollTop : 0;
            var data = model.toJSON();
            data.canSend = app.getCurrentUser().can(Permissions.SEND_SYNTHESIS);
            data.canEdit = app.getCurrentUser().can(Permissions.EDIT_SYNTHESIS);
            this.$el.html( this.template(data) );

            _.each(ideas, function append_recursive(idea){
                var rendered_idea_view = new IdeaInSynthesisView({model: idea});
                that.$('#synthesisPanel-ideas').append( rendered_idea_view.render().el );
                _.each(idea.getSynthesisChildren(), function(child){
                    append_recursive(child)
                    });
                });
            this.$('.panel-body').get(0).scrollTop = y;
            if(data.canEdit) {
                var titleField = new EditableField({
                    model: model,
                    modelProp: 'subject'
                });
                titleField.renderTo('#synthesisPanel-title');

                var introductionField = new EditableField({
                    model: model,
                    modelProp: 'introduction'
                });
                introductionField.renderTo('#synthesisPanel-introduction');

                var conclusionField = new EditableField({
                    model: model,
                    modelProp: 'conclusion'
                });
                conclusionField.renderTo('#synthesisPanel-conclusion');
            }
            else {
                this.$('#synthesisPanel-title').append(model.get('subject'));
                this.$('#synthesisPanel-introduction').append(model.get('introduction'));
                this.$('#synthesisPanel-conclusion').append(model.get('conclusion'));
            }
            

            return this;
        },



        /**
         * @events
         */
        events: {
            'click #synthesisPanel-closeButton': 'closePanel',
            'click #synthesisPanel-publishButton': 'publish',
            'click #synthesisPanel-fullscreenButton': 'setFullscreen'
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
            var model = this.model,
                publishes_synthesis_id = model.get('id'),
                url = app.getApiUrl('posts'),
                ideas = this.ideas.getInNextSynthesisRootIdeas(),
                that = this;

            var onSuccess = function(resp){
                var data = {
                    publishes_synthesis_id: publishes_synthesis_id,
                    subject: "Not used",
                    message: "Not used"
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
