$(function(){

    var AppRouter = Backbone.Router.extend({
        routes: {
            ""          : "home",
            "toc"       : "toc"
        },

        initialize: function() {

        },

        home: function() {
            this.messageView = new PostCollectionView();
            this.messageView.render();
            this.treeView = new NodeCollectionView();
            this.treeView.render();
        },

        toc: function() {
            var TreeView = new NodeCollectionView();
            TreeView.render();
        }
    });

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
            if (!this.collection) {
                this.collection = new PostCollection();
                this.collection.fetch({ async : false }); // change this later
            }
        },

        render : function() {
            // Clear out this element.
            $(this.el).empty();

            var parent_stack = [];
            var prev = null;
            var message_html = '';

            this.collection.each(function(post){
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
                body = post.get('body');
                post.set({short_body: body.substring(0, 80)});
                message_html += ich.message(post.toJSON(), true);
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
        className : 'node droppable',

        events: {
            "click .short_title" : "openThread"
        },
        initialize: function() {
            /*$(this.el).droppable({
                greedy: true,
                over: function(e, ui) {
                    //$(this).css({"background-color": "#ccc"})
                },
                out: function(e, ui) {
                    //$(this).css({"background-color": "#fff"})
                },
                drop: function(event, ui) {
                    console.log(ui.draggable);
                    //ui.draggable.appendTo(this)
                    $(this).append(ui.draggable)
                    console.log(this)
                    //$(this).css({"background-color" : "red"});
                }
            });*/
        },
        render: function() {
            $(this.el).html(ich.node(this.model.toJSON()))
            //this.el = ich.node(this.model.toJSON())
            //return ich.node(this.model.toJSON())
            return this;
        },

        openThread: function(e) {
            e.stopPropagation(); // if we don't do this, this callback gets called on every single node
            e.preventDefault(); // stops browser from loading "#"

            thread = new PostCollection();
            start_id = this.model.get('extracts')[0];
            thread.fetch({
                data: {start: start_id},
                success: function(data) {
                    pcv = new PostCollectionView({collection: thread});
                    pcv.render();
                }
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

            var root = $('<ul class="draggable"></ul>').sortable({connectWith: ".draggable", items :  "li"})//.draggable();
            var cur_ul = root;
            var parent_stack = [];
            var thread_stack = [];
            var prev = null;
            var prev_ul = null
            var message_html = '';

            this.nodes.each(function(node) {
                if (node.get('parent_id') != null) {
                    current_parent = parent_stack.length > 0 ? parent_stack[parent_stack.length-1]: null;
                    if (node.get('parent_id') != current_parent) {
                        if (prev == node.get('parent_id')) { // one level lower in tree
                            parent_stack.push(prev);
                            prev_ul = cur_ul;
                            thread_stack.push(cur_ul);
                            cur_ul = $('<ul class="draggable"></ul>').sortable({connectWith: ".draggable", items :  "li"});//.draggable();
                            prev_ul.children('li').last().append(cur_ul);

                        } else { // one level higher in tree
                            while (parent_stack.length != 0 && parent_stack[parent_stack.length-1] != node.get('parent_id')) {
                                parent_stack.pop();
                                cur_ul = thread_stack.pop();                            }
                        }
                    }
                }
                prev = node.id;
                nv = new NodeView({model: node});
                cur_ul.append(nv.render().el)
            });

            $(this.el).html(root);
        }
    });

    app = new AppRouter();
    Backbone.history.start();
});


