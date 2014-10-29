requirejs.config(requirejs_config);

require(['jquery', 'jasmine-boot'],
    function ($, jasmine_boot) {
        'use strict';
        var jasmineEnv = jasmine.getEnv();
        jasmineEnv.updateInterval = 1000;
        $('#wrapper').hide();
        require([
            'test_app'
            // 'tests/test_ideaView',
            // 'tests/test_ideaPanelView',
            // 'tests/test_ideaList',
            // 'tests/test_ideaModel',
            // 'tests/test_segmentList'
        ], function () {
            // Initialize the HTML Reporter and execute the environment (setup by `boot.js`)
            window.onload();
        });
    });
