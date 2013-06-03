define(['backbone', 'underscore', 'jquery'], function(B, _, $){

    return B.View.extend({
        tagName: 'li',

        template: _.template( $('#tmpl').html() ),
        events: {
            'click .fixedcounter': 'sim'
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
        }
    });

});
