define([
    'app',
    'collections/posts',
    'views/posts/single'
], 

function(app, PostCollection, PostView){


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
            var root = $(this.el);
            var cur_ul = root;
            var parent_stack = [];
            var thread_stack = [];
            var prev = null;
            var prev_ul = null;
            var that = this;

            this.collection.each(function(post) {
                if (post.get('parent_id') != null) {
                    current_parent = parent_stack.length > 0 ? parent_stack[parent_stack.length-1]: null;
                    if (post.get('parent_id') != current_parent) {
                        if (prev == post.get('parent_id')) { // one level lower in tree
                            parent_stack.push(prev);
                            prev_ul = cur_ul;
                            thread_stack.push(cur_ul);
                            cur_ul = $('<ul></ul>');
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
                cur_ul.append(pv.render().el);
            });
            
            $('#main #content').html($(this.el));
        }
    });

    return PostCollectionView;
});