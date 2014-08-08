define(function(require){

    var Marionette = require('marionette'),
               Ctx = require('modules/context'),
         GroupSpec = require('models/groupSpec'),
        CollectionManager = require('modules/collectionManager');

    var navBar = Marionette.LayoutView.extend({
        template:'#tmpl-navBar',
        tagName:'nav',
        className:'navbar navbar-default',
        events: {
           'click .lang': 'setLocale',
           'click .add-group': 'addGroup',
           'click .js_switchToExpertInterface': 'switchToExpertInterface',
           'click .js_switchToSimpleInterface': 'switchToSimpleInterface',
        },
        serializeData: function(){
          return {
            "Ctx": Ctx
          };
        },
          
        setLocale: function(e){
            var lang = $(e.target).attr('data-locale');
            Ctx.setLocale(lang);
        },
        switchToExpertInterface: function(e){
          Ctx.setInterfaceType(Ctx.InterfaceTypes.EXPERT);
        },
        switchToSimpleInterface: function(e){
          Ctx.setInterfaceType(Ctx.InterfaceTypes.SIMPLE);
        },
        addGroup: function(){

            var collectionManager = new CollectionManager();
            var groupSpecsP = collectionManager.getGroupSpecsCollectionPromise();

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
                    var items = [],
                        that = this;

                    $('.itemGroup.is-selected').each(function(){
                        var item = $(this).children('a').attr('data-item');
                        items.push({type:item});
                    });

                    groupSpecsP.done(function(groupSpecs){
                        var groupSpec = new GroupSpec.Model(
                            {'panels': items}, {'parse': true});
                        groupSpecs.add(groupSpec);
                    });

                    setTimeout(function(){
                        that.scrollToRight();

                        that.$el.unbind();
                        that.$el.remove();
                    }, 1000);

                },
                scrollToRight: function(){
                    var right = $('#groupsContainer').width();
                    $('#groupsContainer').animate({ scrollLeft: right}, 1000);
                }
            });

            var modalView = new Modal();

            $('.modal').html(modalView.render().el);
        }

    });

    return navBar;

});