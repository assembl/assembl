define([
  'app',
  'views/posts/list',
  'views/nodes/list'
], function(app, PostCollectionView, NodeCollectionView){
    
    var AppRouter = Backbone.Router.extend({
        routes: {
            ""          : "home",
            "toc"       : "toc"
        },

        home: function() {
            $('aside.menu').show('slide', {direction: "left"});

            this.messageView = new PostCollectionView();
            this.messageView.render();
            this.treeView = new NodeCollectionView({sortable: false, el: $('aside')});
            this.treeView.render();
        },

        toc: function() {
            $('aside.menu').hide('slide', {direction: "left"});

            var TreeView = new NodeCollectionView({sortable: true, el: $('.page-content')});
            TreeView.render();
        }
    });

    var initialize = function() {
        var app_router = new AppRouter();
        Backbone.history.start({pushState: true});

        $(document).on("click", "a[href^='/']", function(event) {
            if (!event.altKey && !event.ctrlKey && !event.metaKey && !event.shiftKey) {
                event.preventDefault();
                var url = $(event.currentTarget).attr("href").replace(/^\//, "");
                app_router.navigate(url, { trigger: true });
            }
        });
    }

    //return AppRouter;

    return {
        initialize: initialize
    };
});