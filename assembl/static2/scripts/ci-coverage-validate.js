const validate = require('jest-coverage-validator').validate;

function fail(failures) {
  global.console.error('Code coverage does not meet minimum threshold.');
  global.console.error('Failures: ', failures);
  process.exit(1);
}

function pass() {
  global.console.log('Yay, code coverage didn\'t go down!');
  process.exit(0);
}

validate(fail, pass);