define(['jquery', '../common/context', 'chai'], function ($, Ctx, chai) {

    // Fixtures
    var txt = '<script id="tmpl-test" type="text/template">test something</script>';
    $('body').append(txt);

    var assert = chai.assert;

    return describe('Modules Specs', function () {

        describe('Context', function () {

            it('getDiscussionSlug should return the name of discussion', function () {
                assert.isNotNull(Ctx.getDiscussionSlug());
            });

            it('getSocketUrl should return the socket url', function () {
                assert.isNotNull(Ctx.getSocketUrl());
            });

            it('getDiscussionId should return the discussion id', function () {
                assert.isNotNull(Ctx.getDiscussionId());
            });

            it('getCurrentUserId should return the user id', function () {
                assert.isNotNull(Ctx.getCurrentUserId());
            });

            it('getCurrentUser should not return the user', function () {

                //console.debug(Ctx.getCurrentUser())

                //assert.isNotNull(Ctx.getCurrentUser());
            });

            it('loadTemplate must load a template by id', function () {
                assert.isFunction(Ctx.loadTemplate('test'));
            });

        })

    });

});
