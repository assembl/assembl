define(function(require){
    'use strict';

    var objectTreeRenderVisitor = require('views/visitors/objectTreeRenderVisitor'),
                       Backbone = require('backbone'),
                              _ = require('underscore'),
                              $ = require('jquery'),
                            Ctx = require('modules/context'),
                            app = require('app'),
                      Synthesis = require('models/synthesis'),
                           Idea = require('models/idea'),
                    Permissions = require('permissions'),
                 IdeaFamilyView = require('views/ideaFamily'),
            IdeaInSynthesisView = require('views/ideaInSynthesis'),
                           i18n = require('i18n'),
                  EditableField = require('views/editableField'),
                  CKEditorField = require('views/ckeditorField');


    var SynthesisPanel = Backbone.View.extend({

        /**
         * @init
         */
        initialize: function(obj){
            if( obj.button ){
                this.button = $(obj.button).on('click', Ctx.togglePanel.bind(this, 'synthesisPanel'));
            }

            this.ideas = new Idea.Collection();

            this.listenTo(this.ideas, 'add remove reset', this.render);

            this.listenTo(this.model, 'reset change', this.render);
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
         * The template
         * @type {_.template}
         */
        template: Ctx.loadTemplate('synthesisPanel'),

        /**
         * The render
         * @return {SynthesisPanel}
         */
        render: function(){
            if(Ctx.debugRender) {
                console.log("synthesisPanel:render() is firing");
            }
            var that = this,
            rootIdea = null,
            view_data = {},
            order_lookup_table = [],
            roots = [],
            synthesis_is_published = this.model.get("published_in_post")!=null;
            app.trigger('render');
            Ctx.cleanTooltips(this.$el);

            //Do NOT listen to reset, as it's called within this render
            this.stopListening(this.ideas, 'reset', this.render);
            
            if(assembl.ideaList.ideas.length<1) {
                //console.log("Idea list isn't available yet (we should at least have the root)");
                this.listenTo(assembl.ideaList.ideas, 'reset', this.render);
            }
            else{
                this.stopListening(assembl.ideaList.ideas, 'reset', this.render);
                rootIdea = assembl.ideaList.ideas.getRootIdea();
                var raw_ideas = this.model.get('ideas');
                //console.log("Raw Ideas from model: ", raw_ideas)
                if( raw_ideas ){
                    var ideas = [];
                    _.each(raw_ideas, function (raw_idea){
                        //console.log(raw_idea);
                        var idea = assembl.ideaList.ideas.get(raw_idea['@id']);
                        if(idea) {
                            ideas.push(idea);
                        }
                        else {
                            console.log("synthesisPanel:render():  This shoudn't happen, fix toombstone support?")
                        }
                    });
                    this.ideas.reset(ideas);
                }
            }
            
            //console.log("Synthesis idea collection: ", this.ideas)

            //var list = document.createDocumentFragment(),
            var model = this.model;

            // Getting the scroll position
            var body = this.$('.body-synthesis'),
                y = body.get(0) ? body.get(0).scrollTop : 0;
            var data = model.toJSON();
            data.canSend = Ctx.getCurrentUser().can(Permissions.SEND_SYNTHESIS);
            data.canEdit = Ctx.getCurrentUser().can(Permissions.EDIT_SYNTHESIS);
            this.$el.html( this.template(data) );
            Ctx.initTooltips(this.$el);
            function inSynthesis(idea) {
                if (idea.hidden) {
                    return false;
                }
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
                return retval
                };
            if(rootIdea){
                rootIdea.visitDepthFirst(objectTreeRenderVisitor(view_data, order_lookup_table, roots, inSynthesis));
            }
            _.each(roots, function append_recursive(idea){
                var rendered_idea_view = new IdeaFamilyView(
                        {model: idea,
                            innerViewClass: IdeaInSynthesisView,
                            innerViewClassInitializeParams: {synthesis: that.model}
                                }
                        , view_data);
                that.$('.synthesisPanel-ideas').append( rendered_idea_view.render().el );
            });
            this.$('.body-synthesis').get(0).scrollTop = y;
            if(data.canEdit && !synthesis_is_published) {
                var titleField = new EditableField({
                    model: model,
                    modelProp: 'subject'
                });
                titleField.renderTo(this.$('.synthesisPanel-title'));

                var introductionField = new CKEditorField({
                    model: model,
                    modelProp: 'introduction'
                });
                introductionField.renderTo(this.$('.synthesisPanel-introduction'));

                var conclusionField = new CKEditorField({
                    model: model,
                    modelProp: 'conclusion'
                });
                conclusionField.renderTo(this.$('.synthesisPanel-conclusion'));
            }
            else {
                this.$('.synthesisPanel-title').append(model.get('subject'));
                this.$('.synthesisPanel-introduction').append(model.get('introduction'));
                this.$('.synthesisPanel-conclusion').append(model.get('conclusion'));
            }
            
            //Restore callback inhibited above
            this.listenTo(this.ideas, 'reset', this.render);
            return this;
        },



        /**
         * @events
         */
        events: {
            'click .synthesisPanel-closeButton': 'closePanel',
            'click .synthesisPanel-publishButton': 'publish',
            'click .synthesisPanel-fullscreenButton': 'setFullscreen'
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
            Ctx.setFullscreen(this);
        },

        /**
         * Closes the panel
         */
        closePanel: function(){
            if(this.button){
                this.button.trigger('click');
            }
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
                url = Ctx.getApiUrl('posts'),
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
                        that.model = new Synthesis.Model({'@id': 'next_synthesis'});
                        that.model.fetch();
                    }
                });
            };

            // getting the most_common_recipient_address
            $.ajax({
                type: 'get',
                url: Ctx.getApiUrl('sources/'),
                contentType: 'application/json',
                success: onSuccess
            });

            that.blockPanel();
        }

    });


    return SynthesisPanel;

});
