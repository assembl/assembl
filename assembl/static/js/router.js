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

    return AppRouter;
});