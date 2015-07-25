define(['jasmine', 'underscore', 'app', 'views/idea', 'models/idea'],
function(jasmine, _, app, IdeaView, Idea) {

  var view,
      fixIdea;

  function getView() {
    var model = new Idea.Model({
      shortTitle: '',
      longTitle: '',
      numChildIdea: 1,
      level: 1,
      featured: false,
      inNextSynthesis: false,
      hasCheckbox: true,
      hasOptions: false
    });

    model.set('id', app.getCurrentTime());

    var collection = new Idea.Collection({
      model: model
    });

    collection.add(model);

    var v = new IdeaView({model: model});

    //
    setFixtures('<div id="fix-idea"></div>');
    fixIdea = $('#fix-idea');
    fixIdea.append(v.render().el);
    return v;
  }

  return describe('Idea view', function() {

    beforeEach(function() {
      view = getView();
    });

    it('should have the arrow if children.length > 0', function() {
      expect(view.el).not.toContain('span.idealist-arrow');
      view.model.addChild(new Idea.Model({ id: 'sim' }));
      fixIdea.empty().append(view.render().el);

      expect(view.el).toContain('span.idealist-arrow');
    });

    it('should set the isSelect flag to true when clicked', function() {
      view.$('.idealist-title').trigger('click');
      expect(view.el).toHaveClass('is-selected');
    });

    it('should set the state to .is-dragover when there is a segment over', function() {
      app.draggedIdea = new Backbone.Model({ 'some': 'thing' });

      var body = view.$('.idealist-body');
      body.trigger('dragover');

      expect(view.$el.hasClass('is-dragover')).toBeTruthy();

      body.trigger('dragleave');
      expect(view.$el.hasClass('is-dragover')).toBeFalsy();
    });

    it('should set the state to .is-dragover-below when there is a segment over in the below area', function() {
      app._draggedSegment = new Backbone.Model({ 'some': 'thing' });
      var dropzone = view.$('.idealist-dropzone');
      dropzone.trigger('dragover');

      expect(view.$el.hasClass('is-dragover-below')).toBeTruthy();

      dropzone.trigger('dragleave');
      expect(view.$el.hasClass('is-dragover-below')).toBeFalsy();
    });

    it('should set the app.draggedIdea when dragstart', function() {
      view.model = new Backbone.Model({ shortTitle: 'something'});

      var body = view.$('.idealist-body');
      body.trigger('dragstart');

      expect(app.draggedIdea.get('shortTitle')).toBe('something');
    });

    it('should set the state to .is-dragover-above when there is an idea over the above area', function() {
      app.draggedIdea = new Backbone.Model({ 'some': 'thing' });
      var aboveDropZone = view.$('.idealist-abovedropzone');
      aboveDropZone.trigger('dragover');

      expect(view.$el.hasClass('is-dragover-above')).toBeTruthy();
      aboveDropZone.trigger('dragleave');
      expect(view.$el.hasClass('is-dragover-above')).toBeFalsy();
    });

  });

});
