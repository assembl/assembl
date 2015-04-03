requirejs.config(requirejs_config);

/*require(['jquery', 'jasmine-boot'], function ($, jasmine_boot) {
        'use strict';

        $('#wrapper').hide();

        var jasmineEnv = jasmine.getEnv();
        jasmineEnv.updateInterval = 1000;

        require([
            'tests/views.spec',
            'tests/routes.spec',
            'tests/context.spec',
            'tests/models.spec',
            'tests/utils.spec',
            'tests/objects.spec'
        ], function () {
            // Initialize the HTML Reporter and execute the environment (setup by `boot.js`)
            window.onload();

        });
    });*/

/**
 * BDD & TDD testing
 *
 * http://mochajs.org/
 *
 * http://chaijs.com/api/
 *
 * */

require(['mocha', 'chai', 'chai-jquery'], function(mocha, chai, chaiJquery){
    // Chai
    //var should = chai.should();
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

});
