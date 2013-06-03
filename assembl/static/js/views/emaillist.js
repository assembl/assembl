define(['backbone', 'models/email', 'collections/emails', 'views/email'],
function(Backbone, Email, Emails, EmailView){

    var emails = new Emails();

    emails.reset([
        new Email({ subject: "Systhème sur l'innocation monétaire", level: 1, total: 22, hasChildren: false }),
        new Email({ subject: "L'expédition sur l'innovation monétaire", level: 1, total: 189, hasChildren: true }),
        new Email({ subject: "Présentation des participants", level: 2, total: 51, hasChildren: false }),
        new Email({ subject: "Les monnais ont plusieurs rôles", level: 2, total: 88, hasChildren: true }),
        new Email({ subject: "Un principe de résolution des dettes", level: 3, total: 70, hasChildren: false }),
        new Email({ subject: "Long text to make it not fit here and for the overflow and test the ellipsis", level: 3, total: 70, hasChildren: false })
    ]);

    var Viu = Backbone.View.extend({
        el: '#esse',

        render: function(){
            var data = [];
            emails.each(function(email){
                var emailView = new EmailView({model:email});
                data.push( emailView.render().el );
            });

            this.$el.html( data );
            if( window.vai ) vai('#esse');
            return this;
        },
        events: {
            'click li': 'onLiClick'
        },

        // Events
        onLiClick: function(){
            //alert('you just clicked on .emaillist-item');
        }
    });

    var viu = new Viu({collection: emails});
    viu.render();

});