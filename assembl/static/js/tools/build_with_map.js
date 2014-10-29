// /js -> r.js -o build/build.js
({
    paths: {
        'jquery': "bower/jquery/jquery",
        'jquery-highlight': 'lib/jquery-highlight/jquery.highlight',
        'jquery.dotdotdot': 'bower/jquery.dotdotdot/src/js/jquery.dotdotdot.min',
        'backbone': 'bower/backbone/backbone',
        'BackboneSubset': 'bower/Backbone.Subset/backbone.subset',
        'underscore': 'bower/underscore/underscore',
        'annotator': 'lib/annotator/annotator-full.min',
        'jasmine': 'bower/jasmine/lib/jasmine-core/jasmine',
        'jasmine-html': 'bower/jasmine/lib/jasmine-core/jasmine-html',
        'jasmine-boot': 'bower/jasmine/lib/jasmine-core/boot',
        'ckeditor': 'bower/ckeditor/ckeditor',
        'ckeditor-sharedspace': 'lib/ckeditor-sharedcontainer/plugin',
        'moment': 'bower/momentjs/min/moment-with-locales.min',
        'zeroclipboard': 'bower/zeroclipboard/ZeroClipboard',
        'sockjs': 'bower/sockjs/sockjs',
        'cytoscape': 'bower/cytoscape/dist/cytoscape',
        'jit': 'bower/jit/Jit/jit',
        'jed': 'bower/jed/jed',
        'backboneModal': 'lib/backbone-modal/backbone.modal',
        'marionette': 'bower/marionette/lib/backbone.marionette.min',
        'd3': 'bower/d3/d3.min',
        'bootstrap': 'lib/bootstrap'
    },
    shim: {
        'backbone': {
            exports: 'Backbone'
        },
        'underscore': {
            exports: '_'
        },
        'jquery': {
            exports: 'jQuery'
        },
        'jquery-highlight': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'jquery.dotdotdot': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'modules/context': {
            deps: ['annotator', 'ckeditor', 'utils/i18n', 'jquery-highlight', 'jquery.dotdotdot'],
            exports: 'context'
        },
        'utils/i18n': {
            deps: ['jed'],
            exports: 'i18n'
        },
        'socket': {
            deps: ['sockjs']
        },
        'jasmine': {
            exports: 'window.jasmineRequire'
        },
        'jasmine-html': {
            deps: ['jasmine'],
            exports: 'window.jasmineRequire'
        },
        'jasmine-boot': {
            deps: ['jasmine', 'jasmine-html'],
            exports: 'window.jasmineRequire'
        },
        'ckeditor': {
            exports: 'CKEDITOR'
        },
        'ckeditor-sharedspace': {
            deps: ['ckeditor'],
            exports: 'CKEDITOR'
        },
        'tipsy': {
            deps: ['jquery']
        },
        'zeroclipboard': {
            exports: 'ZeroClipboard'
        },
        'sockjs': {
            deps: ['jquery'],
            exports: 'SockJS'
        },
        'cytoscape': {
            deps: ['jquery'],
            exports: 'cytoscape'
        },
        'jit': {
            deps: [],
            exports: '$jit'
        },
        'annotator': {
            deps: ['jquery'],
            exports: 'Annotator'
        },
        'backboneModal': {
            deps: ['backbone'],
            exports: 'BackboneModal'
        },
        'BackboneSubset': {
            deps: ['backbone'],
            exports: 'BackboneSubset'
        },
        'modal': {
            deps: ['backbone'],
            exports: 'Modal'
        },
        'bootstrap': {
            deps: ['jquery']
        }
    },
    baseUrl: "..",
    removeCombined: false,
    optimize: "uglify2",
    findNestedDependencies: true,
    dir: 'dist',
    generateSourceMaps: true,
    preserveLicenseComments: false,
    modules: [
        {
            name: "infrastructure"
        },
        {
            name: "main",
            exclude: [
                "infrastructure"
            ]
        }
    ]
})
