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
        'tests/test_modelEmail',
        'tests/test_emailView',
        'tests/test_lateralMenu'
    ];

    $(function(){
        require(specs, function(){
            jasmineEnv.execute();
        });
    });

});
