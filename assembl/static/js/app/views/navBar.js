define(function (require) {

    var Marionette = require('marionette'),
        Ctx = require('modules/context'),
        GroupSpec = require('models/groupSpec'),
        CollectionManager = require('modules/collectionManager'),
        viewsFactory = require('objects/viewsFactory'),
        $ = require('jquery'),
        _ = require('underscore');

    var navBar = Marionette.LayoutView.extend({
        template: '#tmpl-navBar',
        tagName: 'nav',
        className: 'navbar navbar-default',
        events: {
            'click .js_setLocale': 'setLocale',
            'click .js_addGroup': 'addGroup',
            'click .js_switchToExpertInterface': 'switchToExpertInterface',
            'click .js_switchToSimpleInterface': 'switchToSimpleInterface'
        },
        serializeData: function () {
            return {
                "Ctx": Ctx
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
                className: 'group-modal',
                cancelEl: '.close, .btn-cancel',
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
                        }, 1000);
                    }

                },
                scrollToRight: function () {
                    var right = $('#groupsContainer').width();
                    $('#groupsContainer').animate({
                        scrollLeft: right
                    }, 1000);
                }

            });

            var modalView = new Modal();
            $('.popin-container').html(modalView.render().el);
        }

    });

    return navBar;

});