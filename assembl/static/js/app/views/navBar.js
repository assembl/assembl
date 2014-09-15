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
                    'click .js_selectItem': 'selectItemGroup',
                    'click .js_createGroup': 'createGroup'
                },
                selectItemGroup: function (e) {
                    var elm = $(e.target);

                    if (elm.is(':checked')) {
                        elm.parent().addClass('is-selected');
                        this.setStateItem(elm, true);
                    } else {
                        elm.parent().removeClass('is-selected');
                        this.setStateItem(elm, false);
                    }
                },

                setStateItem: function (elm, state) {
                    var item = elm.attr('data-item');

                    if (item === 'simpleView') {
                        if (state) {
                            this.disableItem(
                                ['navSidebar', 'ideaList', 'synthesisPanel', 'ideaPanel', 'messageList', 'clipboard'],
                                true);

                        } else {
                            this.disableItem(['navSidebar', 'ideaList', 'synthesisPanel', 'clipboard'], false);
                            this.disableItem(['ideaPanel', 'messageList'], true);
                        }
                    } else if (item === 'ideaList' || item === 'synthesisPanel') {

                        if (state) {
                            this.disableItem(['ideaPanel', 'messageList'], false);
                        } else {
                            this.disableItem(['ideaPanel', 'messageList'], true);
                        }
                    }

                },

                disableItem: function (item, boolean) {
                    if (boolean) {
                        _.each(item, function (i) {
                            $('.item-' + i).addClass('is-disabled');
                            $('.item-' + i).removeClass('is-selected');
                        })
                    } else {
                        _.each(item, function (i) {
                            $('.item-' + i).removeClass('is-disabled');
                        })
                    }
                },

                createGroup: function () {
                    var items = [],
                        that = this;

                    if ($('.itemGroup').hasClass('is-selected')) {

                        $('.itemGroup.is-selected').each(function () {
                            var item = $(this).children('a').attr('data-item');
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