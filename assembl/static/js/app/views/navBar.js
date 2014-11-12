define(['backbone.marionette', 'jquery', 'underscore', 'app', 'common/context', 'models/groupSpec', 'common/collectionManager', 'objects/viewsFactory', 'backbone.modal', 'backbone.marionette.modals'],
    function (Marionette, $, _, Assembl, Ctx, GroupSpec, CollectionManager, viewsFactory) {

        var navBar = Marionette.LayoutView.extend({
            template: '#tmpl-navBar',
            tagName: 'nav',
            className: 'navbar navbar-default',
            initialize: function () {

                var that = this,
                    collectionManager = new CollectionManager();

                this.roles = new Backbone.Model();

                $.when(collectionManager.getLocalRoleCollectionPromise()).then(
                    function (allRole) {
                        that.roles = allRole.models;
                        that.render()
                    });

            },
            ui: {
                currentLocal: '.js_setLocale',
                groups: '.js_addGroup',
                expertInterface: '.js_switchToExpertInterface',
                simpleInterface: '.js_switchToSimpleInterface',
                joinDiscussion: '.js_joinDiscussion'
            },
            events: {
                'click @ui.currentLocal': 'setLocale',
                'click @ui.groups': 'addGroup',
                'click @ui.expertInterface': 'switchToExpertInterface',
                'click @ui.simpleInterface': 'switchToSimpleInterface',
                'click @ui.joinDiscussion': 'joinDiscussion'
            },

            serializeData: function () {
                return {
                    'Ctx': Ctx,
                    'Roles': this.roles
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
                                case 'navSidebar':
                                    this.disableView(['ideaList', 'synthesisPanel', 'clipboard', 'messageList', 'ideaPanel']);
                                    break;
                                case 'synthesisPanel':
                                    this.disableView(['ideaList', 'navSidebar']);
                                    this.enableView(['ideaPanel', 'messageList']);
                                    break;
                                case 'ideaList':
                                    this.disableView(['synthesisPanel', 'navSidebar']);
                                    this.enableView(['ideaPanel', 'messageList']);
                                    break;
                            }

                        } else {
                            switch (item) {
                                case 'navSidebar':
                                    this.enableView(['ideaList', 'synthesisPanel', 'clipboard']);
                                    break;
                                case 'synthesisPanel':
                                    this.enableView(['ideaList', 'navSidebar']);
                                    this.disableView(['ideaPanel', 'messageList']);
                                    break;
                                case 'ideaList':
                                    this.disableView(['ideaPanel', 'messageList']);
                                    this.enableView(['synthesisPanel', 'navSidebar']);
                                    break;
                            }
                        }

                    },

                    disableView: function (items) {
                        items.forEach(function (item) {
                            var panel = $(".itemGroup[data-view='" + item + "']");
                            panel.removeClass('is-selected');
                            panel.addClass('is-disabled');
                        });
                    },

                    enableView: function (items) {
                        items.forEach(function (item) {
                            var panel = $(".itemGroup[data-view='" + item + "']");
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

                            groupSpecsP.done(function (groupSpecs) {
                                var groupSpec = new GroupSpec.Model(
                                    {'panels': items}, {'parse': true});
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
                var Modal = Backbone.Modal.extend({
                    template: _.template($('#tmpl-joinDiscussion').html()),
                    className: 'group-modal popin-wrapper modal-joinDiscussion',
                    cancelEl: '.close, .btn-cancel',
                    initialize: function () {
                        this.$('.bbm-modal').addClass('popin');

                    },
                    events: {
                        'click .js_subscribe': 'subscription'
                    },
                    subscription: function () {

                        if (Ctx.getDiscussionId() && Ctx.getCurrentUserId()) {

                            $.ajax({
                                type: 'POST',
                                contentType: 'application/json; charset=utf-8',
                                url: 'http://localhost:6543/data/Discussion/' + Ctx.getDiscussionId() + '/all_users/' + Ctx.getCurrentUserId() + '/local_roles',
                                data: JSON.stringify({
                                    role: 'r:participant',
                                    discussion: 'local:Discussion/' + Ctx.getDiscussionId()
                                }),
                                success: function (response, text) {

                                    console.log('success', response, text);

                                },
                                error: function (request, status, error) {

                                    console.log('error', request, status, error);

                                }

                            })

                        }
                    }
                });

                Assembl.slider.show(new Modal());

            }

        });

        return navBar;

    });