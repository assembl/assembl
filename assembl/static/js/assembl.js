$(function(){

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

	var PostCollection = Backbone.Collection.extend({
    	// Reference to this collection's model.
    	model: Post,
    	url: '/api/posts?start=17&levels=6'
    });

    /* A node of the full debate summary tree */
    /* Can also be a ToC node or a Synthesis node */
    var Node = Backbone.Model.extend({
        defaults: function() {
            return {
                title: null,
                definition: null,
                extracts: [], // Contains Open Annotations - to be determined how to model
                children: [],
                parent: null,
                featured: false, // Potentially unnecessary - if this node will appear in the short, algorithmically-generated TOC
                isSynthesis: false // If this Node is being used to create a synthesis
            }
        }
    });

    var NodeCollection = Backbone.Collection.extend({
        model: Node,
        url: ''
    });

    /* For now we are using our own Annotation model that is
        somewhat similar to OpenAnnotation except 
        instead of storing prefix and postfix, store start and end points e.g. 
            * coordinates
            * timestamps
            * characters
    */
    var Annotation = Backbone.Model.extend({
        defaults: function() {
            return {
                creator: null, // user id of the annotation creator
                created: null, // date of creation
                body: null, // body of the annotation
                annotates: null, // id of message this annotation is taken from
                start: null, // start parameter
                end: null // end parameter
            }
        }
    })

    var PostView = Backbone.View.extend({
        //el: '#hello',
        tagName : 'li',
        className : 'post',

    	//initialize: function(options) {
            // instantiate a password collection
            //this.model = new Post();
            //this.model.fetch({async: false}); //change back to true later, just for debugging

            //this.collection.bind('all', this.render, this);
            //this.collection.fetch();
        //},
        

        render: function() {
            this.$el.html(ich.messages(this.model.toJSON()));
            return this;
        }
    });

    var UpdatingPostView = PostView.extend({
        initialize : function(options) {
            this.render = _.bind(this.render, this); 
            
            this.model.bind('change:body', this.render);
        }
    });

    var PostCollectionView = Backbone.View.extend({
        el: '#message-list',

        initialize: function(options) {
            this.posts = new PostCollection();
            this.posts.fetch({async: false});

            //var that = this;
            //this._postViews = [];
            //this.posts.each(function(post) {
            //    that._postViews.push(new UpdatingPostView({
            //        model : post
            //    }));
            //});
        },

        render : function() {
            //var that = this;
            // Clear out this element.
            $(this.el).empty();

            var parent_stack = [];
            var prev = null;
            var message_html = '';

            this.posts.each(function(post){
                if (post.get('parent_id') == null) {// root
                    message_html += '<ul>';
                } else {
                    current_parent = parent_stack.length > 0 ? parent_stack[parent_stack.length-1]: null;
                    if (post.get('parent_id') == current_parent) { // same level as prev post

                    } else {
                        if (prev == post.get('parent_id')) {
                            parent_stack.push(prev);
                            message_html += '<ul>';

                        } else {
                            while (parent_stack.length != 0 && parent_stack[parent_stack.length-1] != post.get('parent_id')) {
                                parent_stack.pop();
                                message_html += '</ul>';
                            }
                        }
                    }
                }

                prev = post.id;
                message_html += ich.messages(post.toJSON(), true);
            });
            
            $(this.el).html(message_html)
         
            // Render each sub-view and append it to the parent view's element.
            //_(this._postViews).each(function(pv) {
              //$(that.el).append(pv.render().el);
            //});
        }
    });

    var NodeView = Backbone.View.extend({
        tagName : 'li',
        className : 'node',

        render: function() {
            this.$el.html(ich.node(this.model.toJSON()));
            return this;
        }
    });

    var NodeCollectionView = Backbone.View.extend({
        initialize : function() {
            var that = this;
            this._nodeViews = [];
         
            this.collection.each(function(node) {
              that._nodeViews.push(new NodeView({
                model : node,
                tagName : 'li'
              }));
            });
          },
         
          render : function() {
            var that = this;
            // Clear out this element.
            $(this.el).empty();
         
            // Render each sub-view and append it to the parent view's element.
            _(this._nodeViews).each(function(nv) {
              $(that.el).append(nv.render().el);
            });
        }
    });

    var App = new PostCollectionView;
    App.render();

});