define(function(require){

   var Backbone = require('backbone'),
  backboneModal = require('backboneModal'),
notificationTpl = require('text!/static/templates/notification.html'),
       modalTpl = require('text!/static/templates/session-modal.html');


   var Notification = Backbone.View.extend({
       template: _.template(notificationTpl),

       el:'#notification',

       initialize: function(){
          this.render();
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
               template: _.template(modalTpl),
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
           $('#main .panelarea').css('top', '6em');
       },

       render: function(){
           if(!window.localStorage.getItem('showNotification')){
               $('#main .panelarea').css('top', '9em');
               this.$el.html(this.template);
           }
       }

   });

   return Notification;

});