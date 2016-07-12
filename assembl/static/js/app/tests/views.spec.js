/**
 * 
 * @module app.tests.views.spec
 */

var expect = require('chai').expect,
    ViewsFactory = require('../objects/viewsFactory.js'),
    CollectionManager = require('../common/collectionManager.js'),
    GroupState = require('../models/groupState.js'),
    messageList = require('../views/messageList.js'),
    groupContainer = require('../views/groups/groupContainer.js'),
    $ = require('jquery'),
    mockServer = require('./mock_server.js');

var currentView;
var collectionManager = new CollectionManager();

describe('Views Specs', function() {

  /*
  describe('Navbar', function() {
    it('Views should exist', function() {
      currentView.ui.joinDiscussion.click()
      expect($('#slider')).to.have.html('<div class="generic-modal popin-wrapper modal-joinDiscussion bbm-wrapper"></div>');
    });
  });
  */

  describe('Message list', function() {
    beforeEach(function(done) {
      mockServer.setupMockAjax();
      collectionManager.getGroupSpecsCollectionPromise(
        ViewsFactory, undefined, true).then(function(groupSpecs) {
        currentView = new groupContainer({collection: undefined});
        $('#test_view').html(currentView.render().el);
        done();
      }).catch(function(err) {
          done(err);
      });
    });

    afterEach(function() {
      $('#test_view').html("")
      mockServer.tearDownMockAjax();
    });

    it('View should exist', function() {
      console.log(currentView.el);
      expect(currentView.el).to.be.ok;
    });
  });
});
