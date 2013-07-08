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
        initialize: function(){
            this.ideas = new Idea.Collection();
            this.ideas.on('reset', this.render, this);
        },

        /**
         * The render
         */
        render: function(){
            var list = document.createDocumentFragment();

            this.ideas.each(function(idea){
                var ideaView = new IdeaView({model:idea});
                list.appendChild(ideaView.render().el);
            });

            this.$el.html(this.template());
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
            if( currentIdea ){
                currentIdea.addChild( new Idea.Model() );
                currentIdea.open();
            }
        }

    });

    return IdeaList;
});
