'use strict';

var Marionette = require('../shims/marionette.js'),
    Backbone = require('../shims/backbone.js'),
    _ = require('../shims/underscore.js'),
    $ = require('../shims/jquery.js'),
    Assembl = require('../app.js'),
    Ctx = require('../common/context.js'),
    Segment = require('../models/segment.js'),
    Types = require('../utils/types.js'),
    i18n = require('../utils/i18n.js'),
    Permissions = require('../utils/permissions.js'),
    CollectionManager = require('../common/collectionManager.js'),
    PanelSpecTypes = require('../utils/panelSpecTypes.js'),
    AssemblPanel = require('./assemblPanel.js'),
    Subset = require('backbone.subset'),
    Promise = require('bluebird');


var SegmentView = Marionette.ItemView.extend({
    template: '#tmpl-segment',
    gridSize: AssemblPanel.prototype.CLIPBOARD_GRID_SIZE,
    ui: {
        postItFooter: '.postit-footer .text-quotation',
        postIt: '.postit'
    },
    initialize: function (options) {
        this.allUsersCollection = options.allUsersCollection;
        this.allMessagesCollection = options.allMessagesCollection;
        this.closeDeletes = options.closeDeletes;
    },

    events: {
        'click .js_closeExtract': 'onCloseButtonClick',
        'click .segment-link': "onSegmentLinkClick",
        'click .js_selectAsNugget': 'selectAsNugget',
        'dragstart .bx.postit': 'onDragStart'
    },

    serializeData: function () {
        var post,
            postCreator,
            idPost = this.model.get('idPost'),
            currentUser = Ctx.getCurrentUser(),
            harvester = this.model.getCreatorFromUsersCollection(this.allUsersCollection);

        if(!harvester) {
          throw new Error("No harvester found in segment");
        }
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
            harvester: harvester,
            allUsersCollection: this.allUsersCollection,
            canEditExtracts: currentUser.can(Permissions.EDIT_EXTRACT),
            canAddExtracts: currentUser.can(Permissions.ADD_EXTRACT),
            canEditMyExtracts: currentUser.can(Permissions.EDIT_MY_EXTRACT),
            ctx: Ctx
        }
    },

    onRender: function () {
        Ctx.initTooltips(this.$el);
        Ctx.convertUrlsToLinks(this.ui.postItFooter);
    },

    onDragStart: function (ev) {
        ev.currentTarget.style.opacity = 0.4;

        var cid = ev.currentTarget.getAttribute('data-segmentid'),
            segment = this.model.collection.get(cid);

        Ctx.showDragbox(ev, segment.getQuote());
        Ctx.setDraggedSegment(segment);
    },

    onSegmentLinkClick: function (ev) {
        var cid = ev.currentTarget.getAttribute('data-segmentid'),
            collectionManager = new CollectionManager();

        collectionManager.getAllExtractsCollectionPromise()
            .then(function (allExtractsCollection) {
                var segment = allExtractsCollection.get(cid);
                Ctx.showTargetBySegment(segment);
            });
    },

    onCloseButtonClick: function (ev) {
        var cid = ev.currentTarget.getAttribute('data-segmentid');
        if (this.closeDeletes) {
            this.model.destroy({
                success: function (model, resp) {
                },
                error: function (model, resp) {
                    console.error('ERROR: onCloseButtonClick', resp);
                }
            });
        } else {
            this.model.save('idIdea', null, {
                success: function (model, resp) {
                },
                error: function (model, resp) {
                    console.error('ERROR: onCloseButtonClick', resp);
                }
            });
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

        this.model.save(null, {
            success: function (model, resp) {
                if (model.get('important')) {
                    that.$('.nugget-indice .nugget').addClass('isSelected');
                } else {
                    that.$('.nugget-indice .nugget').removeClass('isSelected');
                }
            },
            error: function (model, resp) {
                console.error('ERROR: selectAsNugget', resp);
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

var IdeaSegmentListSubset = Backbone.Subset.extend({
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
    panelType: PanelSpecTypes.CLIPBOARD,
    className: 'clipboard',
    minWidth: 270,

    ui: {
        panelBody:'.panel-body',
        clipboardCount: ".clipboardCount",
        postIt: '.postitlist',
        clearSegmentList:'#segmentList-clear',
        closeButton:'#segmentList-closeButton',
        bookmark:'.js_bookmark'
    },
    regions: {
        extractList: '.postitlist'
    },

    initialize: function (options) {
        Object.getPrototypeOf(Object.getPrototypeOf(this)).initialize.apply(this, arguments);
        var that = this,
            collectionManager = new CollectionManager();

        collectionManager.getAllExtractsCollectionPromise()
            .then(function (allExtractsCollection) {
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
                }, 1000);
            });

        this.listenTo(Assembl.vent, 'segmentListPanel:showSegment', function (segment) {
            that.showSegment(segment);
        });
    },

    events: {
        'dragstart @ui.postIt': 'onDragStart',
        'dragend @ui.postIt': "onDragEnd",

        'dragover @ui.panelBody': 'onDragOver',
        'dragleave @ui.panelBody': 'onDragLeave',
        'drop @ui.panelBody': 'onDrop',

        'click @ui.clearSegmentList': "onClearButtonClick",
        'click @ui.closeButton': "closePanel",
        'click @ui.bookmark': 'onBookmark'
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

    onRender: function () {
        var that = this,
            collectionManager = new CollectionManager();
        if (Ctx.debugRender) {
            console.log("segmentListPanel:onRender() is firing");
        }
        if (this.clipboard) {
            Ctx.initTooltips(this.$el);

            Promise.join(collectionManager.getAllExtractsCollectionPromise(),
                         collectionManager.getAllUsersCollectionPromise(),
                         collectionManager.getAllMessageStructureCollectionPromise(),
                function (allExtractsCollection, allUsersCollection, allMessagesCollection) {

                    var segmentListView = new SegmentListView({
                        collection: that.clipboard,
                        allUsersCollection: allUsersCollection,
                        allMessagesCollection: allMessagesCollection,
                        closeDeletes: true
                    });

                    that.getRegion('extractList').show(segmentListView);
                });
        }
        this.resetTitle();
    },

    resetTitle: function () {
        if (this.clipboard) {
            var numExtracts = this.clipboard.models.length;
            this.ui.clipboardCount.html("(" + numExtracts + ")");
            this.getPanelWrapper().resetTitle("<i class='icon-clipboard'></i> " + i18n.gettext('Clipboard') + " (" + numExtracts + ")");
        } else {
            this.ui.clipboardCount.html("");
            this.getPanelWrapper().resetTitle(i18n.gettext('Clipboard') + " (" + i18n.gettext('empty') + ")");
        }
    },

    /**
     * Add a segment to the clipboard.  If the segment exists, it will be
     * unlinked from it's idea (if any).
     * @param {Segment} segment
     */
    addSegment: function (segment) {
        var collectionManager = new CollectionManager();

        collectionManager.getAllExtractsCollectionPromise()
            .then(function (allExtractsCollection) {
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

            segment.save(null, {
                success: function (model, resp) {
                },
                error: function (model, resp) {
                    console.error('ERROR: addTextAsSegment', resp);
                }
            });
        }
    },

    /**
     * Shows the given segment
     * @param {Segment} segment
     */
    showSegment: function (segment) {
        //TODO: add a new behavior for this (popin...)
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

        ev.currentTarget.style.opacity = 1;
        Ctx.setDraggedSegment(null);
        this.$el.removeClass('is-dragover');
        ev.preventDefault();
    },

    onDragOver: function (ev) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }

        if (ev.originalEvent) {
            ev = ev.originalEvent;
        }

        ev.dataTransfer.dropEffect = 'all';

        var isText = false;
        if (ev.dataTransfer && ev.dataTransfer.types && _.indexOf(ev.dataTransfer.types, "text/plain") > -1) {
            isText = Ctx.draggedIdea ? false : true;
        }

        if (Ctx.getDraggedSegment() !== null || isText) {
            this.$el.addClass("is-dragover");
        }

        if (Ctx.getDraggedAnnotation() !== null) {
            this.$el.addClass("is-dragover");
        }
    },

    onDragLeave: function (ev) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }
        this.$el.removeClass('is-dragover');
    },

    onDrop: function (ev) {
        if (ev) {
            ev.preventDefault();
            ev.stopPropagation();
        }

        this.$el.removeClass('is-dragover');

        var idea = Ctx.popDraggedIdea();
        if (idea) {
            return; // Do nothing
        }

        var segment = Ctx.getDraggedSegment();
        if (segment) {
            this.addSegment(segment);
            Ctx.setDraggedSegment(null);
        }

        var annotation = Ctx.getDraggedAnnotation();
        if (annotation) {
            Ctx.saveCurrentAnnotationAsExtract();
        }

        //the segments is already created
        /*var text = ev.dataTransfer.getData("Text");
        if (text) {
            this.addTextAsSegment(text);
        }*/

        this.render();
        return;
    },

    onClearButtonClick: function (ev) {
        var that = this,
            collectionManager = new CollectionManager(),
            ok = confirm(i18n.gettext('Are you sure you want to empty your entire clipboard?')),
            user_id = Ctx.getCurrentUser().id;

        if (ok) {
            collectionManager.getAllExtractsCollectionPromise()
                .done(function() {
                    that.clipboard.filter(function (s) {
                        return s.get('idCreator') == user_id
                    }).map(function (segment) {

                        segment.destroy({
                            success: function (model, resp) {
                            },
                            error: function (model, resp) {
                                console.error('ERROR: onClearButtonClick', resp)
                            }
                        });
                    });
                });
        }
    },

    onBookmark: function (e) {
        e.preventDefault();

        var Modal = Backbone.Modal.extend({
            template: _.template($('#tmpl-bookmarket').html()),
            className: 'capture group-modal popin-wrapper',
            cancelEl: '.close, .btn-primary'
        });

        Assembl.slider.show(new Modal());
    }

});

module.exports = {
    Clipboard: Clipboard,
    IdeaSegmentListSubset: IdeaSegmentListSubset,
    SegmentView: SegmentView,
    SegmentListView: SegmentListView,
    SegmentListPanel: SegmentListPanel
};
