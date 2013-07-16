define(['backbone', 'underscore', 'models/idea', 'views/idea', 'app'],
function(Backbone, _, Idea, IdeaView, app){
    'use strict';

    var FEATURED = 'featured',
        IN_SYNTHESIS = 'inSynthesis';

    var IdeaList = Backbone.View.extend({

        /**
         * The filter applied to the idea list
         * @type {string}
         */
        filter: null,

        /**
         * The collapse/expand button
         * @type {Zepto}
         */
        collapsed: true,

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
            var list = document.createDocumentFragment(),
                ideas = this.ideas.where({parentId: null});

            _.each(ideas, function(idea){
                var ideaView = new IdeaView({model:idea});
                list.appendChild(ideaView.render().el);
            });

            var data = {
                tocTotal: this.ideas.length,
                featuredTotal: this.ideas.where({featured: true}).length,
                synthesisTotal: this.ideas.where({inSynthesis: true}).length
            };

            data.title = data.tocTitle;
            data.collapsed = this.collapsed;

            data.filter = this.filter;

            this.$el.html( this.template(data) );
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
         * Collapse ALL ideas
         */
        collapseIdeas: function(){
            this.ideas.each(function(idea){
                idea.attributes.isOpen = false;
            });

            this.collapsed = true;
            this.render();
        },

        /**
         * Expand ALL ideas
         */
        expandIdeas: function(){
            this.ideas.each(function(idea){
                idea.attributes.isOpen = true;
            });

            this.collapsed = false;
            this.render();
        },

        /**
         * Filter the current idea list by featured
         */
        filterByFeatured: function(){
            this.filter = FEATURED;
            this.render();
        },

        /**
         * Filter the current idea list by inSynthesis
         */
        filterByInSynthesis: function(){
            this.filter = IN_SYNTHESIS;
            this.render();
        },

        /**
         * Clear the filter applied to the idea list
         */
        clearFilter: function(){
            this.filter = '';
            this.render();
        },

        /**
         * Blocks the panel
         */
        blockPanel: function(){
            this.$('.panel').addClass('is-loading');
        },

        /**
         * The events
         */
        'events': {
            'click #idealist-addbutton': 'addChildToSelected',
            'click #ideaList-collapseButton': 'toggleIdeas',
            'click #ideaList-closeButton': 'closePanel',

            'click #ideaList-filterByFeatured': 'filterByFeatured',
            'click #ideaList-filterByInSynthesis': 'filterByInSynthesis',
            'click #ideaList-filterByToc': 'clearFilter'
        },

        /**
         * Add a new child to the current selected
         */
        addChildToSelected: function(){
            var currentIdea = app.getCurrentIdea(),
                newIdea = new Idea.Model();

            if( this.ideas.get(currentIdea) ){
                currentIdea.addChild(newIdea);
            } else {
                this.ideas.add(newIdea);
                this.render();
            }

            newIdea.save();
        },

        /**
         * Collapse or expand the ideas
         */
        toggleIdeas: function(){
            if( this.collapsed ){
                this.expandIdeas();
            } else {
                this.collapseIdeas();
            }
        },

        /**
         * Closes the panel
         */
        closePanel: function(){
            if(this.button){
                this.button.trigger('click');
            }
        }

    });

    return IdeaList;
});
