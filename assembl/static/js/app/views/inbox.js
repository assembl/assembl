define(['backbone', 'models/inbox', 'views/email', 'app'],
function(Backbone, InboxModel, EmailView, app){
    'use strict';

    var InboxView = Backbone.View.extend({
        el: '#inbox',
        model: new InboxModel(),
        template: app.loadTemplate('inbox'),

        initialize: function(obj){
            this.collection = obj.collection;
            this.listenTo(this.collection, 'reset', this.render);
        },

        render: function(){
            app.trigger('render');

            var emailList = document.createDocumentFragment();

            this.collection.each(function(email){
                var emailView = new EmailView({model:email});
                emailList.appendChild(emailView.render().el);
            });

            this.$el.html(this.template());
            this.$('#inbox-emaillist').append( emailList );
            return this;
        }
    });


    return InboxView;
});
