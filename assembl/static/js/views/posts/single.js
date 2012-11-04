define([
    'underscore',
    'app',
    'models/post',
    'text!templates/posts/single.html'
], 

function(_, app, Post, tpl){

    var PostView = Backbone.View.extend({
        //el: '#hello',
        tagName : 'li',
        className : 'post',

        initialize: function() {
            this.template = _.template(tpl)
        },

        render: function() {
            templ = this.template({post: this.model.toJSON()});
            this.$el.html(templ);

            return this;
        }
    });

    return PostView;

});