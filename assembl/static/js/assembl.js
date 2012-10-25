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
    	url: '/api/posts'
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
        url: '/nodetest'
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

    /* Displays full list/tree of Messages, or, if option passed, only 
       displays a subset/subthread */
    var PostCollectionView = Backbone.View.extend({
        el: '#message-list',

        initialize: function(options) {
            

        },

        render : function() {
            this.posts = new PostCollection();
            this.posts.fetch({async: false});

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

        events: {
            "click .short_title" : "openThread"
        },

        render: function() {
            this.$el.html(ich.node(this.model.toJSON()));
            return this;
        },

        openThread: function() {
            thread = new PostCollection();
            start_id = model.get('extracts')[0];
            alert('WHAT');
            console.log(start_id);
            thread.fetch({
                data: {start: start_id}
            });
        }
    });

    var NodeCollectionView = Backbone.View.extend({
        el: '#TOC',

        initialize : function() {
            var that = this;
            this._nodeViews = [];
         
            this.nodes = new NodeCollection();
            this.nodes.fetch({async: false});
            
          },
         
        render : function() {
            $(this.el).empty();

            var parent_stack = [];
            var prev = null;
            var message_html = '';

            this.nodes.each(function(node){
                if (node.get('parent_id') == null) {// root
                    message_html += '<ul>';
                } else {
                    current_parent = parent_stack.length > 0 ? parent_stack[parent_stack.length-1]: null;
                    if (node.get('parent_id') == current_parent) { // same level as prev node

                    } else {
                        if (prev == node.get('parent_id')) {
                            parent_stack.push(prev);
                            message_html += '<ul>';

                        } else {
                            while (parent_stack.length != 0 && parent_stack[parent_stack.length-1] != node.get('parent_id')) {
                                parent_stack.pop();
                                message_html += '</ul>';
                            }
                        }
                    }
                }

                prev = node.id;
                message_html += ich.nodes(node.toJSON(), true);
            });
            
            $(this.el).html(message_html)
         
        }
    });

    var App = new PostCollectionView();
    App.render();
    var AppNodes = new NodeCollectionView;
    AppNodes.render();

});