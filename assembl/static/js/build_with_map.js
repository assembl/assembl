({
    appDir: './',
    baseUrl: './app',
    dir: './dist',
    modules: [
        {
            name: 'main',
            include: ['requireLib']
        }
    ],
    fileExclusionRegExp: /^(r|build)\.js$/,
    optimizeCss: 'standard',
    removeCombined: false,
    wrapShim: true,
    generateSourceMaps: true,
    optimize: "uglify2",
    preserveLicenseComments: false,
    paths: {
        'requireLib': '../bower/requirejs/require',

        'jquery': "../bower/jquery/jquery",
        'jquery-highlight': '../lib/jquery-highlight/jquery.highlight',
        'jquery.dotdotdot': '../bower/jquery.dotdotdot/src/js/jquery.dotdotdot',

        'backbone': '../bower/backbone/backbone',
        'backbone.subset': '../bower/Backbone.Subset/backbone.subset',
        'underscore': '../bower/underscore/underscore',
        'backbone.marionette.modals': '../bower/backbone-modal/backbone.marionette.modals',
        'backbone.modal': '../bower/backbone-modal/backbone.modal',
        'backbone.marionette': '../bower/marionette/lib/backbone.marionette',

        'annotator': '../lib/annotator/annotator-full.min',

        'jasmine': '../bower/jasmine/lib/jasmine-core/jasmine',
        'jasmine-html': '../bower/jasmine/lib/jasmine-core/jasmine-html',
        'jasmine-boot': '../bower/jasmine/lib/jasmine-core/boot',

        'ckeditor': '../bower/ckeditor/ckeditor',
        'ckeditor-sharedspace': '../lib/ckeditor-sharedcontainer/plugin',

        'moment': '../bower/momentjs/min/moment-with-locales.min',
        'sockjs': '../bower/sockjs/sockjs',
        'cytoscape': '../bower/cytoscape/dist/cytoscape',
        'jit': '../bower/jit/Jit/jit',
        'jed': '../bower/jed/jed',
        'd3': '../bower/d3/d3.min',
        'bootstrap': '../lib/bootstrap'
    },
    shim: {
        'underscore': {
            exports: '_'
        },
        'jquery': {
            exports: 'jQuery'
        },
        'backbone': {
            deps: ['underscore', 'jquery'],
            exports: 'Backbone'
        },
        'jquery-highlight': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'jquery.dotdotdot': {
            deps: ['jquery'],
            exports: 'jQuery'
        },
        'common/context': {
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
        'sockjs': {
            deps: ['jquery'],
            exports: 'SockJS'
        },
        'cytoscape': {
            deps: ['jquery'],
            exports: 'cytoscape'
        },
        'jit': {
            exports: '$jit'
        },
        'annotator': {
            deps: ['jquery'],
            exports: 'Annotator'
        },
        'backbone.subset': {
            deps: ['backbone']
        },
        'bootstrap': {
            deps: ['jquery']
        }
    }
})