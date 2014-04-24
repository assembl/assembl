define(['backbone', 'underscore', 'models/idea', 'views/idea', "views/ideaGraph", 'app', 'types', 'views/allMessagesInIdeaList', 'views/orphanMessagesInIdeaList', 'views/synthesisInIdeaList', 'permissions'],
function(Backbone, _, Idea, IdeaView, ideaGraphLoader, app, Types, AllMessagesInIdeaListView, OrphanMessagesInIdeaListView, SynthesisInIdeaListView, Permissions){
    'use strict';

    var FEATURED = 'featured',
        IN_SYNTHESIS = 'inNextSynthesis';

    function renderVisitor(data_by_idea, filter_function) {
        if (filter_function === undefined) {
            filter_function = function(node) {return true;};
        }
        var last_parent_id = null;
        var last_idea_id = null;
        return function(idea, ancestry) {
            var filter_result = filter_function(idea);
            if (filter_result) {
                var idea_id = idea.getId();
                var level = 0;
                var in_ancestry = true;
                var ancestor_id, last_ancestor_id = null;
                var last_sibling_chain = [];
                for (var i in ancestry) {
                    ancestor_id = ancestry[i].getId();
                    in_ancestry = data_by_idea.hasOwnProperty(ancestor_id);
                    if (in_ancestry) {
                        level++;
                        // this only works if we go breadth-first
                        // otherwise if the next sibling is filtered out, my parent's
                        // idea of is_last_sibling will be wrong
                        last_sibling_chain.push(data_by_idea[ancestor_id]['is_last_sibling']);
                        last_ancestor_id = ancestor_id;
                    }
                }
                if (last_ancestor_id != null) {
                    data_by_idea[last_ancestor_id]['children'].push(idea);
                    if (last_ancestor_id == last_parent_id) {
                        data_by_idea[last_idea_id]['is_last_sibling'] = false;
                    }
                }
                last_parent_id = last_ancestor_id;
                var data = {
                    '@id': idea_id,
                    'idea': idea,
                    'level': level,
                    'skip_parent': !in_ancestry,
                    'is_last_sibling': true,
                    'last_sibling_chain': last_sibling_chain,
                    'children': []
                };
                data_by_idea[idea_id] = data;
                last_idea_id = idea_id;
            }
            // This allows you to return 0 vs false and cut recursion short.
            return filter_result !== 0;
        };
    };

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
         * Are we showing the graph or the list?
         * @type {Boolean}
         */
        show_graph: false,

        /**
         * @init
         */
        initialize: function(obj){
            if( obj && obj.button ){
                this.button = $(obj.button);
                this.button.on('click', app.togglePanel.bind(window, 'ideaList'));
            }

            this.ideas = new Idea.Collection();

            var events = ['reset', 'change:parentId', 'change:inNextSynthesis', 'remove', 'add'];
            this.ideas.on(events.join(' '), this.render, this);

            var that = this;
            app.on('idea:delete', function(){
                that.render();
            });

            app.on('ideas:update', function(ideas){
                that.ideas.add(ideas, {merge: true, silent: true});
                that.render();
            });
            app.on("panel:open", function(){that.resizeGraphView();});
            app.on("panel:close", function(){that.resizeGraphView();});
        },

        /**
         * The render
         */
        render: function(){
            app.trigger('render');

            this.body = this.$('.panel-body');
            var y = 0,
            rootIdea = this.ideas.getRootIdea(),
            rootIdeaDirectChildrenModels = [],
            filter = {};

            if( this.body.get(0) ){
                y = this.body.get(0).scrollTop;
            }

            if( this.filter === FEATURED ){
                filter.featured = true;
            } else if ( this.filter === IN_SYNTHESIS ){
                filter.inNextSynthesis = true;
            }

            var list = document.createDocumentFragment();

            if(Object.keys(filter).length > 0) {
                rootIdeaDirectChildrenModels = this.ideas.where(filter);
            }
            else {
                rootIdeaDirectChildrenModels = this.ideas.models;
            }

            rootIdeaDirectChildrenModels = rootIdeaDirectChildrenModels.filter(function(idea) {
                return (idea.get("parentId") == rootIdea.id) || (idea.get("parentId") == null && idea.id != rootIdea.id); 
                }
            );

            rootIdeaDirectChildrenModels = _.sortBy(rootIdeaDirectChildrenModels, function(idea){
                return idea.get('order');
            });

            // Synthesis posts pseudo-idea
            var synthesisView = new SynthesisInIdeaListView({model:rootIdea});
            list.appendChild(synthesisView.render().el);
            
            // All posts pseudo-idea
            var allMessagesInIdeaListView = new AllMessagesInIdeaListView({model:rootIdea});
            list.appendChild(allMessagesInIdeaListView.render().el);
            
            var view_data = {};
            function excludeRoot(idea) {return idea != rootIdea};
            rootIdea.visitBreadthFirst(renderVisitor(view_data, excludeRoot));
            //console.log(view_data);

            _.each(rootIdeaDirectChildrenModels, function(idea){
                var ideaView =  new IdeaView({model:idea}, view_data);
                list.appendChild(ideaView.render().el);
            });

            // Orphan messages pseudo-idea
            var orphanView = new OrphanMessagesInIdeaListView({model: rootIdea});
            list.appendChild(orphanView.render().el);

            var data = {
                tocTotal: this.ideas.length -1,//We don't count the root idea
                featuredTotal: this.ideas.where({featured: true}).length,
                synthesisTotal: this.ideas.where({inNextSynthesis: true}).length,
                canAdd: app.getCurrentUser().can(Permissions.ADD_IDEA)
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
         * Filter the current idea list by inNextSynthesis
         */
        filterByInNextSynthesis: function(){
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

        toggleGraphView: function() {
            this.show_graph = !this.show_graph;
            if (this.show_graph) {
                this.$('#idealist-graph').show();
                this.$('#idealist-list').hide();
                this.loadGraphView();
            } else {
                this.$('#idealist-graph').hide();
                this.$('#idealist-list').show();
            }
        },

        /**
         * Load the graph view
         */
        loadGraphView: function() {
            if (this.show_graph) {
                var that = this;
                $.getJSON( app.getApiUrl('generic')+"/Discussion/"+app.discussionID+"/idea_graph_jit", function(data){
                    that.graphData = data['graph'];
                    that.hypertree = ideaGraphLoader(that.graphData);
                    try {
                        that.hypertree.onClick(app.getCurrentIdea().getId(), {
                            // onComplete: function() {
                            //     that.hypertree.controller.onComplete();
                            // },
                            duration: 0
                        });
                    } catch (Exception) {}
                });
            }
        },

        /**
         * Load the graph view
         */
        resizeGraphView: function() {
            if (this.show_graph && this.graphData !== undefined) {
                try {
                    this.hypertree = ideaGraphLoader(this.graphData);
                    this.hypertree.onClick(app.getCurrentIdea().getId(), {
                        duration: 0
                    });
                } catch (Exception) {}
            }
        },


        /**
         * The events
         */
        'events': {
            'click .panel-body': 'onPanelBodyClick',
            'dragover .panel-bodyabove': 'onAboveDragOver',
            'dragover .panel-bodybelow': 'onBelowDragOver',

            'click #ideaList-addbutton': 'addChildToSelected',
            'click #ideaList-collapseButton': 'toggleIdeas',
            'click #ideaList-graphButton': 'toggleGraphView',
            'click #ideaList-closeButton': 'closePanel',
            'click #ideaList-fullscreenButton': 'setFullscreen',

            'click #ideaList-filterByFeatured': 'filterByFeatured',
            'click #ideaList-filterByInNextSynthesis': 'filterByInNextSynthesis',
            'click #ideaList-filterByToc': 'clearFilter'
        },

        /**
         * @event
         */
        onPanelBodyClick: function(ev){
            if( $(ev.target).hasClass('panel-body') ){
                app.setCurrentIdea(null);
            }
        },

        /**
         * Add a new child to the current selected.
         * If no idea is selected, add it at the root level ( no parent )
         */
        addChildToSelected: function(){
            var currentIdea = app.getCurrentIdea(),
                newIdea = new Idea.Model(),
                that = this;

            if( this.ideas.get(currentIdea) ){
                newIdea.set('order', currentIdea.getOrderForNewChild());
                currentIdea.addChild(newIdea);
            } else {
                newIdea.set('order', app.getOrderForNewRootIdea());
                this.ideas.add(newIdea);
                newIdea.save();
            }

            app.setCurrentIdea(newIdea);
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
