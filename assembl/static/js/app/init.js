/**
 * BDD & TDD testing
 *
 * http://mochajs.org/
 *
 * http://chaijs.com/api/
 *
 * */

var mocha = require('mocha'),
    chai = require('chai'),
    chaiJquery = require('chai-jquery');

(function(){
    chai.use(chaiJquery);

    //mocha.setup('bdd');
    //mocha.bail(false);

    require([
        //'tests/views.spec',
        'tests/routes.spec',
        'tests/context.spec',
        'tests/models.spec',
        'tests/utils.spec',
        'tests/objects.spec'
    ], function(require) {
        mocha.run();
    });

})();

