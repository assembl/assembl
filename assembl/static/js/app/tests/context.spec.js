define(['jasmine', 'jquery', '../common/context'], function (jasmine, $, Ctx) {

    // Fixtures
    var txt = '<script id="tmpl-test" type="text/template">test something</script>';
    $('body').append(txt);

    return describe('Modules Specs', function () {

        describe('Context', function () {

            it('getDiscussionSlug should return the name of discussion', function () {
                expect(Ctx.getDiscussionSlug()).not.toBe(null);
            });

            it('getSocketUrl should return the socket url', function () {
                expect(Ctx.getSocketUrl()).not.toBe(null);
            });

            it('getDiscussionId should return the discussion id', function () {
                expect(Ctx.getDiscussionId()).not.toBe(null);
            });

            it('getCurrentUserId should return the user id', function () {
                expect(Ctx.getCurrentUserId()).not.toBe(null);
            });

            it('getCurrentUser should not return the user', function () {
                expect(Ctx.getCurrentUser()).not.toBe(null);
            });

            it('loadTemplate must load a template by id', function () {
                expect(typeof Ctx.loadTemplate('test')).toBe('function');
            });

        })

    });

});
