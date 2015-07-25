define(['jasmine', 'underscore', 'models/idea'], function(jasmine, _, Idea) {

  function getNewModel() {
    var m = new Idea.Model();
    m.set('id', m.cid);
    return m;
  }

  return describe('Idea Model', function() {

    var idea,
        collection;

    beforeEach(function() {
      idea = getNewModel();

      collection = new Idea.Collection();
      collection.add(idea);
    });

    it('should have the Model', function() {
      expect(Idea.Model).not.toBeUndefined();
    });

    it('must have the default attributes', function() {

      // The default attributes
      var attrs = {
        shortTitle: 'New idea',
        longTitle: 'Please add a description',
        numChildIdea: 0,
        hasCheckbox: true,
        featured: false,
        active: false,
        parentId: null
      };

      for (var key in attrs)if (attrs.hasOwnProperty(key)) {
        expect(idea.get(key)).toBe(attrs[key]);
      }
    });

    it('should return all children', function() {
      var children = idea.getChildren();
      expect(children.length).toBe(0);
    });

    it('should add a child', function() {
      var theChild = getNewModel();
      idea.addChild(theChild);

      var children = idea.getChildren();
      expect(children.length).toBe(1);

      expect(children[0].get('parentId')).toBe(idea.get('id'));
    });

    it('should return the parent', function() {
      var theChild = getNewModel();
      idea.addChild(theChild);

      var parent = theChild.getParent();
      expect(parent.cid).toBe(idea.cid);
    });

    it('should check to see if the idea is decendent of', function() {
      var theGrandchild = getNewModel();
      var theChild = getNewModel();

      idea.addChild(theChild);
      theChild.addChild(theGrandchild);

      var result = theGrandchild.isDescendantOf(idea);

      expect(result).toBeTruthy();
    });

    xit('should add a segment', function() {
      expect(idea.attributes.segments.length).toBe(0);
      idea.addSegment({ title: 'something'});

      expect(idea.attributes.segments.length).toBe(1);
    });

  });

});
