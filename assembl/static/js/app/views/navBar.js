'use strict';

define(['backbone.marionette', 'jquery', 'underscore', 'app', 'common/context', 'models/groupSpec', 'common/collectionManager', 'utils/panelSpecTypes', 'objects/viewsFactory', 'models/roles', 'utils/permissions', 'utils/i18n', 'utils/roles', 'backbone.modal', 'backbone.marionette.modals'],
    function (Marionette, $, _, Assembl, Ctx, GroupSpec, CollectionManager, PanelSpecTypes, viewsFactory, RolesModel, Permissions, i18n, Roles) {

        var navBarLeft = Marionette.ItemView.extend({
            template: '#tmpl-navBarLeft',
            className: 'navbar-left',
            onRender: function(){
                var that = this;
                Assembl.commands.setHandler('socket:open', function () {
                    that.$('#onlinedot').addClass('is-online');
                });
                Assembl.commands.setHandler('socket:close', function () {
                    that.$('#onlinedot').removeClass('is-online');
                });
            }
        });

        var navBarRight = Marionette.ItemView.extend({
            template: '#tmpl-navBarRight',
            className: 'navbar-right',
            initialize: function(options){
                this.roles = options.roles;
                this.role = options.role;
                if(this.roles) {
                  this.listenTo(this.roles, 'remove add', function(model){
                    this.role = (_.size(this.roles)) ? model : undefined;
                    this.render();
                  });
                }
            },
            ui: {
                currentLocal: '.js_setLocale',
                joinDiscussion: '.js_joinDiscussion',
                needJoinDiscussion: '.js_needJoinDiscussion'
            },
            events: {
                'click @ui.currentLocal': 'setLocale',
                'click @ui.joinDiscussion': 'joinPopin',
                'click @ui.needJoinDiscussion': 'needJoinDiscussion'
            },
            serializeData: function () {
                return {
                    Ctx: Ctx,
                    role: this.role,
                    canSubscribeToDiscussion: Ctx.getCurrentUser().can(Permissions.SELF_REGISTER)
                }
            },
            templateHelpers: function () {
                return {
                    urlNotifications: function () {
                        return '/' + Ctx.getDiscussionSlug() + '/user/notifications';
                    },
                    urlLogOut: function () {
                        return '/' + Ctx.getDiscussionSlug() + '/logout';
                    },
                    userProfile: function(){
                        return '/' + Ctx.getDiscussionSlug() + '/user/profile';
                    }
                }
            },
            setLocale: function (e) {
                var lang = $(e.target).attr('data-locale');
                Ctx.setLocale(lang);
            },
            needJoinDiscussion: function () {
                if (!this._store.getItem('needJoinDiscussion')) {
                    this._store.setItem('needJoinDiscussion', true);
                }
            },

            joinPopin: function(){
                Assembl.vent.trigger('navBar:joinDiscussion');
            }
        });

        var navBar = Marionette.LayoutView.extend({
            template: '#tmpl-navBar',
            tagName: 'nav',
            className: 'navbar navbar-default',
            initialize: function () {
                this._store = window.localStorage;
                this.showPopInDiscussion();
                this.showPopInOnFirstLoginAfterAutoSubscribeToNotifications();
                this.listenTo(Assembl.vent, 'navBar:subscribeOnFirstPost', this.showPopInOnFirstPost);
                this.listenTo(Assembl.vent, 'navBar:joinDiscussion', this.joinDiscussion)
            },
            ui: {
                groups: '.js_addGroup',
                expertInterface: '.js_switchToExpertInterface',
                simpleInterface: '.js_switchToSimpleInterface'
            },
            events: {
                'click @ui.groups': 'addGroup',
                'click @ui.expertInterface': 'switchToExpertInterface',
                'click @ui.simpleInterface': 'switchToSimpleInterface'
            },
            regions: {
              'navBarLeft':'#navBarLeft',
              'navBarRight':'#navBarRight'
            },

            serializeData: function () {
                return {
                    Ctx: Ctx
                }
            },

            onBeforeShow: function(){
                var that = this,
                    collectionManager = new CollectionManager();

                if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {
                    collectionManager.getLocalRoleCollectionPromise()
                        .then(function (allRole) {

                            var role = allRole.find(function (local_role) {
                                return local_role.get('role') === Roles.PARTICIPANT;
                            });

                            var navRight = new navBarRight({
                                role: role,
                                roles: allRole
                            });

                            that.getRegion('navBarRight').show(navRight);

                            that.getRegion('navBarLeft').show(new navBarLeft());
                        });
                } else {
                    var navRight = new navBarRight({
                        role: undefined
                    });
                    this.getRegion('navBarRight').show(navRight);
                    this.getRegion('navBarLeft').show(new navBarLeft());
                }
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
                            PanelSpecTypes: PanelSpecTypes
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
                            that = this,
                            hasNavSide = false;

                        if ($('.itemGroup').hasClass('is-selected')) {

                            $('.itemGroup.is-selected').each(function () {
                                var item = $(this).attr('data-view');
                                items.push({type: item});

                                if(item === 'navSidebar'){
                                  hasNavSide = true;
                                }
                            });
                            groupSpecsP.done(function (groupSpecs) {
                                var groupSpec = new GroupSpec.Model(
                                    {'panels': items}, {'parse': true, 'viewsFactory': viewsFactory});
                                groupSpecs.add(groupSpec);
                            });

                            setTimeout(function () {
                                that.scrollToRight();

                                if(hasNavSide){
                                    Assembl.vent.trigger('navigation:selected', 'home');
                                }

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

            // @param popinType: null, 'first_post', 'first_login_after_auto_subscribe_to_notifications'
            joinDiscussion: function (evt, popinType) {
                var self = this,
                    collectionManager = new CollectionManager();

                var model = new Backbone.Model({
                    notificationsToShow: null
                });

                var modalClassName = 'group-modal popin-wrapper modal-joinDiscussion';
                var modalTemplate = _.template($('#tmpl-joinDiscussion').html());

                if ( popinType == 'first_post' ){
                    modalClassName = 'group-modal popin-wrapper modal-firstPost';
                    modalTemplate = _.template($('#tmpl-firstPost').html());
                }
                else if ( popinType == 'first_login_after_auto_subscribe_to_notifications' ){
                    modalClassName = 'group-modal popin-wrapper modal-firstPost';
                    modalTemplate = _.template($('#tmpl-firstLoginAfterAutoSubscribeToNotifications').html());
                }

                collectionManager.getNotificationsDiscussionCollectionPromise()
                    .then(function (discussionNotifications) {
                        model.notificationsToShow = _.filter(discussionNotifications.models, function (m) {
                            // keep only the list of notifications which become active when a user follows a discussion
                            return (m.get('creation_origin') === 'DISCUSSION_DEFAULT') && (m.get('status') === 'ACTIVE');
                        });

                        // we show the popin only if there are default notifications
                        if ( model.notificationsToShow && model.notificationsToShow.length ){

                            var Modal = Backbone.Modal.extend({
                                template: modalTemplate,
                                className: modalClassName,
                                cancelEl: '.close, .js_close',

                                model: model,
                                initialize: function () {
                                    var that = this;
                                    this.$('.bbm-modal').addClass('popin');
                                },
                                events: {
                                    'click .js_subscribe': 'subscription',
                                    'click .js_close': 'closeModal'
                                },
                                serializeData: function () {
                                    return {
                                        i18n: i18n,
                                        notificationsToShow: model.notificationsToShow,
                                        urlNotifications: '/' + Ctx.getDiscussionSlug() + '/user/notifications'
                                    }
                                },
                                subscription: function () {
                                    var that = this;

                                    if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {

                                        var LocalRolesUser = new RolesModel.Model({
                                            role: Roles.PARTICIPANT,
                                            discussion: 'local:Discussion/' + Ctx.getDiscussionId()
                                        });
                                        LocalRolesUser.save(null, {
                                            success: function (model, resp) {
                                                // TODO: Is there a simpler way to do this? MAP
                                                self.navBarRight.currentView.ui.joinDiscussion.css('visibility', 'hidden');
                                                self._store.removeItem('needJoinDiscussion');
                                                that.triggerSubmit();
                                            },
                                            error: function (model, resp) {
                                                console.error('ERROR: joinDiscussion->subscription', resp);
                                            }
                                        })
                                    }
                                },

                                closeModal: function () {
                                    self._store.removeItem('needJoinDiscussion');
                                }
                            });
                            Assembl.slider.show(new Modal());
                        }
                    }
                );

                

            },

            showPopInOnFirstPost: function(){
                this.joinDiscussion(null, 'firstPost');
            },

            showPopInOnFirstLoginAfterAutoSubscribeToNotifications: function(){
                if ( typeof first_login_after_auto_subscribe_to_notifications != 'undefined'
                    && first_login_after_auto_subscribe_to_notifications == true )
                {
                    this.joinDiscussion(null, 'first_login_after_auto_subscribe_to_notifications');
                }
            },

            showPopInDiscussion: function () {
                var needPopIn = this._store.getItem('needJoinDiscussion');
                if (needPopIn && Ctx.getCurrentUserId() && this.roles.get('role') === null) {
                    this.joinDiscussion();
                } else {
                    this._store.removeItem('needJoinDiscussion');
                }
            }

        });

        return navBar;

    });