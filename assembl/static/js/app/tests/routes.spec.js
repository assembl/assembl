define(['router'], function (Router) {

    return describe('Routes Specs', function () {

        var route = undefined;

        beforeEach(function(){
           route = new Router();
           route = route.appRoutes;
        });

        it('Home route should exist', function () {
            expect(route['']).toEqual('home');
        });

        it('Edition route should exist', function () {
            expect(route['edition']).toEqual('edition');
        });

        it('Partners route should exist', function () {
            expect(route['partners']).toEqual('partners');
        });

        it('Notifications route should exist', function () {
            expect(route['notifications']).toEqual('notifications');
        });

        it('Users notifications route should exist', function () {
            expect(route['users/notifications']).toEqual('userNotifications');
        });

        it('Users edit route should exist', function () {
            expect(route['users/edit']).toEqual('profile');
        });

        it('Posts id route should exist', function () {
            expect(route['posts/:id']).toEqual('post');
        });

        it('Idea id route should exist', function () {
            expect(route['idea/:id']).toEqual('idea');
        });

        it('Defaults route should exist', function () {
            expect(route['*actions']).toEqual('defaults');
        });

    });

});
