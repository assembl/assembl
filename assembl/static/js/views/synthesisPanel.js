define(['backbone', 'underscore', 'zepto', 'app', 'models/synthesis', 'views/synthesisIdeaView'],
function(Backbone, _, $, app, Synthesis, SynthesisIdeaView){
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
            this.ideas.on('change:parentId change:inSynthesis', this.render, this);

            this.model.on('reset', this.render, this);
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
         * The template
         * @type {_.template}
         */
        template: app.loadTemplate('synthesisPanel'),

        /**
         * The render
         * @return {SynthesisPanel}
         */
        render: function(){
            // Cleaning all previous listeners
            app.off('synthesisPanel:close');

            var list = document.createDocumentFragment(),
                data = { collapsed: this.collapsed, subject: this.model.get('subject') },
                ideas = this.ideas.where({inSynthesis: true});

            _.each(ideas, function(idea){
                var ideaView = new SynthesisIdeaView({model:idea});
                list.appendChild(ideaView.render().el);
            });

            this.$el.html( this.template(data) );
            this.$('.idealist').append( list );

            return this;
        },

        events: {
            'blur #synthesisPanel-title': 'onTitleBlur',
            'click #synthesisPanel-closeButton': 'closePanel',
            'click #synthesisPanel-publishButton': 'publish'
        },

        /**
         * Blocks the panel
         */
        blockPanel: function(){
            this.$('.panel').addClass('is-loading');
        },

        /**
         * 
         */
        onTitleBlur: function(ev){
            var title = app.stripHtml(ev.currentTarget.innerHTML);
            this.model.set('subject', title);
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
            var ok = confirm("Do you want to publish the synthesis?");
            if( ok ) ok = confirm("Are you sure? Do you really want to publish this?");
            if( ok ) ok = confirm("Published!");
        }
    });


    return SynthesisPanel;

});
