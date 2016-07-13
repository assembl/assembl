/** @module app.tests.mock_server */

var Sinon = require('sinon'),
    Backbone = require('backbone'),
    $ = require('jquery'),
    _ = require('underscore');

/**
 * transform an ajax call into the equivalent recorded API call fixture from
 * :py:func:`assembl.tests.base.api_call_to_fname`
 * @function app.tests.mock_server.ajaxMock
 *
 * @param      {string}  url       The url
 * @param      {object}  settings  The settings
 */
function ajaxMock(url, settings) {
  if (settings === undefined && _.isObject(url)) {
    settings = url;
    url = settings.url;
  }
  var pos = url.lastIndexOf('/') + 1,
      dirname = url.substring(0, pos),
      fname = url.substring(pos),
      pos_args = fname.indexOf('?'),
      method = settings.method || "GET",
      data = settings.data;

  if (method !== 'GET') {
    fname = method + '_' + fname;
  }
  if (pos_args >= 0) {
    var args = fname.substring(pos_args+1);
    fname = fname.substring(0, pos_args);
    args = args.split('&');
    data = {}
    for (var i=0; i < args.length; i++) {
      var parts = args[i].split('=', 2);
      data[parts[0]] = parts[1];
    }
  }
  if (data === undefined) {
    // noop
  } else if (_.isArray(data)) {
    console.warning('not implemented test case');
  } else if (_.isObject(data)) {
    if (method === "GET") {
      // Put the arguments in the filename, alphabetically.
      var pairs = _.pairs(data);
      pairs = _.map(pairs, function(p) {
        return p[0] + '_' + encodeURIComponent(p[1]);
      });
      pairs.sort();
      pairs = _.reduce(pairs, function(memo, p) {
        return memo + '_' + p;
      }, '');
      if (pairs !== '') {
        fname = fname + pairs;
      }
      settings.data = undefined;
    } else {
      // Not clear what to do here
    }
  } else if (_.isString(data)) {
    // probably a POST, not a GET
    console.warning('not implemented test case');
  } else {
    console.log('invalid')
  }
  url = '/static/js/app/tests/fixtures' + dirname + fname + '.json';
  console.log('fetching ' + url);
  return $.get(url, null, settings.success);
}

function setupMockAjax() {
  Sinon.stub(Backbone, "ajax", ajaxMock);
}

function tearDownMockAjax() {
  Backbone.ajax.restore();
}

module.exports = {
  setupMockAjax: setupMockAjax,
  tearDownMockAjax: tearDownMockAjax,
};
