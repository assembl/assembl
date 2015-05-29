

var $ = require('../shims/jquery.js'),
    Ctx = require('../common/context.js'),
    expect = require('chai').expect;

// Fixtures
var txt = '<script id="tmpl-test" type="text/template">test something</script>';
$('body').append(txt);

return describe('Modules Specs', function () {

    describe('Context', function () {

        it('getDiscussionSlug should return the name of discussion', function () {
            expect(Ctx.getDiscussionSlug()).not.to.be.null;
            expect(Ctx.getDiscussionSlug()).to.be.a('string');
        });

        it('getSocketUrl should return the socket url', function () {
            expect(Ctx.getSocketUrl()).not.to.be.null;
            expect(Ctx.getSocketUrl()).to.be.a('string');
        });

        it('getDiscussionId should return the discussion id', function () {
            expect(Ctx.getDiscussionId()).not.to.be.null;
            expect(Ctx.getDiscussionId()).to.be.a('string');
        });

        it('getCurrentUserId should return the user id', function () {
            expect(Ctx.getCurrentUserId()).not.to.be.null;
            expect(Ctx.getCurrentUserId()).to.be.a('string');
        });

        it('getCurrentUser should not return the user', function () {
            //assert.isNotNull(Ctx.getCurrentUser());
        });

        it('loadTemplate should be a function', function () {
            expect(Ctx.loadTemplate('test')).to.be.a('function');
        });

    })

});
