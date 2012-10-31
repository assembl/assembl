define([
    'app',
    'models/node',
    'collections/posts',
    'views/posts/list',
    'icanhaz',
    'text!templates/index.html'
], 

function(app, Node, PostCollection, PostCollectionView, ich){

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

    return NodeView;
});