define([
    'app'
], 

function(app){

    var Post = Backbone.Model.extend({
    	// Default attributes for the todo item.
        defaults: function() {
          return {
            id: null,
            date: null,
            author: null,
            subject: null,
            body: null,
            parent: null,
            children: null,
            read: false,
            caught: false,
            synthesis: false
          };
        },

        url : function() {
            return this.id ? '/api/posts/' + this.id : '/api/posts'; 
        }
    });

    return Post;

});