define(function (require) {
    'use strict';

    var AllMessagesInIdeaListView = require('views/allMessagesInIdeaList'),
        OrphanMessagesInIdeaListView = require('views/orphanMessagesInIdeaList'),
        SynthesisInIdeaListView = require('views/synthesisInIdeaList'),
        Permissions = require('utils/permissions'),
        objectTreeRenderVisitor = require('views/visitors/objectTreeRenderVisitor'),
        ideaSiblingChainVisitor = require('views/visitors/ideaSiblingChainVisitor'),
        Backbone = require('backbone'),
        Assembl = require('modules/assembl'),
        Ctx = require('modules/context'),
        Idea = require('models/idea'),
        IdeaView = require('views/idea'),
        ideaGraphLoader = require('views/ideaGraph'),
        _ = require('underscore'),
        CollectionManager = require('modules/collectionManager'),
        i18n = require('utils/i18n');

    var FEATURED = 'featured',
        IN_SYNTHESIS = 'inNextSynthesis';


    var IdeaList = Backbone.View.extend({
        panelType: 'ideaList',
        className: 'ideaList',
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
        template: Ctx.loadTemplate('ideaList'),

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
        initialize: function (options) {
            var that = this,
                collectionManager = new CollectionManager();

            this.groupContent = options.groupContent;
            this.nav = options.nav;

            collectionManager.getAllIdeasCollectionPromise().done(
                function (allIdeasCollection) {
                    var events = ['reset', 'change:parentId', 'change:@id', 'change:inNextSynthesis', 'remove', 'add', 'destroy'];
                    that.listenTo(allIdeasCollection, events.join(' '), that.render);
                });

            collectionManager.getAllExtractsCollectionPromise().done(
                function (allExtractsCollection) {
                    // Benoitg - 2014-05-05:  There is no need for this, if an idealink
                    // is associated with the idea, the idea itself will receive a change event
                    // on the socket (unless it causes problem with local additions?)
                    that.listenTo(allExtractsCollection, 'add change reset', that.render);
                });

            Assembl.commands.setHandler("panel:open", function () {
                that.resizeGraphView();
            });

            Assembl.commands.setHandler("panel:close", function () {
                that.resizeGraphView();
            });

            this.listenTo(Assembl.vent, 'ideaList:removeIdea', function (idea) {
                that.removeIdea(idea);
            });

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

        getTitle: function () {
            return i18n.gettext(' ');
        },

        /**
         * The render
         */
        render: function () {
            if (Ctx.debugRender) {
                console.log("ideaList:render() is firing");
            }
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);
            this.body = this.$('.panel-body');
            var that = this,
                y = 0,
                rootIdea = null,
                rootIdeaDirectChildrenModels = [],
                filter = {},
                view_data = {},
                order_lookup_table = [],
                roots = [],
                collectionManager = new CollectionManager();

            function excludeRoot(idea) {
                return idea != rootIdea && !idea.hidden;
            }

            if (this.body.get(0)) {
                y = this.body.get(0).scrollTop;
            }

            if (this.filter === FEATURED) {
                filter.featured = true;
            }
            else if (this.filter === IN_SYNTHESIS) {
                filter.inNextSynthesis = true;
            }

            var list = document.createDocumentFragment();
            collectionManager.getAllIdeasCollectionPromise().done(
                function (allIdeasCollection) {
                    rootIdea = allIdeasCollection.getRootIdea();
                    if (Object.keys(filter).length > 0) {
                        rootIdeaDirectChildrenModels = allIdeasCollection.where(filter);
                    }
                    else {
                        rootIdeaDirectChildrenModels = allIdeasCollection.models;
                    }

                    rootIdeaDirectChildrenModels = rootIdeaDirectChildrenModels.filter(function (idea) {
                            return (idea.get("parentId") == rootIdea.id) || (idea.get("parentId") == null && idea.id != rootIdea.id);
                        }
                    );

                    rootIdeaDirectChildrenModels = _.sortBy(rootIdeaDirectChildrenModels, function (idea) {
                        return idea.get('order');
                    });

                    rootIdea.visitDepthFirst(objectTreeRenderVisitor(view_data, order_lookup_table, roots, excludeRoot));
                    rootIdea.visitDepthFirst(ideaSiblingChainVisitor(view_data));

                    _.each(roots, function (idea) {
                        var ideaView = new IdeaView({
                            model: idea, groupContent: that.groupContent
                        }, view_data);
                        list.appendChild(ideaView.render().el);
                    });

                    // Synthesis posts pseudo-idea
                    var synthesisView = new SynthesisInIdeaListView({
                        model: rootIdea, groupContent: that.groupContent
                    });
                    list.appendChild(synthesisView.render().el);

                    // Orphan messages pseudo-idea
                    var orphanView = new OrphanMessagesInIdeaListView({
                        model: rootIdea, groupContent: that.groupContent
                    });
                    list.appendChild(orphanView.render().el);

                    // All posts pseudo-idea
                    var allMessagesInIdeaListView = new AllMessagesInIdeaListView({
                        model: rootIdea, groupContent: that.groupContent
                    });
                    list.appendChild(allMessagesInIdeaListView.render().el);

                    var data = {
                        tocTotal: allIdeasCollection.length - 1,//We don't count the root idea
                        featuredTotal: allIdeasCollection.where({featured: true}).length,
                        synthesisTotal: allIdeasCollection.where({inNextSynthesis: true}).length,
                        canAdd: Ctx.getCurrentUser().can(Permissions.ADD_IDEA)
                    };

                    data.title = data.tocTitle;
                    data.collapsed = that.collapsed;
                    data.nav = that.nav;

                    data.filter = that.filter;
                    that.$el.html(that.template(data));
                    Ctx.initTooltips(that.$el);
                    that.$('.idealist').append(list);

                    that.body = that.$('.panel-body');
                    that.body.get(0).scrollTop = y;
                });
            return this;
        },

        /**
         * Remove the given idea
         * @param  {Idea} idea
         */
        removeIdea: function (idea) {
            var parent = idea.get('parent');

            if (parent) {
                parent.get('children').remove(idea);
            } else {
                console.log("ERROR:  This shouldn't happen, only th root idea has no parent");
            }
        },

        /**
         * Collapse ALL ideas
         */
        collapseIdeas: function () {
            var collectionManager = new CollectionManager();
            var that = this;
            this.collapsed = true;
            collectionManager.getAllIdeasCollectionPromise().done(
                function (allIdeasCollection) {
                    allIdeasCollection.each(function (idea) {
                        idea.attributes.isOpen = false;
                    });
                    that.render();
                });
        },

        /**
         * Expand ALL ideas
         */
        expandIdeas: function () {
            this.collapsed = false;
            var that = this;
            collectionManager.getAllIdeasCollectionPromise().done(
                function (allIdeasCollection) {
                    allIdeasCollection.each(function (idea) {
                        idea.attributes.isOpen = true;
                    });
                    that.render();
                });
        },

        /**
         * Filter the current idea list by featured
         */
        filterByFeatured: function () {
            this.filter = FEATURED;
            this.render();
        },

        /**
         * Filter the current idea list by inNextSynthesis
         */
        filterByInNextSynthesis: function () {
            this.filter = IN_SYNTHESIS;
            this.render();
        },

        /**
         * Clear the filter applied to the idea list
         */
        clearFilter: function () {
            this.filter = '';
            this.render();
        },

        /**
         * Sets the panel as full screen
         */
        setFullscreen: function () {
            Ctx.setFullscreen(this);
        },

        toggleGraphView: function () {
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
        loadGraphView: function () {
            if (this.show_graph) {
                var that = this;
                $.getJSON(Ctx.getApiUrl('generic') + "/Discussion/" + Ctx.getDiscussionId() + "/idea_graph_jit", function (data) {
                    that.graphData = data['graph'];
                    console.log(ideaGraphLoader);
                    that.hypertree = ideaGraphLoader(that.graphData);
                    try {
                        that.hypertree.onClick(Ctx.getCurrentIdea().getId(), {
                            // onComplete: function() {
                            //     that.hypertree.controller.onComplete();
                            // },
                            duration: 0
                        });
                    } catch (Exception) {
                    }
                });
            }
        },

        /**
         * Load the graph view
         */
        resizeGraphView: function () {
            if (this.show_graph && this.graphData !== undefined) {
                try {
                    this.hypertree = ideaGraphLoader(this.graphData);
                    this.hypertree.onClick(Ctx.getCurrentIdea().getId(), {
                        duration: 0
                    });
                } catch (Exception) {
                }
            }
        },

        /**
         * @event
         */
        onPanelBodyClick: function (ev) {
            if ($(ev.target).hasClass('panel-body')) {
                Ctx.setCurrentIdea(null);
            }
        },

        /**
         * Add a new child to the current selected.
         * If no idea is selected, add it at the root level ( no parent )
         */
        addChildToSelected: function () {
            var currentIdea = Ctx.getCurrentIdea(),
                newIdea = new Idea.Model(),
                that = this,
                collectionManager = new CollectionManager();

            collectionManager.getAllIdeasCollectionPromise().done(
                function (allIdeasCollection) {
                    if (allIdeasCollection.get(currentIdea)) {
                        newIdea.set('order', currentIdea.getOrderForNewChild());
                        currentIdea.addChild(newIdea);
                    } else {
                        newIdea.set('order', allIdeasCollection.getOrderForNewRootIdea());
                        allIdeasCollection.add(newIdea);
                        newIdea.save();
                    }
                    Ctx.setCurrentIdea(newIdea);
                });
        },

        /**
         * Collapse or expand the ideas
         */
        toggleIdeas: function () {
            if (this.collapsed) {
                this.expandIdeas();
            } else {
                this.collapseIdeas();
            }
        },

        /**
         * Closes the panel
         */
        closePanel: function () {
            if (this.button) {
                this.button.trigger('click');
            }
        },

        /**
         * @event
         */
        onAboveDragOver: function (ev) {
            var y = this.body.get(0).scrollTop;

            if (y === 0) {
                return;
            }

            this.body.get(0).scrollTop -= 1;
        },

        /**
         * @event
         */
        onBelowDragOver: function (ev) {
            this.body.get(0).scrollTop += 1;
        }

    });

    return IdeaList;
});
