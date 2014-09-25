define(function (require) {
    'use strict';

    var Backbone = require('backbone'),
        Assembl = require('modules/assembl'),
        Ctx = require('modules/context'),
        i18n = require('utils/i18n'),
        EditableField = require('views/editableField'),
        CKEditorField = require('views/ckeditorField'),
        Permissions = require('utils/permissions'),
        MessageSendView = require('views/messageSend'),
        Notification = require('views/notification'),
        SegmentList = require('views/segmentList'),
        CollectionManager = require('modules/collectionManager'),
        AssemblPanel = require('views/assemblPanel'),
        Marionette = require('marionette');

    //2014/08/03 ghourlier, never use ? delete it ?
    //var LONG_TITLE_ID = 'ideaPanel-longtitle';

    var IdeaPanel = AssemblPanel.extend({
        template: '#tmpl-ideaPanel',
        panelType: 'ideaPanel',
        className: 'ideaPanel',
        minimizeable: true,
        closeable: false,
        gridSize: AssemblPanel.prototype.IDEA_PANEL_GRID_SIZE,
        regions: {
            segmentList: ".postitlist"
        },
        initialize: function (options) {
            var that = this;

            if (!this.model) {
                this.model = null;
            }
            this.model = null;

            this.listenTo(Assembl.vent, "idea:selected", function (idea) {
                that.setIdeaModel(idea);
            });

            this.listenTo(Assembl.vent, 'ideaPanel:showSegment', function (segment) {
                that.showSegment(segment);
            });

        },
        modelEvents: {
            'change': 'render'
        },
        events: {
            'dragstart .box': 'onDragStart',
            'dragend .box': "onDragEnd",
            'dragover': 'onDragOver',
            'dragleave': 'onDragLeave',
            'drop': 'onDrop',
            'click .js_closeExtract': 'onSegmentCloseButtonClick',
            'click #ideaPanel-clearbutton': 'onClearAllClick',
            'click #ideaPanel-deleteButton': 'onDeleteButtonClick',
            'click .segment-link': "onSegmentLinkClick",
            'click #session-modal': "createWidgetSession"
        },

        getTitle: function () {
            return i18n.gettext('Idea');
        },

        tooltip: i18n.gettext('Detailled information about the currently selected idea in the Table of ideas'),

        /**
         * This is not inside the template beacuse babel wouldn't extract it in
         * the pot file
         */
        getSubIdeasLabel: function (subIdeas) {
            if (subIdeas.length == 0) {
                return i18n.gettext('This idea has no sub-ideas');
            }
            else {
                return i18n.sprintf(i18n.ngettext('This idea has %d sub-idea', 'This idea has %d sub-ideas', subIdeas.length), subIdeas.length);
            }
        },
        /**
         * This is not inside the template beacuse babel wouldn't extract it in
         * the pot file
         */
        getExtractsLabel: function () {
            if (!this.extractList || this.extractList.length == 0) {
                return i18n.gettext('No extracts were harvested for this idea');
            }
            else {
                var len = this.extractList.length;
                return i18n.sprintf(i18n.ngettext('Harvested in %d extract', 'Harvested in %d extracts', len), len);
            }
        },

        renderTemplateGetExtractsLabel: function () {
            this.$el.find('#ideaPanel-section-segments-legend').html(
                this.getExtractsLabel());
        },

        /**
         * The render
         */

        serializeData: function () {
            var subIdeas = {},
                votable_widgets = [],
                currentUser = Ctx.getCurrentUser(),
                canEdit = currentUser.can(Permissions.EDIT_IDEA) || false,
                canEditNextSynthesis = currentUser.can(Permissions.EDIT_SYNTHESIS);

            if (this.model) {
                subIdeas = this.model.getChildren();
                votable_widgets = this.model.getVotableOnWhichWidgets();
            }

            return {
                idea: this.model,
                subIdeas: subIdeas,
                votable_widgets: votable_widgets,
                canEdit: canEdit,
                i18n: i18n,
                getExtractsLabel: this.getExtractsLabel,
                getSubIdeasLabel: this.getSubIdeasLabel,
                canDelete: currentUser.can(Permissions.EDIT_IDEA),
                canEditNextSynthesis: canEditNextSynthesis,
                canEditExtracts: currentUser.can(Permissions.EDIT_EXTRACT),
                canEditMyExtracts: currentUser.can(Permissions.EDIT_MY_EXTRACT),
                canAddExtracts: currentUser.can(Permissions.EDIT_EXTRACT), //TODO: This is a bit too coarse
                canCreateWidgets: currentUser.can(Permissions.ADMIN_DISCUSSION),
                Ctx: Ctx
            }
        },

        onRender: function () {
            Ctx.removeCurrentlyDisplayedTooltips(this.$el);

            Ctx.initTooltips(this.$el);

            this.panel = this.$el;
            Ctx.initClipboard();

            if (this.model) {

                var that = this,
                    extracts = [],
                    currentUser = Ctx.getCurrentUser(),
                    canEdit = currentUser.can(Permissions.EDIT_IDEA) || false,
                    canEditNextSynthesis = currentUser.can(Permissions.EDIT_SYNTHESIS),
                    collectionManager = new CollectionManager();

                // display only important extract for simple user
                if (!Ctx.userCanChangeUi()) {
                    this.extractList.models = _.filter(this.extractList.models, function (model) {
                        return model.get('important');
                    });
                }

                if (this.extractList) {
                    $.when(
                        collectionManager.getAllExtractsCollectionPromise(),
                        collectionManager.getAllUsersCollectionPromise(),
                        collectionManager.getAllMessageStructureCollectionPromise()
                    ).then(
                        function (allExtractsCollection, allUsersCollection, allMessagesCollection) {
                            that.extractListView = new SegmentList.SegmentListView({
                                collection: that.extractList,
                                allUsersCollection: allUsersCollection,
                                allMessagesCollection: allMessagesCollection
                            });
                            that.segmentList.show(that.extractListView);
                            that.renderTemplateGetExtractsLabel();
                        });
                } else {
                    this.renderTemplateGetExtractsLabel();
                }

                var shortTitleField = new EditableField({
                    'model': this.model,
                    'modelProp': 'shortTitle',
                    'class': 'panel-editablearea text-bold',
                    'data-tooltip': i18n.gettext('Short expression (only a few words) of the idea in the table of ideas.'),
                    'placeholder': i18n.gettext('New idea'),
                    'canEdit': canEdit
                });
                shortTitleField.renderTo(this.$('#ideaPanel-shorttitle'));

                this.longTitleField = new CKEditorField({
                    'model': this.model,
                    'modelProp': 'longTitle',
                    'placeholder': this.model.getLongTitleDisplayText(),
                    'canEdit': canEditNextSynthesis
                });
                this.longTitleField.renderTo(this.$('#ideaPanel-longtitle'));

                this.definitionField = new CKEditorField({
                    'model': this.model,
                    'modelProp': 'definition',
                    'placeholder': this.model.getDefinitionDisplayText(),
                    'canEdit': canEdit
                });
                this.definitionField.renderTo(this.$('#ideaPanel-definition'));

                this.commentView = new MessageSendView({
                    'allow_setting_subject': false,
                    'reply_idea': this.model,
                    'body_help_message': i18n.gettext('Comment on this idea here...'),
                    'send_button_label': i18n.gettext('Send your comment'),
                    'subject_label': null,
                    'mandatory_body_missing_msg': i18n.gettext('You need to type a comment first...'),
                    'mandatory_subject_missing_msg': null
                });
                this.$('#ideaPanel-comment').append(this.commentView.render().el);
            }
        },

        /**
         * Add a segment
         * @param  {Segment} segment
         */
        addSegment: function (segment) {
            delete segment.attributes.highlights;

            var id = this.model.getId();
            segment.save('idIdea', id);
        },

        /**
         * Shows the given segment with an small fx
         * @param {Segment} segment
         */
        showSegment: function (segment) {
            var that = this,
                selector = Ctx.format('.box[data-segmentid={0}]', segment.cid),
                idIdea = segment.get('idIdea'),
                box,
                collectionManager = new CollectionManager();

            collectionManager.getAllIdeasCollectionPromise().done(
                function (allIdeasCollection) {
                    var idea = allIdeasCollection.get(idIdea);
                    if (!idea) {
                        return;
                    }

                    that.setIdeaModel(idea);
                    box = that.$(selector);

                    if (box.length) {
                        var panelBody = that.$('.panel-body');
                        var panelOffset = panelBody.offset().top;
                        var offset = box.offset().top;
                        // Scrolling to the element
                        var target = offset - panelOffset + panelBody.scrollTop();
                        panelBody.animate({ scrollTop: target });
                        box.highlight();
                    }
                }
            );
        },

        onReplaced: function (newObject) {
            if (this.model !== null) {
                this.stopListening(this.model, 'replacedBy acquiredId');
            }
            this.setIdeaModel(newObject);
        },

        /**
         * Set the given idea as the current one
         * @param  {Idea} [idea=null]
         */
        setIdeaModel: function (idea) {
            var that = this,
                collectionManager = new CollectionManager(),
                ideaChangeCallback = function () {
                    //console.log("setCurrentIdea:ideaChangeCallback fired");
                    that.render();
                };
            if (idea !== this.model) {
                if (this.model !== null) {
                    this.stopListening(this.model, 'change replacedBy acquiredId');
                }
                this.model = idea;
                if (this.extractList) {
                    this.stopListening(this.extractList);
                    this.extractList = null;
                }
                if (this.extractListView) {
                    this.extractListView.unbind();
                    this.extractListView = null;
                }
                if (this.model !== null) {
                    this.segmentList.reset();
                    //console.log("setCurrentIdea:  setting up new listeners for "+this.model.id);
                    this.listenTo(this.model, 'change', ideaChangeCallback);
                    this.listenTo(this.model, 'replacedBy', function (m) {
                        that.onReplaced(m);
                    });
                    this.listenTo(this.model, 'acquiredId', function (m) {
                        // model has acquired an ID. Reset everything.
                        var model = that.model;
                        that.model = null;
                        that.setIdeaModel(model);
                    });
                    if (this.model.id) {
                        //Ctx.openPanel(assembl.ideaPanel);
                        $.when(collectionManager.getAllExtractsCollectionPromise()).then(
                            function (allExtractsCollection) {
                                that.extractList = new SegmentList.IdeaSegmentList([], {
                                    parent: allExtractsCollection,
                                    ideaId: that.model.id
                                });
                                that.listenTo(that.extractList, "add remove reset change", that.renderTemplateGetExtractsLabel);
                                that.render();
                            });
                    }
                } else {
                    //TODO: More sophisticated behaviour here, depending 
                    //on if the panel was opened by selection, or by something else.
                    //app.closePanel(app.ideaPanel);
                    this.segmentList.empty();
                    this.render();
                }
            }
        },

        /**
         * Delete the current idea
         */
        deleteCurrentIdea: function () {
            // to be deleted, an idea cannot have any children nor segments
            var that = this,
                children = this.model.getChildren();
            
            this.blockPanel();
            $.when(
                this.model.getExtractsPromise()
                ).then(
                function(ideaExtracts) {
                  that.unblockPanel();
                  if (children.length > 0) {
                    that.unblockPanel();
                    alert(i18n.gettext('You cannot delete an idea while it has sub-ideas.'));
                  }
                  // Nor has any segments
                  else if (ideaExtracts.length > 0) {
                    that.unblockPanel();
                    alert(i18n.gettext('You cannot delete an idea associated to extracts.'));
                  }
                  else {
                    // That's a bingo
                    var ok = confirm(i18n.gettext('Confirm that you want to delete this idea.'));
                    
                    if (ok) {
                      that.model.destroy({ success: function () {
                        that.unblockPanel();
                        Ctx.setCurrentIdea(null);
                      }});
                    }
                    else {
                      that.unblockPanel();
                    }
                  }
                });
        },


        createWidgetSession: function () {

            if (this.model) {

                var data = {
                    type: 'CreativityWidget',
                    settings: JSON.stringify({
                        "idea": this.model.attributes['@id']
                    })
                }


                var notification = new Notification();

                notification.openSession(null, {view: 'edit'});

                return;

                Backbone.ajax({
                    type: 'POST',
                    url: '/data/Discussion/' + Assembl.getDiscussionId() + '/widgets',
                    data: $.param(data),
                    success: function (data, textStatus, jqXHR) {

                        //TODO: add config receive
                        notification.openSession(null, {view: 'edit'});

                    },
                    errors: function (jqXHR, textStatus, errorThrown) {


                    }
                })
            }

        },

        /**
         * @event
         */
        onDragStart: function (ev) {
            var that = this,
                collectionManager = new CollectionManager();
            //TODO: Deal with editing own extract (EDIT_MY_EXTRACT)
            collectionManager.getAllExtractsCollectionPromise().done(
                function (allExtractsCollection) {
                    if (Ctx.getCurrentUser().can(Permissions.EDIT_EXTRACT)) {
                        ev.currentTarget.style.opacity = 0.4;

                        var cid = ev.currentTarget.getAttribute('data-segmentid'),
                            segment = allExtractsCollection.getByCid(cid);
                        console.log(cid);
                        Ctx.showDragbox(ev, segment.getQuote());
                        Ctx.draggedSegment = segment;
                    }
                });

        },

        /**
         * @event
         */
        onDragEnd: function (ev) {
            ev.currentTarget.style.opacity = '';
            Ctx.draggedSegment = null;
        },

        /**
         * @event
         */
        onDragOver: function (ev) {
            console.log("ideaPanel:onDragOver() fired");
            ev.preventDefault();
            if (Ctx.draggedSegment !== null || Ctx.getDraggedAnnotation() !== null) {
                this.panel.addClass("is-dragover");
            }
        },

        /**
         * @event
         */
        onDragLeave: function () {
            //console.log("ideaPanel:onDragLeave() fired");
            this.panel.removeClass('is-dragover');
        },

        /**
         * @event
         */
        onDrop: function (ev) {
            //console.log("ideaPanel:onDrop() fired");
            if (ev) {
                ev.preventDefault();
                ev.stopPropagation();
            }

            this.panel.trigger('dragleave');

            var segment = Ctx.getDraggedSegment();
            if (segment) {
                this.addSegment(segment);
            }
            var annotation = Ctx.getDraggedAnnotation();
            if (annotation) {
                // Add as a segment
                Ctx.currentAnnotationIdIdea = this.model.getId();
                Ctx.currentAnnotationNewIdeaParentIdea = null;
                Ctx.saveCurrentAnnotationAsExtract();
                return;
            }

        },

        /**
         * @event
         */
        onSegmentCloseButtonClick: function (ev) {
            var that = this,
                cid = ev.currentTarget.getAttribute('data-segmentid'),
                collectionManager = new CollectionManager();
            collectionManager.getAllExtractsCollectionPromise().done(
                function (allExtractsCollection) {
                    var segment = allExtractsCollection.get(cid);

                    if (segment) {
                        segment.save('idIdea', null);
                    }
                });
        },

        /**
         * @event
         */
        onClearAllClick: function (ev) {
            var ok = confirm(i18n.gettext('Confirm that you want to send all extracts back to the clipboard.'));
            if (ok) {
                this.model.get('segments').reset();
            }
        },

        /**
         * @event
         */
        onDeleteButtonClick: function () {
            this.deleteCurrentIdea();
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
        }
    });

    return IdeaPanel;
});
