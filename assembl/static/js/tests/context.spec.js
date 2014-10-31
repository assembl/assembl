define(['jasmine', 'jquery', '../app/common/context'], function (jasmine, $, Ctx) {

    return describe('Context module', function () {

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

    });

});
