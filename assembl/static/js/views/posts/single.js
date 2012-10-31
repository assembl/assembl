define([
    'app',
    'icanhaz',
    'models/post'
], 

function(app, ich, Post){

    var PostView = Backbone.View.extend({
        //el: '#hello',
        tagName : 'li',
        className : 'post',

        render: function() {
            this.$el.html(ich.message(this.model.toJSON()));
            return this;
        }
    });

    return PostView;

});