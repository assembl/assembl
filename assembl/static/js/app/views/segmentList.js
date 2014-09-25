define(function (require) {
    'use strict';

    var Backbone = require('backbone'),
        _ = require('underscore'),
        $ = require('jquery'),
        BackboneSubset = require('BackboneSubset'),
        Assembl = require('modules/assembl'),
        Ctx = require('modules/context'),
        Segment = require('models/segment'),
        Types = require('utils/types'),
        i18n = require('utils/i18n'),
        Permissions = require('utils/permissions'),
        CollectionManager = require('modules/collectionManager'),
        AssemblPanel = require('views/assemblPanel');

    var SegmentView = Marionette.ItemView.extend({
        template: '#tmpl-segment',
        gridSize: AssemblPanel.prototype.CLIPBOARD_GRID_SIZE,
        events: {
            'dragstart .postit': "onDragStart",
            //'drop': 'onDrop', // bubble up?
            'click .js_closeExtract': 'onCloseButtonClick',
            'click .segment-link': "onSegmentLinkClick",
            'click .js_selectAsNugget': 'selectAsNugget'
        },
        initialize: function (options) {
            this.allUsersCollection = options.allUsersCollection;
            this.allMessagesCollection = options.allMessagesCollection;
            this.closeDeletes = options.closeDeletes;
        },
        serializeData: function () {
            var post, postCreator, idPost = this.model.get('idPost'),
                currentUser = Ctx.getCurrentUser();
            if (idPost) {
                post = this.allMessagesCollection.get(idPost);
                if (post) {
                    postCreator = this.allUsersCollection.get(post.get('idCreator'));
                }
            }

            return {
                segment: this.model,
                post: post,
                postCreator: postCreator,
                canEditExtracts: currentUser.can(Permissions.EDIT_EXTRACT),
                canEditMyExtracts: currentUser.can(Permissions.EDIT_MY_EXTRACT),
                ctx: Ctx
            }
        },
        /**
         * The render
         * @return {segmentList}
         */
        onRender: function () {
            Ctx.initTooltips(this.$el);
        },

        /**
         * @event
         */
        onDragStart: function (ev) {
            ev.currentTarget.style.opacity = 0.4;

            var cid = ev.currentTarget.getAttribute('data-segmentid'),
                segment = this.model.collection.get(cid);

            Ctx.showDragbox(ev, segment.getQuote());
            Ctx.draggedSegment = segment;
        },

        /**
         * @event
         */
        onSegmentLinkClick: function (ev) {
            var cid = ev.currentTarget.getAttribute('data-segmentid'),
                collectionManager = new CollectionManager();

            collectionManager.getAllExtractsCollectionPromise().done(
                function (allExtractsCollection) {
                    var segment = allExtractsCollection.get(cid);
                    Ctx.showTargetBySegment(segment);
                });
        },
        /**
         * @event
         */
        onCloseButtonClick: function (ev) {
            var cid = ev.currentTarget.getAttribute('data-segmentid');
            if (this.closeDeletes) {
                this.model.destroy();
            } else {
                this.model.set('idIdea', null);
                this.model.save('idIdea', null);
            }
        },

        selectAsNugget: function (e) {
            e.preventDefault();
            var that = this;

            if (!this.model.get('important')) {
                this.model.set('important', true);
            } else {
                this.model.set('important', false);
            }

            this.model.save({}, {
                success: function (m) {
                    if (m.get('important')) {
                        that.$('.nugget-indice .nugget').addClass('isSelected');
                    } else {
                        that.$('.nugget-indice .nugget').removeClass('isSelected');
                    }
                }
            });
        }


    });

    var SegmentListView = Marionette.CollectionView.extend({
        childView: SegmentView,
        initialize: function (options) {
            this.childViewOptions = {
                allUsersCollection: options.allUsersCollection,
                allMessagesCollection: options.allMessagesCollection,
                closeDeletes: options.closeDeletes
            }
        }
    });

    var Clipboard = Backbone.Subset.extend({
        beforeInitialize: function (models, options) {
            this.currentUserId = options.currentUserId;
        },
        name: 'Clipboard',
        liveupdate_keys: ['idIdea'],
        sieve: function (extract) {
            return extract.get('idIdea') == null;
        },
        comparator: function (e1, e2) {
            var currentUserId = this.currentUserId,
                myE1 = e1.get('idCreator') == currentUserId,
                myE2 = e2.get('idCreator') == currentUserId;
            if (myE1 != myE2) {
                return myE1 ? -1 : 1;
            }
            return e2.getCreatedTime() - e1.getCreatedTime();
        }
    });

    var IdeaSegmentList = Backbone.Subset.extend({
        beforeInitialize: function (models, options) {
            this.ideaId = options.ideaId;
        },
        name: 'IdeaSegmentList',
        liveupdate_keys: ['idIdea'],
        sieve: function (extract) {
            return extract.get('idIdea') == this.ideaId;
        },
        comparator: function (segment) {
            return -segment.getCreatedTime();
        }
    });

    var SegmentListPanel = AssemblPanel.extend({
        template: '#tmpl-segmentList',
        panelType: 'clipboard',
        className: 'clipboard',

        ui: {
            body: ".panel-body",
            clipboardCount: ".clipboardCount"
        },
        regions: {
            extractList: '.postitlist'
        },

        /**
         * @init
         */
        initialize: function (options) {
            var that = this,
                collectionManager = new CollectionManager();
            this.panelWrapper = options.panelWrapper;

            $.when(collectionManager.getAllExtractsCollectionPromise()).then(
                function (allExtractsCollection) {
                    that.clipboard = new Clipboard([], {
                        parent: allExtractsCollection,
                        currentUserId: Ctx.getCurrentUser().id
                    });
                    that.listenTo(allExtractsCollection, 'invalid', function (model, error) {
                        alert(error);
                    });

                    that.listenTo(that.clipboard, 'add', function (segment) {
                        that.highlightSegment(segment);
                    });
                    that.listenTo(that.clipboard, 'add remove reset change', that.resetTitle);
                    window.setTimeout(function () {
                        that.render();
                    }, 0);
                });

            this.listenTo(Assembl.vent, 'segmentListPanel:showSegment', function (segment) {
                that.showSegment(segment);
            });
        },

        /**
         * The events
         * @type {Object}
         */
        events: {
            'dragend .postit': "onDragEnd",
            'dragover': 'onDragOver',
            'dragleave': 'onDragLeave',
            'drop': 'onDrop',
            'click #segmentList-clear': "onClearButtonClick",
            'click #segmentList-closeButton': "closePanel",
            'click .js_bookmark': 'bookmark'
        },

        getTitle: function () {
            return i18n.gettext('Clipboard');
        },

        serializeData: function () {
            return {
                Ctx: Ctx
            }
        },

        onBeforeRender: function () {
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);
        },

        /**
         * The render
         * @return {segmentList}
         */
        onRender: function () {
            var that = this,
                collectionManager = new CollectionManager();
            if (Ctx.debugRender) {
                console.log("segmentListPanel:onRender() is firing");
            }
            if (this.clipboard) {
                Ctx.initTooltips(this.$el);
                $.when(collectionManager.getAllExtractsCollectionPromise(),
                    collectionManager.getAllUsersCollectionPromise(),
                    collectionManager.getAllMessageStructureCollectionPromise()
                ).then(
                    function (allExtractsCollection, allUsersCollection, allMessagesCollection) {
                        that.extractList.show(new SegmentListView({
                            collection: that.clipboard,
                            allUsersCollection: allUsersCollection,
                            allMessagesCollection: allMessagesCollection,
                            closeDeletes: true
                        }));
                    });
            }
            this.resetTitle();
        },

        resetTitle: function () {
            if (this.clipboard) {
                var numExtracts = this.clipboard.models.length;
                this.ui.clipboardCount.html("(" + numExtracts + ")");
                this.panelWrapper.resetTitle("<i class='icon-clipboard'></i> " + i18n.gettext('Clipboard') + " (" + numExtracts + ")");
            } else {
                this.ui.clipboardCount.html("");
                this.panelWrapper.resetTitle(i18n.gettext('Clipboard') + " (" + i18n.gettext('empty') + ")");
            }
        },

        /**
         * Add a segment to the clipboard.  If the segment exists, it will be
         * unlinked from it's idea (if any).
         * @param {Segment} segment
         */
        addSegment: function (segment) {
            var that = this,
                collectionManager = new CollectionManager();

            collectionManager.getAllExtractsCollectionPromise().done(
                function (allExtractsCollection) {
                    delete segment.attributes.highlights;

                    allExtractsCollection.add(segment, {merge: true});
                    segment.save('idIdea', null);
                });
        },

        /**
         * Creates a segment with the given text and adds it to the segmentList
         * @param  {string} text
         * @param  {string} [post=null] The origin post
         * @return {Segment}
         */
        addTextAsSegment: function (text, post) {
            var idPost = null;

            if (post) {
                idPost = post.getId();
            }

            var segment = new Segment.Model({
                target: { "@id": idPost, "@type": Types.EMAIL },
                text: text,
                quote: text,
                idCreator: Ctx.getCurrentUser().getId(),
                idPost: idPost
            });

            if (segment.isValid()) {
                this.addSegment(segment);
                segment.save();
            }
        },

        /**
         * Shows the given segment
         * @param {Segment} segment
         */
        showSegment: function (segment) {
            //TODO: add a new behavior for this (popin...)
            //Ctx.openPanel(assembl.segmentListPanel);
            this.highlightSegment(segment);
        },

        /**
         * Highlight the given segment with an small fx
         * @param {Segment} segment
         */
        highlightSegment: function (segment) {
            var selector = Ctx.format('.box[data-segmentid={0}]', segment.cid),
                box = this.$(selector);

            if (box.length) {
                var panelBody = this.$('.panel-body');
                var panelOffset = panelBody.offset().top;
                var offset = box.offset().top;
                // Scrolling to the element
                var target = offset - panelOffset + panelBody.scrollTop();
                panelBody.animate({ scrollTop: target });
                box.highlight();
            }
        },

        onDragEnd: function (ev) {
            if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            }

            ev.currentTarget.style.opacity = '';
            Ctx.draggedSegment = null;
        },

        /**
         * @event
         */
        onDragOver: function (ev) {
            ev.preventDefault();

            var isText = false;
            if (ev.dataTransfer && ev.dataTransfer.types && ev.dataTransfer.types.indexOf('text/plain') > -1) {
                isText = Ctx.draggedIdea ? false : true;
            }

            if (Ctx.draggedSegment !== null || isText) {
                this.$el.addClass("is-dragover");
            }

            if (Ctx.getDraggedAnnotation() !== null) {
                this.$el.addClass("is-dragover");
            }
        },

        /**
         * @event
         */
        onDragLeave: function () {
            this.$el.removeClass('is-dragover');
        },

        /**
         * @event
         */
        onDrop: function (ev) {
            if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.$el.trigger('dragleave');

            var idea = Ctx.getDraggedIdea();
            if (idea) {
                return; // Do nothing
            }

            var segment = Ctx.getDraggedSegment();
            if (segment) {
                this.addSegment(segment);
                return;
            }

            var annotation = Ctx.getDraggedAnnotation();
            if (annotation) {
                Ctx.saveCurrentAnnotationAsExtract();
                return;
            }

            var text = ev.dataTransfer.getData("Text");
            if (text) {
                this.addTextAsSegment(text);
                return;
            }
        },

        /**
         * @event
         */
        onClearButtonClick: function (ev) {
            var that = this,
                collectionManager = new CollectionManager(),
                ok = confirm(i18n.gettext('Are you sure you want to empty your entire clipboard?')),
                user_id = Ctx.getCurrentUser().id;

            if (ok) {
                collectionManager.getAllExtractsCollectionPromise().done(
                    function (allExtractsCollection) {
                        that.clipboard.filter(function (s) {
                            return s.get('idCreator') == user_id
                        }).map(function (segment) {
                            segment.destroy();
                        });
                    });
            }
        },

        bookmark: function (e) {
            e.preventDefault();

            var Modal = Backbone.Modal.extend({
                template: _.template($('#tmpl-bookmarket').html()),
                className: 'capture',
                cancelEl: '.close, .btn-primary'
            });

            var modalView = new Modal();
            $('.popin-container').html(modalView.render().el);
        }

    });

    return {
        Clipboard: Clipboard,
        IdeaSegmentList: IdeaSegmentList,
        SegmentView: SegmentView,
        SegmentListView: SegmentListView,
        SegmentListPanel: SegmentListPanel
    };
});
