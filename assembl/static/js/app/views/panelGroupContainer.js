define(function(require){

   var Marionette = require('marionette'),
    backboneModal = require('backboneModal'),
                $ = require('jquery');

   var panelGroupContainer = Marionette.LayoutView.extend({
       template: "#tmpl-layout-groupContainer",

       regions: {
          content: "#group-content"
       },

       events: {
           'click .add-group':'addGroup'
       },

       addGroup: function(){

           var Modal = Backbone.Modal.extend({
               template: _.template($('#tmpl-create-group').html()),
               cancelEl:'.bbm-button',
               initialize: function(){
                   this.$el.addClass('group-modal');
               },

               events:{
                   'click .itemGroup a':'addToGroup'
               },

               addToGroup: function(e){

                  var type = $(e.target).attr('data-item');


                  console.log('add to group', type)
               }
           });

           var modalView = new Modal();

           $('.modal').html(modalView.render().el);

       }
   });

   return panelGroupContainer;

});