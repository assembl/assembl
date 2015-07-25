define(['jasmine', 'underscore', 'views/ideaList'], function(jasmine, _, IdeaList) {

  function getView() {
    var v = new IdeaList();
    v.ideas = new Backbone.Collection();

    setFixtures('<ul id="fix-ideaList"></ul>');
    $('#fix-ideaList').append(v.render().el);

    return v;
  }

  return describe('IdeaList view', function() {

    var view;

    beforeEach(function() {
      view = getView();
    });

    it('should have the Collection', function() {
      expect(view.ideas).not.toBeUndefined();
    });

    it('should have the #idea-list element', function() {
      var list = view.$('.idealist');

      expect(list.length).toBe(1);
    });

  });

});
