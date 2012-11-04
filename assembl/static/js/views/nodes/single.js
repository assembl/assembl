define([
    'underscore',
    'app',
    'models/node',
    'collections/posts',
    'views/posts/list',
    'text!templates/nodes/single.html',
    'text!templates/nodes/link.html'
], 

function(_, app, Node, PostCollection, PostCollectionView, tpl_single, tpl_link){

    var NodeView = Backbone.View.extend({
        tagName : 'li',
        className : 'node',

        initialize: function(options) {
            this.sortable = this.options.sortable
            this.template_single = _.template(tpl_single);
            this.template_link = _.template(tpl_link)
        },

        events: {
            "click .short_title" : "openThread"
        },

        render: function() {
            
            if (this.sortable) {
                tmpl = this.template_single({ node: this.model.toJSON()});
            } else {
                tmpl = this.template_link({ node: this.model.toJSON()});
            }
            $(this.el).html(tmpl);

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