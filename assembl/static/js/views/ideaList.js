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

                /*
                var children = ideaView.renderChildren();
                _.each(children, function(child){
                    list.appendChild(child);
                });
                */
            });

            this.$el.html(this.template());
            this.$('.idealist').append( list );
            return this;
        }
    });

    return IdeaList;
});
