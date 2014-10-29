define(function (require) {
    'use strict';

    var objectTreeRenderVisitor = require('views/visitors/objectTreeRenderVisitor'),
        Backbone = require('backbone'),
        _ = require('underscore'),
        $ = require('jquery'),
        Assembl = require('app'),
        Ctx = require('common/context'),
        Synthesis = require('models/synthesis'),
        Idea = require('models/idea'),
        Permissions = require('utils/permissions'),
        IdeaFamilyView = require('views/ideaFamily'),
        IdeaInSynthesisView = require('views/ideaInSynthesis'),
        AssemblPanel = require('views/assemblPanel'),
        i18n = require('utils/i18n'),
        EditableField = require('views/editableField'),
        CKEditorField = require('views/ckeditorField'),
        CollectionManager = require('common/collectionManager');


    var SynthesisPanel = AssemblPanel.extend({
        template: '#tmpl-synthesisPanel',
        panelType: 'synthesisPanel',
        className: 'synthesisPanel',
        gridSize: AssemblPanel.prototype.SYNTHESIS_PANEL_GRID_SIZE,
        /**
         * @init
         */
        initialize: function (obj) {
            var that = this,
                collectionManager = new CollectionManager();

            this.ideas = new Idea.Collection();
            $.when(collectionManager.getAllSynthesisCollectionPromise(),
                collectionManager.getAllIdeasCollectionPromise()
            ).then(function (synthesisCollection, allIdeasCollection) {
                    var rootIdea = allIdeasCollection.getRootIdea(),
                        raw_ideas;

                    if (!that.model) {
                        //If unspecified, we find the next_synthesis
                        that.model = _.find(synthesisCollection.models, function (model) {
                            return model.get('is_next_synthesis');
                        });
                    }
                    raw_ideas = that.model.get('ideas');
                    //console.log("Raw Ideas from model: ", raw_ideas)
                    if (raw_ideas) {
                        var ideas = [];
                        _.each(raw_ideas, function (raw_idea) {
                            //console.log(raw_idea);
                            var idea = allIdeasCollection.get(raw_idea['@id']);
                            if (idea) {
                                ideas.push(idea);
                            }
                            else {
                                console.log("synthesisPanel:render():  This shoudn't happen, fix toombstone support?")
                            }
                        });
                        that.ideas.reset(ideas);
                    }
                    that.listenTo(that.ideas, 'add remove reset', that.render);
                    that.listenTo(that.model, 'reset change', that.render);
                });


            Assembl.commands.setHandler('synthesisPanel:render', this.render);
        },

        events: {
            'click .synthesisPanel-publishButton': 'publish',
            'click .synthesisPanel-fullscreenButton': 'setFullscreen'
        },

        getTitle: function () {
            return i18n.gettext('Synthesis');
        },

        /**
         * The model
         * @type {Synthesis}
         */
        model: null,

        /**
         * Flag
         * @type {Boolean}
         */
        collapsed: false,

        serializeData: function () {
            var currentUser = Ctx.getCurrentUser(),
                canSend = currentUser.can(Permissions.SEND_SYNTHESIS),
                canEdit = currentUser.can(Permissions.EDIT_SYNTHESIS),
                data = {
                    canSend: canSend,
                    canEdit: canEdit,
                    Ctx: Ctx
                };

            if (this.model)
                data = _.extend(this.model.toJSON(), data);

            return data;
        },

        /**
         * The render
         * @return {SynthesisPanel}
         */
        onRender: function () {
            if (Ctx.debugRender) {
                console.log("synthesisPanel:onRender() is firing");
            }
            var that = this,
                view_data = {},
                order_lookup_table = [],
                roots = [],
                collectionManager = new CollectionManager(),
                canEdit = Ctx.getCurrentUser().can(Permissions.EDIT_SYNTHESIS);

            Ctx.removeCurrentlyDisplayedTooltips(this.$el);

            $.when(collectionManager.getAllSynthesisCollectionPromise(),
                collectionManager.getAllIdeasCollectionPromise()
            ).then(function (synthesisCollection, allIdeasCollection) {
                    // Getting the scroll position
                    if (!that.model) {
                        window.setTimeout(function () {
                            that.render();
                        }, 30);
                        return;
                    }
                    var body = that.$('.body-synthesis'),
                        y = body.get(0) ? body.get(0).scrollTop : 0,
                        synthesis_is_published = that.model.get("published_in_post") != null,
                        rootIdea = allIdeasCollection.getRootIdea();

                    Ctx.initTooltips(that.$el);
                    function inSynthesis(idea) {
                        if (idea.hidden) {
                            return false;
                        }
                        var retval;
                        if (that.model.get('is_next_synthesis')) {
                            //This special case is so we get instant feedback before
                            //the socket sends changes
                            retval = idea != rootIdea && idea.get('inNextSynthesis')
                        }
                        else {
                            retval = idea != rootIdea && that.ideas.contains(idea)
                        }
                        //console.log("Checking",idea,"returning:", retval, "synthesis is next synthesis:", that.model.get('is_next_synthesis'));
                        return retval
                    };
                    if (rootIdea) {
                        rootIdea.visitDepthFirst(objectTreeRenderVisitor(view_data, order_lookup_table, roots, inSynthesis));
                    }
                    _.each(roots, function append_recursive(idea) {
                        var rendered_idea_view = new IdeaFamilyView(
                            {model: idea,
                                innerViewClass: IdeaInSynthesisView,
                                innerViewClassInitializeParams: {synthesis: that.model}
                            }
                            , view_data);
                        that.$('.synthesisPanel-ideas').append(rendered_idea_view.render().el);
                    });
                    that.$('.body-synthesis').get(0).scrollTop = y;
                    if (canEdit && !synthesis_is_published) {
                        var titleField = new EditableField({
                            model: that.model,
                            modelProp: 'subject'
                        });
                        titleField.renderTo(that.$('.synthesisPanel-title'));

                        var introductionField = new CKEditorField({
                            model: that.model,
                            modelProp: 'introduction'
                        });
                        introductionField.renderTo(that.$('.synthesisPanel-introduction'));

                        var conclusionField = new CKEditorField({
                            model: that.model,
                            modelProp: 'conclusion'
                        });
                        conclusionField.renderTo(that.$('.synthesisPanel-conclusion'));
                    }
                    else {
                        that.$('.synthesisPanel-title').append(that.model.get('subject'));
                        that.$('.synthesisPanel-introduction').append(that.model.get('introduction'));
                        that.$('.synthesisPanel-conclusion').append(that.model.get('conclusion'));
                    }
                });

            return this;
        },

        /**
         * Sets the panel as full screen
         */
        setFullscreen: function () {
            Ctx.setFullscreen(this);
        },

        /**
         * Publish the synthesis
         */
        publish: function () {
            var ok = confirm(i18n.gettext("Do you want to publish the synthesis?"));
            if (ok) {
                this._publish();
            }
        },

        /**
         * Publishes the synthesis
         */
        _publish: function () {
            var publishes_synthesis_id = this.model.id,
                url = Ctx.getApiUrl('posts'),
                that = this;

            var onSuccess = function (resp) {
                var data = {
                    publishes_synthesis_id: publishes_synthesis_id,
                    subject: "Not used",
                    message: "Not used"
                };

                // Sending the synthesis
                $.ajax({
                    type: "post",
                    data: JSON.stringify(data),
                    contentType: 'application/json',
                    url: url,
                    success: function () {
                        alert(i18n.gettext("Synthesis published!"));
                        that.unblockPanel();
                        that.model = new Synthesis.Model({'@id': 'next_synthesis'});
                        that.model.fetch();
                    }
                });
            };

            // getting the most_common_recipient_address
            $.ajax({
                type: 'get',
                url: Ctx.getApiUrl('sources/'),
                contentType: 'application/json',
                success: onSuccess
            });

            that.blockPanel();
        }

    });


    return SynthesisPanel;

});
