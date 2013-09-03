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
         * The collapse/expand flag
         * @type {Boolean}
         */
        collapsed: false,

        /**
         * The tempate
         * @type {_.template}
         */
        template: app.loadTemplate('ideaList'),

        /**
         * .panel-body
         */
        body: null,

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
            this.body = this.$('.panel-body');
            var y = 0;

            if( this.body.get(0) ){
                y = this.body.get(0).scrollTop;
            }

            var filter = { parentId: null };

            if( this.filter === FEATURED){
                filter.featured = true;
            } else if ( this.filter === IN_SYNTHESIS ){
                filter.inSynthesis = true;
            }

            var list = document.createDocumentFragment(),
                ideas = this.ideas.where(filter);

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

            this.body = this.$('.panel-body');
            this.body.get(0).scrollTop = y;

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
            'dragover .panel-bodyabove': 'onAboveDragOver',
            'dragover .panel-bodybelow': 'onBelowDragOver',

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
        },

        /**
         * @event
         */
        onAboveDragOver: function(ev){
            var y = this.body.get(0).scrollTop;

            if( y === 0 ){
                return;
            }

            this.body.get(0).scrollTop -= 1;
        },

        /**
         * @event
         */
        onBelowDragOver: function(ev){
            this.body.get(0).scrollTop += 1;
        }

    });

    return IdeaList;
});
