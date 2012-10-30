$(function(){

    var AppRouter = Backbone.Router.extend({
        routes: {
            ""          : "home",
            "toc"       : "toc"
        },

        initialize: function() {

        },

        home: function() {
            $('#sidebar').slideDown()
            $('ul.nav li').removeClass('active')
            $('#home-nav').addClass('active')
            this.messageView = new PostCollectionView();
            this.messageView.render();
            this.treeView = new NodeCollectionView({sortable: false});
            this.treeView.render();
        },

        toc: function() {
            $('#sidebar').slideUp();
            $('ul.nav li').removeClass('active')
            $('#toc-nav').addClass('active')
            var TreeView = new NodeCollectionView({sortable: true});
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
    	url: '/api/posts?start=17'
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

        render: function() {
            this.$el.html(ich.message(this.model.toJSON()));
            return this;
        }
    });

    /* Displays full list/tree of Messages, or, if option passed, only 
       displays a subset/subthread */
    var PostCollectionView = Backbone.View.extend({
        tagName : 'ul',

        initialize: function(options) {
            if (!this.collection) {
                this.collection = new PostCollection();
                this.collection.fetch({ async : false }); // change this later
            }
        },

        render : function() {
            $(this.el).empty();
            var root = $(this.el)
            var cur_ul = root;
            var parent_stack = [];
            var thread_stack = [];
            var prev = null;
            var prev_ul = null
            var that = this;

            this.collection.each(function(post) {
                if (post.get('parent_id') != null) {
                    current_parent = parent_stack.length > 0 ? parent_stack[parent_stack.length-1]: null;
                    if (post.get('parent_id') != current_parent) {
                        if (prev == post.get('parent_id')) { // one level lower in tree
                            parent_stack.push(prev);
                            prev_ul = cur_ul;
                            thread_stack.push(cur_ul);
                            cur_ul = $('<ul></ul>')
                            prev_ul.children('li').last().append(cur_ul);

                        } else { // one level higher in tree
                            while (parent_stack.length != 0 && parent_stack[parent_stack.length-1] != post.get('parent_id')) {
                                parent_stack.pop();
                                cur_ul = thread_stack.pop();                            }
                        }
                    }
                }

                prev = post.id;
                pv = new PostView({model: post});
                cur_ul.append(pv.render().el)
            });
            
            $('#main #content').html($(this.el));
        }
    });

    var NodeView = Backbone.View.extend({
        tagName : 'li',
        className : 'node',

        initialize: function(options) {
            this.sortable = this.options.sortable
        },

        events: {
            "click .short_title" : "openThread"
        },

        render: function() {
            if (this.sortable) {
                $(this.el).html(ich.node(this.model.toJSON()))
            } else {
                $(this.el).html(ich.link_node(this.model.toJSON()))
            }

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

        initialize : function(options) {
            var that = this;
            this._nodeViews = [];
         
            this.nodes = new NodeCollection();
            this.nodes.fetch({async: false});
            this.sortable = this.options.sortable
          },
         
        render : function() {
            $(this.el).empty();
            var root = '';
            if (this.sortable) {
                root = $('<ul class="sortable"></ul>').sortable({connectWith: ".sortable", items :  "li"})
            } else {
                root = $('<ul></ul>')
            }
            var cur_ul = root;
            var parent_stack = [];
            var thread_stack = [];
            var prev = null;
            var prev_ul = null
            var message_html = '';
            var that = this;

            this.nodes.each(function(node) {
                if (node.get('parent_id') != null) {
                    current_parent = parent_stack.length > 0 ? parent_stack[parent_stack.length-1]: null;
                    if (node.get('parent_id') != current_parent) {
                        if (prev == node.get('parent_id')) { // one level lower in tree
                            parent_stack.push(prev);
                            prev_ul = cur_ul;
                            thread_stack.push(cur_ul);
                            if (that.sortable) {
                                cur_ul = $('<ul class="sortable"></ul>').sortable({connectWith: ".sortable", items :  "li"});
                            } else {
                                cur_ul = $('<ul></ul>')
                            }
                            prev_ul.children('li').last().append(cur_ul);

                        } else { // one level higher in tree
                            while (parent_stack.length != 0 && parent_stack[parent_stack.length-1] != node.get('parent_id')) {
                                parent_stack.pop();
                                cur_ul = thread_stack.pop();                            }
                        }
                    }
                }
                prev = node.id;
                nv = new NodeView({sortable: that.sortable, model: node});
                cur_ul.append(nv.render().el)
            });
            if (this.sortable) {
                $('#main #content').html(root);
            } else {
                $('#sidebar').html(root);
            }
        }
    });

    app = new AppRouter();
    Backbone.history.start({pushState: true});

    $(document).on("click", "a[href^='/']", function(event) {
        if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
            event.preventDefault();
            var url = $(event.currentTarget).attr("href").replace(/^\//, "");
            app.navigate(url, { trigger: true });
        }
    });
});


