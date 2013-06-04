define(['backbone', 'underscore', 'jquery', 'app'],
function(Backbone, _, $, app){

    return Backbone.View.extend({
        tagName: 'li',
        template: app.loadTemplate('email'),
        events: {
            'click .fixedcounter': 'sim',
            'click [type=checkbox]': 'onCheckboxClick'
        },
        render: function(){
            var data = this.model.toJSON();
            this.el.setAttribute('data-emaillist-level', data.level);
            this.$el.addClass('emaillist-item');

            if( data.level > 1 ){
                this.$el.addClass('is-hidden');                
            }

            if( data.hasChildren ){
                this.$el.addClass('emaillist-item--toplevel');
            }

            this.$el.html(this.template(data));
            return this;
        },

        // Events
        sim: function(){
            alert('You just click on .fixedcounter');
        },
        onCheckboxClick: function(ev){
            var chk = ev.currentTarget;
            alert( chk );

            if( chk.checked ){
                this.$el.addClass('is-selected');
            } else {
                this.$el.removeClass('is-selected');
            }
        }
    });

});
