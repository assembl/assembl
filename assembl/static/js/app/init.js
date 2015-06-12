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

require('tests/routes.spec');
require('tests/context.spec');
require('tests/models.spec');
require('tests/utils.spec');
require('tests/objects.spec');

chai.use(chaiJquery);
mocha.run();

