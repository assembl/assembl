define([
	'app',
	'models/post'
], 

function(app, Post){

	var PostCollection = Backbone.Collection.extend({
		// Reference to this collection's model.
		model: Post,
		url: '/api/posts?start=17'
	});

	return PostCollection;

});