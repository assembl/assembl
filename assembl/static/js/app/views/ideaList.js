'use strict';

define(['views/allMessagesInIdeaList', 'views/orphanMessagesInIdeaList', 'views/synthesisInIdeaList', 'utils/permissions', 'views/visitors/objectTreeRenderVisitor', 'views/visitors/ideaSiblingChainVisitor', 'backbone', 'app', 'common/context', 'models/idea', 'views/idea', 'utils/panelSpecTypes', 'views/assemblPanel', 'views/ideaGraph', 'underscore', 'common/collectionManager', 'utils/i18n', 'views/otherInIdeaList'],
    function (AllMessagesInIdeaListView, OrphanMessagesInIdeaListView, SynthesisInIdeaListView, Permissions, objectTreeRenderVisitor, ideaSiblingChainVisitor, Backbone, Assembl, Ctx, Idea, IdeaView, PanelSpecTypes, AssemblPanel, ideaGraphLoader, _, CollectionManager, i18n, OtherInIdeaListView) {

        var FEATURED = 'featured',
            IN_SYNTHESIS = 'inNextSynthesis';


        var IdeaList = AssemblPanel.extend({
            template: '#tmpl-ideaList',
            panelType: PanelSpecTypes.TABLE_OF_IDEAS,
            className: 'ideaList',
            regions: {
                ideaView: '.ideaView',
                otherView: '.otherView',
                synthesisView: '.synthesisView',
                orphanView: '.orphanView',
                allMessagesView: '.allMessagesView'
            },
            /**
             * .panel-body
             */
            body: null,

            /**
             * Are we showing the graph or the list?
             * @type {Boolean}
             */
            show_graph: false,
            minWidth: 320,
            gridSize: AssemblPanel.prototype.NAVIGATION_PANEL_GRID_SIZE,

            initialize: function (options) {
                Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize(options);
                var that = this,
                    collectionManager = new CollectionManager();

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

                this.listenTo(Assembl.vent, 'ideaList:addChildToSelected', function () {
                    that.addChildToSelected();
                });

            },

            'events': {
                'click .panel-body': 'onPanelBodyClick',
                'dragover .panel-bodyabove': 'onAboveDragOver',
                'dragover .panel-bodybelow': 'onBelowDragOver',

                'click .js_ideaList-addbutton': 'addChildToSelected',
                'click #ideaList-collapseButton': 'toggleIdeas',
                'click #ideaList-graphButton': 'toggleGraphView',
                'click #ideaList-closeButton': 'closePanel',
                'click #ideaList-fullscreenButton': 'setFullscreen',

                'click #ideaList-filterByFeatured': 'filterByFeatured',
                'click #ideaList-filterByInNextSynthesis': 'filterByInNextSynthesis',
                'click #ideaList-filterByToc': 'clearFilter'
            },

            serializeData: function () {
                return {
                    canAdd: Ctx.getCurrentUser().can(Permissions.ADD_IDEA)
                }
            },

            getTitle: function () {
                return i18n.gettext('Debate');
            },

            onRender: function () {
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
                                model: idea, 
                                groupContent: that.getContainingGroup()
                            }, view_data);
                            list.appendChild(ideaView.render().el);
                        });
                        that.$('.ideaView').append(list);

                        //sub menu other
                        var OtherView = new OtherInIdeaListView({
                            model: rootIdea
                        });
                        that.otherView.show(OtherView);

                        // Synthesis posts pseudo-idea
                        var synthesisView = new SynthesisInIdeaListView({
                            model: rootIdea, 
                            groupContent: that.getContainingGroup()
                        });
                        that.synthesisView.show(synthesisView);

                        // Orphan messages pseudo-idea
                        var orphanView = new OrphanMessagesInIdeaListView({
                            model: rootIdea,
                            groupContent: that.getContainingGroup()
                        });
                        that.orphanView.show(orphanView);

                        // All posts pseudo-idea
                        var allMessagesInIdeaListView = new AllMessagesInIdeaListView({
                            model: rootIdea,
                            groupContent: that.getContainingGroup()
                        });
                        that.allMessagesView.show(allMessagesInIdeaListView);

                        Ctx.initTooltips(that.$el);

                        that.body = that.$('.panel-body');
                        that.body.get(0).scrollTop = y;
                    });
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
                    console.error(" This shouldn't happen, only th root idea has no parent");
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
                            that.hypertree.onClick(Ctx.DEPRECATEDgetCurrentIdea().getId(), {
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
                        this.hypertree.onClick(Ctx.DEPRECATEDgetCurrentIdea().getId(), {
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
                    // We want to avoid the "All messages" state,
                    // unless the user clicks explicitly on "All messages".
                    // TODO benoitg: Review this decision.
                    //Ctx.DEPRECATEDsetCurrentIdea(null);
                }
            },

            /**
             * Add a new child to the current selected.
             * If no idea is selected, add it at the root level ( no parent )
             */
            addChildToSelected: function () {
                var currentIdea = Ctx.DEPRECATEDgetCurrentIdea(),
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

                            newIdea.save(null, {
                                success: function (model, resp) {
                                },
                                error: function (model, resp) {
                                    console.error('ERROR: addChildToSelected', resp);
                                }
                            });
                        }
                        Ctx.DEPRECATEDsetCurrentIdea(newIdea);
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
