define(function(require){

   var Marionette = require('marionette'),
    backboneModal = require('backboneModal'),
                $ = require('jquery');

   var Notification = Marionette.LayoutView.extend({
       template: '#tmpl-notification',
       initialize: function(){

       },
       events: {
         'click .close': 'close',
         'click .openSession':'openSession'
       },

       openSession: function(e, options){

           var model = new Backbone.Model();
           model.set("id","local:Widget/2");

           if(options)
             model.set("view", options.view);
           else
             model.set("view","index");

           var Modal = Backbone.Modal.extend({
               template: _.template($('#tmpl-session-modal').html()),
               model:model
           });

           var modalView = new Modal();
           $('.modal').html(modalView.render().el);
       },

       close: function(){
           if(window.localStorage){
              //benoitg:  Not good, this will close every notification for every discussion!
              // TODO: should be id idea
              window.localStorage.setItem('showNotification', false);
           }
           this.remove();
           this.unbind();
           $('#wrapper #panelarea').animate({
               top:'36px'
           }, 600);
       }
   });

   return Notification;

});