
var Router = require('../router.js'),
    expect = require('chai').expect;

var expect = chai.expect;

return describe('Routes Specs', function () {

    var route = undefined;

    beforeEach(function(){
       route = new Router();
       route = route.appRoutes;
    });

    it('Home route should exist', function () {
        expect(route['']).to.equal('home');
    });

    it('Edition route should exist', function () {
        expect(route['edition']).to.equal('edition');
    });

    it('Partners route should exist', function () {
        expect(route['partners']).to.equal('partners');
    });

    it('Notifications route should exist', function () {
        expect(route['notifications']).to.equal('notifications');
    });

    it('Users notifications route should exist', function () {
        expect(route['user/notifications']).to.equal('userNotifications');
    });

    it('Users edit route should exist', function () {
        expect(route['user/profile']).to.equal('profile');
    });

    it('Posts id route should exist', function () {
        expect(route['posts/:id']).to.equal('post');
    });

    it('Idea id route should exist', function () {
        expect(route['idea/:id']).to.equal('idea');
    });

    it('Defaults route should exist', function () {
        expect(route['*actions']).to.equal('defaults');
    });

});
