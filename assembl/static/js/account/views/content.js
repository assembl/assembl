define(function (require) {
    'use strict';

    var Marionette = require('marionette');

    var ContentLayout = Marionette.LayoutView.extend({
        template: "#tmpl-template-content",

        regions: {
            region1: "#region1",
            region2: "#region2",
            region3: "#region3",
            region4: "#region4",
            region5: "#region5"
        }
    });

    return ContentLayout;

});