define(['backbone', 'underscore', 'zepto-touch', 'app', 'models/synthesis', 'views/synthesisIdeaView', 'i18n'],
function(Backbone, _, $, app, Synthesis, SynthesisIdeaView, i18n){
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
            app.trigger('render');

            // Cleaning all previous listeners
            app.off('synthesisPanel:close');

            var list = document.createDocumentFragment(),
                data = this.model.toJSON(),
                ideas = this.ideas.getInSynthesisIdeas();

            data.collapsed = this.collapsed;

            _.each(ideas, function(idea){
                var ideaView = new SynthesisIdeaView({model:idea});
                list.appendChild(ideaView.render().el);
            });

            this.$el.html( this.template(data) );
            this.$('.idealist').append( list );

            return this;
        },

        /**
         * 
         */
        events: {
            'blur #synthesisPanel-title': 'onTitleBlur',
            'blur #synthesisPanel-introduction': 'onIntroductionBlur',
            'blur #synthesisPanel-conclusion': 'onConclusionBlur',

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
         * Unblocks the panel
         */
        unblockPanel: function(){
            this.$('.panel').removeClass('is-loading');
        },

        /**
         * 
         */
        onTitleBlur: function(ev){
            var title = app.stripHtml(ev.currentTarget.innerHTML);
            this.model.set('subject', title);
        },

        /**
         * 
         */
        onIntroductionBlur: function(ev){
            var introduction = app.stripHtml(ev.currentTarget.innerHTML);
            this.model.set("introduction", introduction);
        },

        /**
         * 
         */
        onConclusionBlur: function(ev){
            var conclusion = app.stripHtml(ev.currentTarget.innerHTML);
            this.model.set('conclusion', conclusion);
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
                url = app.getApiUrl('posts'),
                template = app.loadTemplate('synthesisEmail'),
                ideas = this.ideas.getInSynthesisIdeas();

            var onSuccess = function(resp){
                var data = {
                    subject: app.format(i18n.gettext('[synthesis] {0}'), json.subject),
                    message: template({
                        email: resp[0].most_common_recipient_address,
                        subject: json.subject,
                        introduction: json.introduction,
                        conclusion: data.conclusion,
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
                        this.unblockPanel();
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

            this.blockPanel();
        }
    });


    return SynthesisPanel;

});
