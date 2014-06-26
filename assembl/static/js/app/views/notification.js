define(['app','backbone','backboneModal'], function(app, Backbone, backboneModal){

   var Notification = Backbone.View.extend({

       template: app.loadTemplate('notification'),

       el:'#notification',

       initialize: function(){

           this.render();
       },

       events: {
         'click .close': 'close',
         'click .openSession':'openSession'
       },

       openSession: function(e, options){
           var view;

           var model = new Backbone.Model();
           model.set("id","local:Widget/2");

           if(options)
             model.set("view", options);
           else
             model.set("view","index");

           var Modal = Backbone.Modal.extend({
               template: app.loadTemplate('sessionModal'),
               model:model
           });

           var modalView = new Modal();
           $('.modal').html(modalView.render().el);
       },

       close: function(){
           if(window.localStorage){
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