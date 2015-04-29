"use strict";

define(['backbone.marionette'], function (Marionette) {

    var helperDebate = Marionette.ItemView.extend({
        template: '#tmpl-helperDebate'
    });

    return helperDebate;
});