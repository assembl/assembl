define(function(require){

    var Marionette = require('marionette'),
               Ctx = require('modules/context'),
           Storage = require('objects/storage');

    var navBar = Marionette.LayoutView.extend({
        template:'#tmpl-navBar',
        tagName:'nav',
        className:'navbar navbar-default',
        events: {
           'click .lang': 'setLocale',
           'click .add-group':'addGroup'
        },
        setLocale: function(e){
            var lang = $(e.target).attr('data-locale');
            Ctx.setLocale(lang);
        },
        addGroup: function(){
            var Modal = Backbone.Modal.extend({
                template: _.template($('#tmpl-create-group').html()),
                className:'group-modal',
                cancelEl:'.btn-cancel',
                events:{
                    'click .js_selectItemGroup':'selectItemGroup',
                    'click .js_createGroup':'createGroup'
                },
                selectItemGroup: function(e){
                    var elm  = $(e.target).parent();

                    if(elm.hasClass('ideas')){
                        if($('.itemGroup.synthesis').hasClass('is-selected')){
                            $('.itemGroup.synthesis').removeClass('is-selected');
                        }
                        elm.addClass('is-selected');

                    } else if(elm.hasClass('synthesis')){
                        if($('.itemGroup.ideas').hasClass('is-selected')){
                            $('.itemGroup.ideas').removeClass('is-selected')
                        }
                        elm.addClass('is-selected');

                    } else {
                        if(elm.hasClass('is-selected')){
                            elm.removeClass('is-selected');
                        } else {
                            elm.addClass('is-selected');
                        }
                    }
                },
                createGroup: function(){
                    var items = [];

                    $('.itemGroup.is-selected').each(function(){
                        var item = $(this).children('a').attr('data-item');
                        items.push(item);
                    });

                    Storage.createGroupItem(items);

                    this.$el.unbind();
                    this.$el.remove();
                }
            });

            var modalView = new Modal();

            $('.modal').html(modalView.render().el);
        }

    });

    return navBar;

});