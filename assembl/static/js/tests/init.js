define(['jquery', 'jasmine-html'], function($, jasmine){
    var jasmineEnv = jasmine.getEnv();
    jasmineEnv.updateInterval = 1000;

    var htmlReporter = new jasmine.HtmlReporter();

    jasmineEnv.addReporter(htmlReporter);

    jasmineEnv.specFilter = function(spec) {
        return htmlReporter.specFilter(spec);
    };

    var specs = [
        'tests/test_app',
        'tests/test_ideaList',
        'tests/test_modeIdea',
        'tests/test_ideaView',
        //'tests/test_lateralMenu',
        'tests/test_segmentList'
    ];

    $(function(){
        require(specs, function(){
            jasmineEnv.execute();
        });
    });

});
