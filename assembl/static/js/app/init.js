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

require('./tests/routes.spec.js');
require('./tests/context.spec.js');
require('./tests/models.spec.js');
require('./tests/utils.spec.js');
require('./tests/objects.spec.js');

chai.use(chaiJquery);
mocha.run();
