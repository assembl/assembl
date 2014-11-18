define(['backbone.marionette', 'jquery', 'underscore', 'app', 'common/context', 'models/groupSpec', 'common/collectionManager', 'utils/panelSpecTypes', 'objects/viewsFactory', 'models/roles', 'backbone.modal', 'backbone.marionette.modals'],
    function (Marionette, $, _, Assembl, Ctx, GroupSpec, CollectionManager, PanelSpecTypes, viewsFactory, RolesModel) {

        var navBar = Marionette.LayoutView.extend({
            template: '#tmpl-navBar',
            tagName: 'nav',
            className: 'navbar navbar-default',
            initialize: function () {

                this._store = window.localStorage;

                var that = this,
                    collectionManager = new CollectionManager();

                this.roles = new Backbone.Model();
                if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {
                    $.when(collectionManager.getLocalRoleCollectionPromise()).then(
                        function (allRole) {
                            that.roles = allRole.models;
                            that.render();
                        });
                }

                this.initPopinDiscussion();

            },
            ui: {
                currentLocal: '.js_setLocale',
                groups: '.js_addGroup',
                expertInterface: '.js_switchToExpertInterface',
                simpleInterface: '.js_switchToSimpleInterface',
                joinDiscussion: '.js_joinDiscussion',
                needJoinDiscussion: '.js_needJoinDiscussion'
            },
            events: {
                'click @ui.currentLocal': 'setLocale',
                'click @ui.groups': 'addGroup',
                'click @ui.expertInterface': 'switchToExpertInterface',
                'click @ui.simpleInterface': 'switchToSimpleInterface',
                'click @ui.joinDiscussion': 'joinDiscussion',
                'click @ui.needJoinDiscussion': 'needJoinDiscussion'
            },

            serializeData: function () {
                return {
                    Ctx: Ctx,
                    Roles: this.roles
                }
            },

            templateHelpers: function () {
                return {
                    urlNotifications: function () {
                        return '/' + Ctx.getDiscussionSlug() + '/users/notifications';
                    },
                    urlLogOut: function () {
                        return '/logout?next_view=/' + Ctx.getDiscussionSlug() + '/';
                    }
                }
            },

            setLocale: function (e) {
                var lang = $(e.target).attr('data-locale');
                Ctx.setLocale(lang);
            },
            switchToExpertInterface: function (e) {
                Ctx.setInterfaceType(Ctx.InterfaceTypes.EXPERT);
            },
            switchToSimpleInterface: function (e) {
                Ctx.setInterfaceType(Ctx.InterfaceTypes.SIMPLE);
            },
            addGroup: function () {
                var collectionManager = new CollectionManager(),
                    groupSpecsP = collectionManager.getGroupSpecsCollectionPromise(viewsFactory);

                var Modal = Backbone.Modal.extend({
                    template: _.template($('#tmpl-create-group').html()),
                    className: 'group-modal popin-wrapper',
                    cancelEl: '.close, .btn-cancel',
                    serializeData: function () {
                      return {
                        PanelSpecTypes:  PanelSpecTypes
                      }
                    },
                    initialize: function () {
                        this.$('.bbm-modal').addClass('popin');
                    },
                    events: {
                        'click .js_selectItem': 'selectItem',
                        'click .js_createGroup': 'createGroup'
                    },
                    selectItem: function (e) {
                        var elm = $(e.currentTarget),
                            item = elm.parent().attr('data-view');

                        elm.parent().toggleClass('is-selected');

                        if (elm.parent().hasClass('is-selected')) {
                            switch (item) {
                                case PanelSpecTypes.NAV_SIDEBAR.id:
                                    this.disableView([PanelSpecTypes.TABLE_OF_IDEAS, PanelSpecTypes.SYNTHESIS_EDITOR, PanelSpecTypes.CLIPBOARD, PanelSpecTypes.MESSAGE_LIST, PanelSpecTypes.IDEA_PANEL]);
                                    break;
                                case PanelSpecTypes.SYNTHESIS_EDITOR.id:
                                    this.disableView([PanelSpecTypes.TABLE_OF_IDEAS, PanelSpecTypes.NAV_SIDEBAR]);
                                    this.enableView([PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST]);
                                    break;
                                case PanelSpecTypes.TABLE_OF_IDEAS.id:
                                    this.disableView([PanelSpecTypes.SYNTHESIS_EDITOR, PanelSpecTypes.NAV_SIDEBAR]);
                                    this.enableView([PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST]);
                                    break;
                            }

                        } else {
                            switch (item) {
                                case PanelSpecTypes.NAV_SIDEBAR.id:
                                    this.enableView([PanelSpecTypes.TABLE_OF_IDEAS, PanelSpecTypes.SYNTHESIS_EDITOR, PanelSpecTypes.CLIPBOARD]);
                                    break;
                                case PanelSpecTypes.SYNTHESIS_EDITOR.id:
                                    this.enableView([PanelSpecTypes.TABLE_OF_IDEAS, PanelSpecTypes.NAV_SIDEBAR]);
                                    this.disableView([PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST]);
                                    break;
                                case PanelSpecTypes.TABLE_OF_IDEAS.id:
                                    this.disableView([PanelSpecTypes.IDEA_PANEL, PanelSpecTypes.MESSAGE_LIST]);
                                    this.enableView([PanelSpecTypes.SYNTHESIS_EDITOR, PanelSpecTypes.NAV_SIDEBAR]);
                                    break;
                            }
                        }

                    },

                    disableView: function (items) {
                        items.forEach(function (item) {
                            var panel = $(".itemGroup[data-view='" + item.id + "']");
                            panel.removeClass('is-selected');
                            panel.addClass('is-disabled');
                        });
                    },

                    enableView: function (items) {
                        items.forEach(function (item) {
                            var panel = $(".itemGroup[data-view='" + item.id + "']");
                            panel.removeClass('is-disabled');
                        });
                    },

                    createGroup: function () {
                        var items = [],
                            that = this;

                        if ($('.itemGroup').hasClass('is-selected')) {

                            $('.itemGroup.is-selected').each(function () {
                                var item = $(this).attr('data-view');
                                items.push({type: item});
                            });
                            console.log(items);
                            groupSpecsP.done(function (groupSpecs) {
                                var groupSpec = new GroupSpec.Model(
                                    {'panels': items}, {'parse': true, 'viewsFactory': viewsFactory});
                                groupSpecs.add(groupSpec);
                            });

                            setTimeout(function () {
                                that.scrollToRight();

                                that.$el.unbind();
                                that.$el.remove();
                            }, 100);
                        }

                    },
                    scrollToRight: function () {
                        var right = $('#groupsContainer').width();
                        $('#groupsContainer').animate({
                            scrollLeft: right
                        }, 1000);
                    }

                });

                Assembl.slider.show(new Modal());
            },

            joinDiscussion: function () {

                var self = this;

                var Modal = Backbone.Modal.extend({
                    template: _.template($('#tmpl-joinDiscussion').html()),
                    className: 'group-modal popin-wrapper modal-joinDiscussion',
                    cancelEl: '.close, .btn-cancel',
                    initialize: function () {
                        this.$('.bbm-modal').addClass('popin');
                    },
                    events: {
                        'click .js_subscribe': 'subscription',
                        'click .js_close': 'closeModal'
                    },
                    subscription: function () {
                        var that = this;

                        if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {

                            var LocalRolesUser = new RolesModel.Model({
                                role: 'r:participant',
                                discussion: 'local:Discussion/' + Ctx.getDiscussionId()
                            });

                            LocalRolesUser.save(null, {
                                success: function (model, resp) {
                                    self.ui.joinDiscussion.css('visibility', 'hidden');
                                    self._store.removeItem('needJoinDiscussion');
                                    that.triggerSubmit();
                                },
                                error: function (model, resp) {
                                    console.log('error', resp);
                                }
                            })
                        }
                    },

                    closeModal: function () {
                        self._store.removeItem('needJoinDiscussion');
                    }
                });

                Assembl.slider.show(new Modal());

            },

            initPopinDiscussion: function () {
                var needPopIn = this._store.getItem('needJoinDiscussion');

                if (needPopIn && _.isEmpty(this.roles.attributes)) {
                    this.joinDiscussion();
                } else {
                    this._store.removeItem('needJoinDiscussion');
                }
            },

            needJoinDiscussion: function () {
                if (!this._store.getItem('needJoinDiscussion')) {
                    this._store.setItem('needJoinDiscussion', true);
                }
            }

        });

        return navBar;

    });