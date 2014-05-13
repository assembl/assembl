define(['backbone', 'underscore', 'jquery', 'app', 'models/synthesis', 'models/idea', 'permissions', 'views/ideaFamily', 'views/ideaInSynthesis', 'i18n', 'views/editableField', 'utils/renderVisitor'],
function(Backbone, _, $, app, Synthesis, Idea, Permissions, IdeaFamilyView, IdeaInSynthesisView, i18n, EditableField, renderVisitor){
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


            }
            this.ideas = new Idea.Collection();

            this.ideas.on('add', this.render, this);
            this.ideas.on('remove', this.render, this);
            //Note:  this is inhibited within render, as render calls it
            this.ideas.on('reset', this.render, this);
            
            this.model.on('reset', this.render, this);
            this.model.on('change', function(){
                //console.log("model changed");
                this.render();}, this);
            //this.model.on('all', function(event){console.log("model event: ", event)}, this);

        },

        /**
         * The model
         * @type {Synthesis}
         */
        model: null,

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
            if(app.debugRender) {
                console.log("synthesisPanel:render() is firing");
            }
            var that = this,
                rootIdea = app.ideaList.ideas.getRootIdea();
            
            app.trigger('render');
            // Cleaning all previous listeners
            app.off('synthesisPanel:close');

            //Do NOT listen to reset, as it's called within this render
            this.ideas.off('reset', this.render, this);
            
            // Cleaning previous ckeditor instance
            if( this.ckeditor ){
                this.ckeditor.destroy();
                this.ckeditor = null;
            }
            var raw_ideas = this.model.get('ideas');
            //console.log("Raw Ideas from model: ", raw_ideas)
            if( raw_ideas ){
                var ideas = [];
                _.each(raw_ideas, function (raw_idea){
                    //console.log(raw_idea);
                    var idea = app.ideaList.ideas.get(raw_idea['@id']);
                    if(idea) {
                        ideas.push(idea);
                    }
                    else {
                        console.log("synthesisPanel:render():  This shoudn't happen, fix toombstone support?")
                    }
                });
                this.ideas.reset(ideas);
            }
            //console.log("Synthesis idea collection: ", this.ideas)

            //var list = document.createDocumentFragment(),
            var model = this.model;

            // Getting the scroll position
            var body = this.$('.panel-body'),
                y = body.get(0) ? body.get(0).scrollTop : 0;
            var data = model.toJSON();
            data.canSend = app.getCurrentUser().can(Permissions.SEND_SYNTHESIS);
            data.canEdit = app.getCurrentUser().can(Permissions.EDIT_SYNTHESIS);
            this.$el.html( this.template(data) );

            var view_data = {};
            var roots = [];
            function inSynthesis(idea) {
                var retval;
                if(that.model.get('is_next_synthesis')){
                    //This special case is so we get instant feedback before
                    //the socket sends changes
                    retval = idea != rootIdea && idea.get('inNextSynthesis')
                }
                else {
                    retval = idea != rootIdea && that.ideas.contains(idea)
                }
                //console.log("Checking",idea,"returning:", retval, "synthesis is next synthesis:", that.model.get('is_next_synthesis'));
                return retval};
            rootIdea.visitBreadthFirst(renderVisitor(view_data, roots, inSynthesis));

            _.each(roots, function append_recursive(idea){
                var rendered_idea_view = new IdeaFamilyView(
                        {model: idea,
                            innerViewClass: IdeaInSynthesisView}
                        , view_data);
                that.$('#synthesisPanel-ideas').append( rendered_idea_view.render().el );
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
            
            //Restore callback inhibited above
            this.ideas.on('reset', this.render, this);
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
            var publishes_synthesis_id = this.model.id,
                url = app.getApiUrl('posts'),
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
