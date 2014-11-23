/**
 * Wrapper for Jed
 *
 * */
'use strict';

define(['jed'], function (Jed) {
    /* json is a global set in javascript.jinja2 */
    return new Jed(json);

});