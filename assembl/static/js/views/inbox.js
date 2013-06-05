define(['backbone', 'models/inbox', 'views/email', 'app'],
function(Backbone, InboxModel, EmailView, app){
    'use strict';

    var InboxView = Backbone.View.extend({
        el: '#inbox',
        model: new InboxModel(),
        template: app.loadTemplate('inbox'),

        initialize: function(){
            app.emails.on('reset', this.render, this);
            app.emails.fetch({reset:true});
        },

        render: function(){
            var emailList = document.createDocumentFragment();

            app.emails.each(function(email){
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
