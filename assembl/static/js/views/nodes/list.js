define([
    'app',
    'jqueryui',
    'collections/nodes',
    'views/nodes/single',
    'text!templates/nodes/list.html'
],

function(app, sortable, NodeCollection, NodeView){

    var NodeCollectionView = Backbone.View.extend({

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
            $(this.el).html(root);
        }
    });

    return NodeCollectionView;
});