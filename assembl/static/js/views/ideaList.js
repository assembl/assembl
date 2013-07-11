define(['backbone', 'underscore', 'models/idea', 'views/idea', 'app'],
function(Backbone, _, Idea, IdeaView, app){
    'use strict';

    var IdeaList = Backbone.View.extend({
        /**
         * The tempate
         * @type {_.template}
         */
        template: app.loadTemplate('ideaList'),

        /**
         * @init
         */
        initialize: function(obj){
            if( obj && obj.button ){
                this.button = $(obj.button);
                this.button.on('click', app.togglePanel.bind(window, 'ideaList'));
            }

            this.ideas = new Idea.Collection();
            this.ideas.on('reset', this.render, this);
            this.ideas.on('change:parentId change:inSynthesis', this.render, this);
        },

        /**
         * The render
         */
        render: function(){
            var list = document.createDocumentFragment();

            var ideas = this.ideas.where({parentId: null});

            _.each(ideas, function(idea){
                var ideaView = new IdeaView({model:idea});
                list.appendChild(ideaView.render().el);
            });

            var data = {
                tocTitle: "Table des matières ({0})".replace('{0}', this.ideas.length),
                featuredTitle: "En vedette ({0})".replace('{0}', this.ideas.where({featured: true}).length),
                synthesisTitle: "Synthèse en cours ({0})".replace('{0}', this.ideas.where({inSynthesis: true}).length)
            };

            data.title = data.tocTitle;

            this.$el.html(this.template(data));
            this.$('.idealist').append( list );
            return this;
        },

        /**
         * Remove the given idea
         * @param  {Idea} idea
         */
        removeIdea: function(idea){
            var parent = idea.get('parent');

            if( parent ){
                parent.get('children').remove(idea);
            } else {
                this.ideas.remove(idea);
            }
        },

        /**
         * The events
         */
        'events': {
            'click #idealist-addbutton': 'addChildToSelected'
        },

        /**
         * Add a new child to the current selected
         */
        addChildToSelected: function(){
            var currentIdea = app.getCurrentIdea();

            if( this.ideas.get(currentIdea) ){
                currentIdea.addChild( new Idea.Model() );
            } else {
                this.ideas.add( new Idea.Model() );
                this.render();
            }
        }

    });

    return IdeaList;
});
