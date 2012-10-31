define([
	'app',
	'models/node'
], 

	function(app, Node){

	var NodeCollection = Backbone.Collection.extend({
	    model: Node,
	    url: '/nodetest'
	});

	return NodeCollection;

});